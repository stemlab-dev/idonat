import Reward from '../models/Reward.js';
import Redemption from '../models/Redemption.js';
import Donor from '../models/Donor.js';
import { sendSMS } from '../services/notificationService.js';

// Get all available rewards
export const getRewards = async (req, res) => {
	try {
		const { category, minCost, maxCost, available } = req.query;

		const filter = {};
		if (category) filter.category = category;
		if (minCost || maxCost) {
			filter.cost = {};
			if (minCost) filter.cost.$gte = parseInt(minCost);
			if (maxCost) filter.cost.$lte = parseInt(maxCost);
		}
		if (available) filter.available = available === 'true';

		const rewards = await Reward.find(filter).sort({ cost: 1 });
		res.json(rewards);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Redeem a reward
export const redeemReward = async (req, res) => {
	try {
		const { userId, rewardId } = req.body;

		// Verify user exists and get token balance
		const user = await Donor.findById(userId);
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		// Verify reward exists and is available
		const reward = await Reward.findById(rewardId);
		if (!reward || !reward.available) {
			return res.status(400).json({ message: 'Reward not available' });
		}

		// Check stock
		if (reward.stock === 0) {
			return res.status(400).json({ message: 'Reward out of stock' });
		}

		// Check token balance
		if (user.tokenBalance < reward.cost) {
			return res.status(400).json({ message: 'Insufficient tokens' });
		}

		// Generate redemption code
		const redemptionCode = generateRedemptionCode();

		// Create redemption record
		const redemption = new Redemption({
			user: userId,
			reward: rewardId,
			tokensDeducted: reward.cost,
			code: redemptionCode,
		});

		// Deduct tokens from user
		user.tokenBalance -= reward.cost;

		// Decrease reward stock if not unlimited
		if (reward.stock > 0) {
			reward.stock -= 1;
			if (reward.stock === 0) {
				reward.available = false;
			}
			await reward.save();
		}

		await Promise.all([redemption.save(), user.save()]);

		// Notify user
		await sendSMS(
			user.phone,
			`You redeemed: ${reward.name}. Use code ${redemptionCode} to claim.`
		);

		res.json({
			message: 'Reward redeemed successfully',
			redemption,
			remainingBalance: user.tokenBalance,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Get user's redemption history
export const getRedemptionHistory = async (req, res) => {
	try {
		const redemptions = await Redemption.find({ user: req.params.userId })
			.populate('reward')
			.sort({ redeemedAt: -1 });

		res.json(redemptions);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Helper function to generate redemption code
const generateRedemptionCode = () => {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	let result = '';
	for (let i = 0; i < 8; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
};
