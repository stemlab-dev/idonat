import mongoose from 'mongoose';

const donorSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	bloodType: {
		type: String,
		required: true,
		enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
	},
	weight: {
		type: String,
	},
	height: {
		type: String,
	},
	note: {
		type: String,
	},
	dateOfBirth: {
		type: Date,
		default: Date.now,
	},
	medicalConditions: [
		{
			type: String,
		},
	],
	medications: [
		{
			type: String,
		},
	],
	allergies: [
		{
			type: String,
		},
	],
	isEligible: {
		type: Boolean,
		default: false,
	},
	location: {
		type: {
			type: String,
			default: 'Point',
		},
		coordinates: {
			type: [Number],
			required: true,
		},
	},
	donationCount: {
		type: Number,
		default: 0,
	},
	rewards: {
		badges: [String],
		healthCredits: {
			type: Number,
			default: 0,
		},
	},
	isActive: {
		type: Boolean,
		default: true,
	},
	registrationDate: {
		type: Date,
		default: Date.now,
	},
	lastDonationDate: {
		type: Date,
		default: Date.now,
	},
});

donorSchema.index({ location: '2dsphere' });

const Donor = mongoose.model('Donor', donorSchema);

export default Donor;
