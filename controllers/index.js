import mongoose from 'mongoose';
import Donor from '../models/Donor.js';
import User from '../models/User.js';
import Squad from '../models/Squad.js';
import UserAchievement from '../models/UserAchievment.js';
export const getUserDashboard = async (req, res) => {
	try {
		const userId = req.user._id;

		const squad = await Squad.findOne({
			user: userId,
		});
		const donor = await Donor.findOne({
			user: userId,
		});
		const userAchievements = await UserAchievement.findOne({
			user: userId,
		}).populate('achievement');

		res.json({ userAchievements, squad, donor });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
