import Squad from '../models/Squad.js';
import Donor from '../models/Donor.js';
import LeaderboardEntry from '../models/Leaderboard.js';

// Create a new squad
export const createSquad = async (req, res) => {
	try {
		const { name, description, city, leaderId } = req.body;

		// Verify leader exists
		const leader = await Donor.findById(leaderId);
		if (!leader) {
			return res.status(404).json({ message: 'Leader donor not found' });
		}

		const squad = new Squad({
			name,
			description,
			city,
			leader: leaderId,
			members: [leaderId], // Leader is automatically a member
		});

		await squad.save();

		res.status(201).json(squad);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Get all squads
export const getSquads = async (req, res) => {
	try {
		const { city, sortBy = 'totalDonations', limit = 10 } = req.query;

		let query = {};
		if (city) query.city = city;

		let sortOption = {};
		if (sortBy === 'totalDonations') sortOption = { totalDonations: -1 };
		else if (sortBy === 'members') sortOption = { members: -1 };
		else if (sortBy === 'newest') sortOption = { createdAt: -1 };

		const squads = await Squad.find(query)
			.sort(sortOption)
			.limit(parseInt(limit))
			.populate({
				path: 'leader',
				select: 'name avatar',
			});

		// Add rank based on totalDonations if that's the sort criteria
		let rankedSquads = squads;
		if (sortBy === 'totalDonations') {
			rankedSquads = squads.map((squad, index) => ({
				...squad.toObject(),
				rank: index + 1,
			}));
		}

		res.json(rankedSquads);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Get squad details
export const getSquad = async (req, res) => {
	try {
		const squad = await Squad.findById(req.params.id)
			.populate({
				path: 'leader',
				select: 'name avatar',
			})
			.populate({
				path: 'members',
				select: 'name avatar',
				options: { limit: 10 }, // Limit to first 10 members for preview
			});

		if (!squad) {
			return res.status(404).json({ message: 'Squad not found' });
		}

		res.json(squad);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Join a squad
export const joinSquad = async (req, res) => {
	try {
		const { squadId, donorId } = req.body;

		const squad = await Squad.findById(squadId);
		if (!squad) {
			return res.status(404).json({ message: 'Squad not found' });
		}

		// Check if donor is already a member
		if (squad.members.includes(donorId)) {
			return res
				.status(400)
				.json({ message: 'Donor is already a member of this squad' });
		}

		await squad.addMember(donorId);
		await squad.updateDonationCount();

		res.json({ message: 'Successfully joined squad', squad });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Leave a squad
export const leaveSquad = async (req, res) => {
	try {
		const { squadId, donorId } = req.body;

		const squad = await Squad.findById(squadId);
		if (!squad) {
			return res.status(404).json({ message: 'Squad not found' });
		}

		// Check if donor is the leader (leaders can't leave, must transfer leadership first)
		if (squad.leader.toString() === donorId) {
			return res
				.status(400)
				.json({
					message: 'Squad leader must transfer leadership before leaving',
				});
		}

		await squad.removeMember(donorId);
		await squad.updateDonationCount();

		res.json({ message: 'Successfully left squad', squad });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Update squad donation count (call this periodically)
export const updateAllSquadDonations = async () => {
	try {
		const squads = await Squad.find();

		for (const squad of squads) {
			await squad.updateDonationCount();
		}

		console.log('Updated donation counts for all squads');
	} catch (error) {
		console.error('Error updating squad donations:', error);
	}
};

// Get squad leaderboard
export const getSquadLeaderboard = async (req, res) => {
	try {
		const { city, limit = 10 } = req.query;

		let query = {};
		if (city) query.city = city;

		const squads = await Squad.find(query)
			.sort({ totalDonations: -1 })
			.limit(parseInt(limit))
			.populate({
				path: 'leader',
				select: 'name',
			});

		const rankedSquads = squads.map((squad, index) => ({
			id: squad._id,
			name: squad.name,
			members: squad.members.length,
			totalDonations: squad.totalDonations,
			city: squad.city,
			rank: index + 1,
			avatar: squad.avatar,
			leader: squad.leader.name,
			description: squad.description,
		}));

		res.json(rankedSquads);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
