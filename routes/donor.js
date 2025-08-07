import express from 'express';
import {
	getActiveDonors,
	getDonorsByBloodType,
	updateDonor,
	addDonorReward,
	addDonor,
} from '../controllers/donor.js';

const router = express.Router();

router.post('/', addDonor);
router.get('/', getActiveDonors);
router.get('/search', getDonorsByBloodType);
router.put('/:id', updateDonor);
router.post('/:id/rewards', addDonorReward);

export default router;
