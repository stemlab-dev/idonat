import express from 'express';
import {
	getAchievements,
	getUserAchievements,
} from '../controllers/achievement.js';

const router = express.Router();

// Get all available achievements
router.get('/', getAchievements);

// Get user's achievements
router.get('/user/:userId', getUserAchievements);

export default router;
