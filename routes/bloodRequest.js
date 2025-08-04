import express from 'express';
import {
	createBloodRequest,
	getAllBloodRequests,
	getBloodRequest,
	updateBloodRequest,
	deleteBloodRequest,
	getRequestsByHospital,
	getRequestsByDonor,
	triggerDonorMatching,
} from '../controllers/bloodRequest.js';

const router = express.Router();

// Create a blood request
router.post('/', createBloodRequest);

// Get all blood requests (with optional filtering)
router.get('/', getAllBloodRequests);

// Get a specific blood request
router.get('/:id', getBloodRequest);

// Update a blood request
router.put('/:id', updateBloodRequest);

// Delete a blood request
router.delete('/:id', deleteBloodRequest);

// Get requests by hospital
router.get('/hospital/:hospitalId', getRequestsByHospital);

// Get requests by donor
router.get('/donor/:donorId', getRequestsByDonor);

// Manually trigger donor matching for a request
router.post('/:id/match-donors', triggerDonorMatching);

export default router;
