import express from 'express';
import {
	registerDonor,
	getActiveDonors,
	getDonorsByBloodType,
	updateDonor,
	addDonorReward,
} from '../controllers/donor.js';

const router = express.Router();

router.post('/', registerDonor);
router.get('/', getActiveDonors);
router.get('/search', getDonorsByBloodType);
router.put('/:id', updateDonor);
router.post('/:id/rewards', addDonorReward);

export default router;
