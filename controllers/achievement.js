import Achievement from '../models/Achievement.js';
import UserAchievement from '../models/UserAchievement.js';

// Get all available achievements
export const getAchievements = async (req, res) => {
	try {
		const achievements = await Achievement.find({ isHidden: false });
		res.json(achievements);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Get user's achievements
export const getUserAchievements = async (req, res) => {
	try {
		const userId = req.params.userId;

		const userAchievements = await UserAchievement.find({
			user: userId,
		}).populate('achievement');

		res.json(userAchievements);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Update user's achievement progress
export const updateAchievementProgress = async (
	userId,
	achievementName,
	increment = 1
) => {
	try {
		// Find the achievement
		const achievement = await Achievement.findOne({ name: achievementName });
		if (!achievement) return null;

		// Find or create user achievement record
		let userAchievement = await UserAchievement.findOne({
			user: userId,
			achievement: achievement._id,
		});

		if (!userAchievement) {
			userAchievement = new UserAchievement({
				user: userId,
				achievement: achievement._id,
				progress: 0,
			});
		}

		// Don't update if already unlocked
		if (userAchievement.unlocked) return userAchievement;

		// Update progress
		userAchievement.progress += increment;

		// Check if achievement is unlocked
		if (userAchievement.progress >= achievement.maxProgress) {
			userAchievement.unlocked = true;
			userAchievement.unlockedAt = new Date();

			// Return the unlocked achievement with reward info
			return {
				userAchievement,
				rewardTokens: achievement.rewardTokens,
			};
		}

		await userAchievement.save();
		return { userAchievement, rewardTokens: 0 };
	} catch (error) {
		console.error('Error updating achievement:', error);
		return null;
	}
};

// Check for newly unlocked achievements
export const checkForAchievements = async (userId, donationData) => {
	try {
		const unlockedAchievements = [];
		let totalRewardTokens = 0;

		// Check donation count achievements
		const donationCountUpdate = await updateAchievementProgress(
			userId,
			'First Donation',
			donationData.isFirst ? 100 : 0 // Mark as complete if first donation
		);

		if (donationCountUpdate?.userAchievement?.unlocked) {
			unlockedAchievements.push(donationCountUpdate.userAchievement);
			totalRewardTokens += donationCountUpdate.rewardTokens;
		}

		// Check streak achievements
		const streakUpdate = await updateAchievementProgress(
			userId,
			'Monthly Hero',
			donationData.streakDays >= 30 ? 1 : 0
		);

		if (streakUpdate?.userAchievement?.unlocked) {
			unlockedAchievements.push(streakUpdate.userAchievement);
			totalRewardTokens += streakUpdate.rewardTokens;
		}

		// Check for other achievements as needed...

		return {
			unlockedAchievements,
			totalRewardTokens,
		};
	} catch (error) {
		console.error('Error checking achievements:', error);
		return { unlockedAchievements: [], totalRewardTokens: 0 };
	}
};
