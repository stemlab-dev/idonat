import express from 'express';
import {
	getRewards,
	redeemReward,
	getRedemptionHistory,
} from '../controllers/reward.js';

const router = express.Router();

// Get available rewards
router.get('/', getRewards);

// Redeem a reward
router.post('/redeem', redeemReward);

// Get user's redemption history
router.get('/history/:userId', getRedemptionHistory);

export default router;
