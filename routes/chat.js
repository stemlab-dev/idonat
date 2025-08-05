import express from 'express';
import { sendMessage, getChatHistory } from '../controllers/chat.js';

const router = express.Router();

router.post('/', sendMessage);
router.get('/', getChatHistory);

export default router;
