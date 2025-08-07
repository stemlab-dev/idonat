import mongoose from 'mongoose';

const NextOfKinSchema = new mongoose.Schema({
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

const NextOfKin = mongoose.model('NextOfKin', NextOfKinSchema);

export default NextOfKin;
