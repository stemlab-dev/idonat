import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		unique: true,
	},
	description: {
		type: String,
		required: true,
	},
	icon: {
		type: String,
		required: true,
	},
	maxProgress: {
		type: Number,
		required: true,
	},
	rewardTokens: {
		type: Number,
		default: 0,
	},
	isHidden: {
		type: Boolean,
		default: false,
	},
	category: {
		type: String,
		enum: ['donation', 'streak', 'community', 'special'],
		default: 'donation',
	},
});

const Achievement = mongoose.model('Achievement', achievementSchema);

export default Achievement;
