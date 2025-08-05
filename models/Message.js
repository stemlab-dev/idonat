import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
	{
		// Reference to the user or chat session
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		chatSessionId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'ChatSession',
			required: true,
		},

		// Message content
		content: {
			type: String,
			required: true,
		},

		// Role: user, assistant (AI), or system
		role: {
			type: String,
			enum: ['user', 'assistant', 'system'],
			required: true,
		},

		// Metadata
		timestamp: {
			type: Date,
			default: Date.now,
		},

		// For AI responses
		aiModel: {
			type: String,
			enum: ['gemini-2.0-flash', 'gemini-1.5', 'other'],
			required: function () {
				return this.role === 'assistant';
			},
		},

		// API response details
		apiResponse: {
			promptTokens: Number,
			completionTokens: Number,
			totalTokens: Number,
			finishReason: String,
		},

		// Additional context
		context: {
			type: Map,
			of: String,
		},
	},
	{
		timestamps: true,
	}
);

// Indexes for faster queries
messageSchema.index({ userId: 1, chatSessionId: 1, timestamp: 1 });

const ChatMessage = mongoose.model('ChatMessage', messageSchema);

export default ChatMessage;
