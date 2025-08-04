import express from 'express';
import {
	createSquad,
	getSquads,
	getSquad,
	joinSquad,
	leaveSquad,
	getSquadLeaderboard,
} from '../controllers/squad.js';

const router = express.Router();

// Create a new squad
router.post('/', createSquad);

// Get all squads
router.get('/', getSquads);

// Get squad leaderboard
router.get('/leaderboard', getSquadLeaderboard);

// Get squad details
router.get('/:id', getSquad);

// Join a squad
router.post('/join', joinSquad);

// Leave a squad
router.post('/leave', leaveSquad);

export default router;
