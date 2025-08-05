// services/chatService.js
import ChatSession from '../models/Chat.js';
import { v4 as uuidv4 } from 'uuid';
import { IBMChat, systemPrompt } from '../controllers/chat.js';

const ChatService = {
	/** Create a new session */
	async createNewSession(userId = null, systemMessage = 'Welcome to AI chat') {
		const session = new ChatSession({
			userId,
			messages: [{ role: 'system', content: systemMessage }],
			sessionToken: uuidv4(),
		});
		await session.save();
		return session;
	},

	/** Add messages to an existing session */
	async addMessages(sessionId, userMessage, aiMessage) {
		const session = await ChatSession.findById(sessionId);
		if (!session) throw new Error('Session not found');

		session.messages.push({ role: 'user', content: userMessage });
		session.messages.push({ role: 'ai', content: aiMessage });
		session.updatedAt = Date.now();

		await session.save();
		return session;
	},

	/** Get conversation history (limit optional) */
	async getConversationHistory(sessionId, limit = 10) {
		const session = await ChatSession.findById(sessionId);
		if (!session) {
			const messages = await ChatSession.find();
			return messages;
		}

		const messages =
			limit > 0 ? session.messages.slice(-limit) : session.messages;
		return messages;
	},

	/** Complete one chat cycle: user → AI → save */
	async completeChatCycle(userId = null, sessionId, userMessage) {
		let session = await ChatSession.findById(sessionId);
		if (!session) {
			session = await this.createNewSession(userId || null, systemPrompt);
		}

		const aiResponse = await IBMChat({
			messages: session.messages.concat({
				role: 'user',
				content: [{ type: 'text', text: userMessage }],
			}),
		});
		console.log('AI Response:', aiResponse);

		const aiText = aiResponse.output?.choices?.[0]?.text || 'No response';

		await this.addMessages(session._id, userMessage, aiText);

		return {
			sessionId: session._id,
			messages: await this.getConversationHistory(session._id, 10),
		};
	},
};

export default ChatService;
