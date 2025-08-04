import LeaderboardEntry from '../models/Leaderboard.js';
import Donor from '../models/Donor.js';

// Get leaderboard
export const getLeaderboard = async (req, res) => {
	try {
		const { city, limit = 10 } = req.query;

		let query = {};
		if (city) {
			// Find donors from the specified city first
			const cityDonors = await Donor.find({ 'location.city': city }).select(
				'_id'
			);
			query.donor = { $in: cityDonors.map((d) => d._id) };
		}

		const leaderboard = await LeaderboardEntry.find(query)
			.sort({ donations: -1, streak: -1 })
			.limit(parseInt(limit))
			.populate({
				path: 'donor',
				select: 'name avatar location.city',
			});

		// Add rank to each entry
		const rankedLeaderboard = leaderboard.map((entry, index) => ({
			rank: index + 1,
			name: entry.donor.name,
			avatar: entry.donor.avatar || '/api/placeholder/40/40',
			donations: entry.donations,
			city: entry.donor.location?.city || 'Unknown',
			streak: entry.streak,
			tokens: entry.tokens,
			badges: entry.badges,
		}));

		res.json(rankedLeaderboard);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Update leaderboard when a donation occurs
export const updateDonorStats = async (donorId, donationSuccess) => {
	try {
		const entry = await LeaderboardEntry.findOneAndUpdate(
			{ donor: donorId },
			{
				$inc: {
					donations: donationSuccess ? 1 : 0,
					streak: donationSuccess ? 1 : -1,
					tokens: donationSuccess ? 100 : 0,
				},
				$set: {
					lastUpdated: new Date(),
				},
			},
			{ upsert: true, new: true }
		);

		// Award badges based on donation count
		const badgesToAdd = [];
		if (entry.donations >= 40) badgesToAdd.push('Gold Donor');
		else if (entry.donations >= 30) badgesToAdd.push('Silver Donor');
		else if (entry.donations >= 20) badgesToAdd.push('Bronze Donor');
		else if (entry.donations >= 10) badgesToAdd.push('Regular Donor');
		else if (entry.donations >= 5) badgesToAdd.push('Rising Star');

		if (entry.streak >= 20) badgesToAdd.push('Life Saver');
		if (entry.streak >= 10) badgesToAdd.push('Monthly Hero');

		if (badgesToAdd.length > 0) {
			await LeaderboardEntry.updateOne(
				{ donor: donorId },
				{ $addToSet: { badges: { $each: badgesToAdd } } }
			);
		}

		return entry;
	} catch (error) {
		console.error('Error updating leaderboard:', error);
	}
};

// Get donor's position on leaderboard
export const getDonorRank = async (req, res) => {
	try {
		const { donorId } = req.params;

		// First get the donor's stats
		const donorStats = await LeaderboardEntry.findOne({ donor: donorId });
		if (!donorStats) {
			return res
				.status(404)
				.json({ message: 'Donor not found on leaderboard' });
		}

		// Then count how many donors have more or equal donations
		const rank =
			(await LeaderboardEntry.countDocuments({
				$or: [
					{ donations: { $gt: donorStats.donations } },
					{
						donations: donorStats.donations,
						streak: { $gt: donorStats.streak },
					},
				],
			})) + 1;

		res.json({
			rank,
			donations: donorStats.donations,
			streak: donorStats.streak,
			tokens: donorStats.tokens,
			badges: donorStats.badges,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
