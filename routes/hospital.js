import express from 'express';
import {
	registerHospital,
	updateInventory,
	createBloodRequest,
	getHospitalRequests,
	getHospitalDashboard,
} from '../controllers/hospital.js';

const router = express.Router();

router.post('/', registerHospital);
router.get('/dashboard', getHospitalDashboard);
router.put('/:id/inventory', updateInventory);
router.post('/:id/requests', createBloodRequest);
router.get('/:id/requests', getHospitalRequests);

export default router;
