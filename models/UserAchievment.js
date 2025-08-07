import mongoose from 'mongoose';

const userAchievementSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Donor',
			required: true,
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Donor',
			required: true,
		},
		achievement: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Achievement',
			required: true,
		},
		progress: {
			type: Number,
			default: 0,
		},
		unlocked: {
			type: Boolean,
			default: false,
		},
		unlockedAt: {
			type: Date,
		},
	},
	{ timestamps: true }
);

// Compound index to ensure one achievement per user
userAchievementSchema.index({ user: 1, achievement: 1 }, { unique: true });

const UserAchievement = mongoose.model(
	'UserAchievement',
	userAchievementSchema
);

export default UserAchievement;
