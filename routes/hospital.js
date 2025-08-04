import express from 'express';
import {
	registerHospital,
	updateInventory,
	createBloodRequest,
	getHospitalRequests,
} from '../controllers/hospital.js';

const router = express.Router();

router.post('/', registerHospital);
router.put('/:id/inventory', updateInventory);
router.post('/:id/requests', createBloodRequest);
router.get('/:id/requests', getHospitalRequests);

export default router;
