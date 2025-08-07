import ChatService, { systemPrompt } from '../services/chatService.js';
import ChatSession from '../models/Chat.js';

export const sendMessage = async (req, res) => {
	try {
		const { userId, message, sessionToken } = req.body;

		let session;
		if (!sessionToken) {
			session = await ChatService.createNewSession(userId, systemPrompt);
		} else {
			session = await ChatSession.findOne({ sessionToken });
			if (!session) {
				return res.status(404).json({ error: 'Session not found' });
			}
		}
		console.log('Session:', session);
		// Store user message
		const chatRes = await ChatService.completeChatCycle(
			userId,
			session._id,
			message
		);
		// console.log('ChatService response:', chatRes.messages);
		// Call AI and store AI response, omitted for brevity...

		res.json({
			sessionToken: session.sessionToken,
			messages: chatRes.messages,
		});
	} catch (error) {
		console.error('Error in sendMessage:', error);
		res.status(500).json({ error: error.message });
	}
};

export const getChatHistory = async (req, res) => {
	try {
		const sessionId = req.params.id;
		const messages = await ChatService.getConversationHistory(sessionId);
		res.json(messages);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
export const getChats = async (req, res) => {
	try {
		// const userId = req.user._id;
		// const chat = await ChatSession.findOne();
		const chat = await ChatSession.findOne({
			_id: '689334041e36d8ebd20c1293',
		});
		res.status(200).json(chat);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

export const deleteChat = async (req, res) => {
	try {
		const { sessionId } = req.params;
		await ChatSession.findByIdAndDelete(sessionId);
		res.status(200).json({ message: 'Chat deleted successfully' });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
