import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	address: {
		type: String,
		required: true,
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
	contactPhone: {
		type: String,
		required: true,
	},
	contactEmail: String,
	bloodInventory: [
		{
			bloodType: {
				type: String,
				enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
			},
			quantity: Number,
			lastUpdated: Date,
		},
	],
	isVerified: {
		type: Boolean,
		default: false,
	},
});

hospitalSchema.index({ location: '2dsphere' });

const Hospital = mongoose.model('Hospital', hospitalSchema);

export default Hospital;
