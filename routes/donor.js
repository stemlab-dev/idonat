import express from 'express';
import {
	getActiveDonors,
	getDonorsByBloodType,
	updateDonor,
	addDonorReward,
	addDonor,
	getDonorInfo,
} from '../controllers/donor.js';
import { requireAuth, verifyPermission } from '../middleware/requireAuth.js';

const router = express.Router();

router.put('/medical-info', requireAuth, addDonor);
router.get('/', requireAuth,  getDonorInfo);
router.get('/active', getActiveDonors);
router.get('/search', getDonorsByBloodType);
router.put('/:id', requireAuth, updateDonor);
router.post('/:id/rewards', requireAuth, addDonorReward);

export default router;
