import BloodRequest from '../models/BloodRequest.js';
import Donor from '../models/Donor.js';
import Hospital from '../models/Hospital.js';
import { sendSMS } from '../services/notification.js';
import { matchDonorsToRequests } from '../services/aiService.js';

// Create a new blood request
export const createBloodRequest = async (req, res) => {
	try {
		const { hospitalId, bloodType, quantity, urgency, requiredBy, notes } =
			req.body;

		// Validate hospital exists
		const hospital = await Hospital.findById(hospitalId);
		if (!hospital) {
			return res.status(404).json({ message: 'Hospital not found' });
		}

		const request = new BloodRequest({
			hospital: hospitalId,
			bloodType,
			quantity,
			urgency,
			requiredBy: new Date(requiredBy),
			notes,
		});

		await request.save();

		// Immediately try to match donors
		await matchDonorsToRequests();

		res.status(201).json(request);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Get all blood requests
export const getAllBloodRequests = async (req, res) => {
	try {
		const { status, bloodType, hospital } = req.query;
		const filter = {};

		if (status) filter.status = status;
		if (bloodType) filter.bloodType = bloodType;
		if (hospital) filter.hospital = hospital;

		const requests = await BloodRequest.find(filter)
			.populate('hospital')
			.populate('matchedDonors.donor')
			.sort({ urgency: -1, createdAt: -1 });

		res.json(requests);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Get a single blood request
export const getBloodRequest = async (req, res) => {
	try {
		const request = await BloodRequest.findById(req.params.id)
			.populate('hospital')
			.populate('matchedDonors.donor');

		if (!request) {
			return res.status(404).json({ message: 'Blood request not found' });
		}

		res.json(request);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Update a blood request
export const updateBloodRequest = async (req, res) => {
	try {
		const { id } = req.params;
		const { status, quantity, urgency, notes } = req.body;

		const request = await BloodRequest.findById(id);
		if (!request) {
			return res.status(404).json({ message: 'Blood request not found' });
		}

		// Only allow certain fields to be updated
		if (status) request.status = status;
		if (quantity) request.quantity = quantity;
		if (urgency) request.urgency = urgency;
		if (notes) request.notes = notes;

		await request.save();

		// If status changed to fulfilled, notify donors
		if (status === 'fulfilled') {
			await notifyDonorsOfFulfillment(request);
		}

		res.json(request);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Delete a blood request
export const deleteBloodRequest = async (req, res) => {
	try {
		const request = await BloodRequest.findByIdAndDelete(req.params.id);

		if (!request) {
			return res.status(404).json({ message: 'Blood request not found' });
		}

		res.json({ message: 'Blood request deleted successfully' });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Get requests by hospital
export const getRequestsByHospital = async (req, res) => {
	try {
		const requests = await BloodRequest.find({
			hospital: req.params.hospitalId,
		})
			.populate('matchedDonors.donor')
			.sort({ createdAt: -1 });

		res.json(requests);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Get requests by donor
export const getRequestsByDonor = async (req, res) => {
	try {
		const requests = await BloodRequest.find({
			'matchedDonors.donor': req.params.donorId,
		})
			.populate('hospital')
			.sort({ createdAt: -1 });

		res.json(requests);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Manually trigger donor matching for a request
export const triggerDonorMatching = async (req, res) => {
	try {
		const request = await BloodRequest.findById(req.params.id);

		if (!request) {
			return res.status(404).json({ message: 'Blood request not found' });
		}

		if (request.status !== 'pending') {
			return res
				.status(400)
				.json({ message: 'Only pending requests can be matched' });
		}

		await matchDonorsToRequests();
		const updatedRequest = await BloodRequest.findById(req.params.id)
			.populate('hospital')
			.populate('matchedDonors.donor');

		res.json({
			message: 'Donor matching completed',
			request: updatedRequest,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Helper function to notify donors when request is fulfilled
const notifyDonorsOfFulfillment = async (request) => {
	const hospital = await Hospital.findById(request.hospital);

	for (const matchedDonor of request.matchedDonors) {
		if (matchedDonor.response === 'positive') {
			const donor = await Donor.findById(matchedDonor.donor);

			await sendSMS(
				donor.phone,
				`Update: The ${request.bloodType} blood request at ${hospital.name} ` +
					`has been fulfilled. Thank you for your willingness to help!`
			);
		}
	}
};
