import mongoose from 'mongoose';

const EmergencyContactSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	contacts: [
		{
			name: {
				type: String,
				required: true,
			},
			phone: {
				type: String,
				required: true,
			},
			address: {
				type: String,
				required: true,
			},
			email: {
				type: String,
			},
			relationship: {
				type: String,
			},
		},
	],
});

const EmergencyContact = mongoose.model('EmergencyContact', EmergencyContactSchema);

export default EmergencyContact;
