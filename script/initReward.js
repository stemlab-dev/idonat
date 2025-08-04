// scripts/initRewards.js
import Reward from '../models/Reward.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const defaultRewards = [
	{
		name: 'Health Insurance Discount',
		description: '10% off your next HMO premium',
		cost: 500,
		category: 'Health',
		available: true,
		stock: 100,
	},
	{
		name: 'Pharmacy Voucher',
		description: '₦5,000 voucher for medications',
		cost: 800,
		category: 'Health',
		available: true,
		stock: 50,
	},
	{
		name: 'Fitness Center Membership',
		description: '3-month gym membership',
		cost: 1200,
		category: 'Wellness',
		available: true,
		stock: 20,
	},
	{
		name: 'Exclusive Donor Badge',
		description: 'Premium digital badge for social media',
		cost: 300,
		category: 'Social',
		available: true,
		stock: -1, // Unlimited
	},
];

async function initRewards() {
	await mongoose.connect(process.env.MONGO_URI);

	for (const rewardData of defaultRewards) {
		await Reward.findOneAndUpdate({ name: rewardData.name }, rewardData, {
			upsert: true,
		});
	}

	console.log('Default rewards initialized');
	process.exit(0);
}

initRewards().catch(console.error);
