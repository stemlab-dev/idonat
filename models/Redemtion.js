import mongoose from 'mongoose';

const redemptionSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Donor',
			required: true,
		},
		reward: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Reward',
			required: true,
		},
		redeemedAt: {
			type: Date,
			default: Date.now,
		},
		status: {
			type: String,
			enum: ['pending', 'fulfilled', 'cancelled'],
			default: 'pending',
		},
		code: {
			type: String,
			unique: true,
		},
		tokensDeducted: {
			type: Number,
			required: true,
		},
	},
	{ timestamps: true }
);

const Redemption = mongoose.model('Redemption', redemptionSchema);

export default Redemption;
