// scripts/initAchievements.js
import Achievement from '../models/Achievement.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const defaultAchievements = [
	{
		name: 'First Donation',
		description: 'Make your first blood donation',
		icon: 'star',
		maxProgress: 1,
		rewardTokens: 100,
		category: 'donation',
	},
	{
		name: 'Monthly Hero',
		description: 'Donate at least once a month for 5 consecutive months',
		icon: 'calendar',
		maxProgress: 5,
		rewardTokens: 500,
		category: 'streak',
	},
	{
		name: 'Life Saver',
		description: 'Complete 20 donations',
		icon: 'award',
		maxProgress: 20,
		rewardTokens: 2000,
		category: 'donation',
	},
	{
		name: 'Community Builder',
		description: 'Refer 10 friends who become active donors',
		icon: 'users',
		maxProgress: 10,
		rewardTokens: 1000,
		category: 'community',
		isHidden: true, // Hidden until user makes first referral
	},
];

async function initAchievements() {
	await mongoose.connect(process.env.MONGO_URI);

	for (const achievementData of defaultAchievements) {
		await Achievement.findOneAndUpdate(
			{ name: achievementData.name },
			achievementData,
			{ upsert: true }
		);
	}

	console.log('Default achievements initialized');
	process.exit(0);
}

initAchievements().catch(console.error);
