import mongoose from 'mongoose';

const bloodRequestSchema = new mongoose.Schema({
	hospital: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Hospital',
		required: true,
	},
	bloodType: {
		type: String,
		required: true,
		enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
	},
	quantity: {
		type: Number,
		required: true,
		min: 1,
		max: 10, // Maximum units per request (configurable)
	},
	urgency: {
		type: String,
		enum: ['low', 'medium', 'high', 'critical'],
		default: 'medium',
	},
	status: {
		type: String,
		enum: [
			'pending',
			'fulfilled',
			'partially-fulfilled',
			'cancelled',
			'expired',
		],
		default: 'pending',
	},
	matchedDonors: [
		{
			donor: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Donor',
			},
			notifiedAt: {
				type: Date,
				default: Date.now,
			},
			responded: {
				type: Boolean,
				default: false,
			},
			donated: {
				type: Boolean,
				default: false,
			},
			response: {
				type: String,
				enum: ['pending', 'positive', 'negative'],
				default: 'pending',
			},
		},
	],
	requiredBy: {
		type: Date,
		required: true,
		validate: {
			validator: function (value) {
				return value > new Date();
			},
			message: 'Required by date must be in the future',
		},
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		default: Date.now,
	},
	fulfilledAt: Date,
	notes: String,
});

// Update the updatedAt field before saving
bloodRequestSchema.pre('save', function (next) {
	this.updatedAt = new Date();
	next();
});

// Static method to find pending requests
bloodRequestSchema.statics.findPendingRequests = function () {
	return this.find({ status: 'pending' })
		.populate('hospital')
		.populate('matchedDonors.donor');
};

// Instance method to check if request is expired
bloodRequestSchema.methods.isExpired = function () {
	return this.requiredBy < new Date() && this.status === 'pending';
};

// Instance method to update status
bloodRequestSchema.methods.updateStatus = async function (newStatus) {
	this.status = newStatus;
	if (newStatus === 'fulfilled' || newStatus === 'partially-fulfilled') {
		this.fulfilledAt = new Date();
	}
	return this.save();
};

const BloodRequest = mongoose.model('BloodRequest', bloodRequestSchema);

export default BloodRequest;
