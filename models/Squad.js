import mongoose from 'mongoose';

const squadSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		unique: true,
	},
	description: {
		type: String,
	},
	city: {
		type: String,
		required: true,
	},
	avatar: {
		type: String,
		default: '/api/placeholder/60/60',
	},
	leader: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Donor',
		required: true,
	},
	members: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Donor',
		},
	],
	totalDonations: {
		type: Number,
		default: 0,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		default: Date.now,
	},
});

// Update the updatedAt field before saving
squadSchema.pre('save', function (next) {
	this.updatedAt = new Date();
	next();
});

// Method to add a member to the squad
squadSchema.methods.addMember = async function (donorId) {
	if (!this.members.includes(donorId)) {
		this.members.push(donorId);
		await this.save();
	}
};

// Method to remove a member from the squad
squadSchema.methods.removeMember = async function (donorId) {
	this.members = this.members.filter(
		(member) => member.toString() !== donorId.toString()
	);
	await this.save();
};

// Method to update squad donation count
squadSchema.methods.updateDonationCount = async function () {
	const LeaderboardEntry = mongoose.model('LeaderboardEntry');
	const memberStats = await LeaderboardEntry.find({
		donor: { $in: this.members },
	});

	this.totalDonations = memberStats.reduce(
		(sum, entry) => sum + entry.donations,
		0
	);
	await this.save();
};

const Squad = mongoose.model('Squad', squadSchema);

export default Squad;
