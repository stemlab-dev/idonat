import express from 'express';
import { getLeaderboard, getDonorRank } from '../controllers/leaderboard.js';

const router = express.Router();

// Get leaderboard
router.get('/', getLeaderboard);

// Get donor's rank
router.get('/donor/:donorId', getDonorRank);

export default router;
