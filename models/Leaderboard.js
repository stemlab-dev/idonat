import mongoose from 'mongoose';

const leaderboardEntrySchema = new mongoose.Schema({
	donor: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Donor',
		required: true,
		unique: true,
	},
	donations: {
		type: Number,
		default: 0,
	},
	streak: {
		type: Number,
		default: 0,
	},
	tokens: {
		type: Number,
		default: 0,
	},
	badges: [
		{
			type: String,
		},
	],
	lastUpdated: {
		type: Date,
		default: Date.now,
	},
});

// Add a compound index for sorting
leaderboardEntrySchema.index({ donations: -1, streak: -1 });

const LeaderboardEntry = mongoose.model(
	'LeaderboardEntry',
	leaderboardEntrySchema
);

export default LeaderboardEntry;
