import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		cost: {
			type: Number,
			required: true,
			min: 0,
		},
		category: {
			type: String,
			enum: ['Health', 'Wellness', 'Social', 'Other'],
			required: true,
		},
		available: {
			type: Boolean,
			default: true,
		},
		stock: {
			type: Number,
			default: -1, // -1 means unlimited
		},
		imageUrl: {
			type: String,
		},
		expiryDate: {
			type: Date,
		},
		partner: {
			type: String,
		},
	},
	{ timestamps: true }
);

const Reward = mongoose.model('Reward', rewardSchema);

export default Reward;
