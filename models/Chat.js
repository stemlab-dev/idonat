// models/chatModel.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
	{
		role: { type: String, enum: ['user', 'ai', 'system'], required: true },
		content: { type: String, required: true },
		timestamp: { type: Date, default: Date.now },
	},
	{ _id: false }
);

const chatSessionSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			default: null,
		},
		sessionToken: { type: String, required: true, unique: true },
		messages: [messageSchema],
		createdAt: { type: Date, default: Date.now },
		updatedAt: { type: Date, default: Date.now },
	},
	{ timestamps: true }
);

export default mongoose.model('ChatSession', chatSessionSchema);
