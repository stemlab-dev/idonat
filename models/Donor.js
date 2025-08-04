import mongoose from 'mongoose';

const donorSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	phone: {
		type: String,
		required: true,
		unique: true,
	},
	bloodType: {
		type: String,
		required: true,
		enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
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
	lastDonationDate: Date,
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
});

donorSchema.index({ location: '2dsphere' });

const Donor = mongoose.model('Donor', donorSchema);

export default Donor;
