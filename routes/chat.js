import express from 'express';
import {
	sendMessage,
	getChatHistory,
	getChats,
	deleteChat,
} from '../controllers/chat.js';
import { requireAuth, verifyPermission } from '../middleware/requireAuth.js';

const router = express.Router();

router.post('/', sendMessage);
router.get('/', requireAuth, getChats);
router.get('/:id', getChatHistory);
router.delete('/:id', deleteChat);

export default router;
