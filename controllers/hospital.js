import mongoose from 'mongoose';
import Donor from '../models/Donor.js';
import User from '../models/User.js';
import Squad from '../models/Squad.js';
import UserAchievement from '../models/UserAchievment.js';
import Hospital from '../models/Hospital.js';
import BloodRequest from '../models/BloodRequest.js';
import { predictShortage } from '../services/aiService.js';

// Register a new hospital
export const registerHospital = async (req, res) => {
	try {
		const { name, address, location, contactPhone, contactEmail } = req.body;

		const hospital = new Hospital({
			name,
			address,
			location: {
				type: 'Point',
				coordinates: [location.longitude, location.latitude],
			},
			contactPhone,
			contactEmail,
		});

		await hospital.save();
		res.status(201).json(hospital);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

export const getHospitalDashboard = async (req, res) => {
	try {
		const userId = req.user._id;

		const squad = await Squad.findOne({
			user: userId,
		});
		const donor = await Donor.findOne({
			user: userId,
		});
		const userAchievements = await UserAchievement.findOne({
			user: userId,
		}).populate('achievement');

		res.json({ userAchievements, squad, donor });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Update hospital blood inventory
export const updateInventory = async (req, res) => {
	try {
		const { id } = req.params;
		const { bloodType, quantity } = req.body;

		const hospital = await Hospital.findById(id);
		if (!hospital) {
			return res.status(404).json({ message: 'Hospital not found' });
		}

		// Find existing inventory item for this blood type
		const inventoryItem = hospital.bloodInventory.find(
			(item) => item.bloodType === bloodType
		);

		if (inventoryItem) {
			inventoryItem.quantity = quantity;
			inventoryItem.lastUpdated = new Date();
		} else {
			hospital.bloodInventory.push({
				bloodType,
				quantity,
				lastUpdated: new Date(),
			});
		}

		await hospital.save();

		// Check for potential shortages using AI
		const shortagePrediction = await predictShortage(hospital._id, bloodType);
		if (shortagePrediction.isLikely) {
			// Notify hospital admin about potential shortage
			// This could trigger a preemptive request for donations
		}

		res.json(hospital);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Create a blood request
export const createBloodRequest = async (req, res) => {
	try {
		const { hospitalId, bloodType, quantity, urgency } = req.body;

		const request = new BloodRequest({
			hospital: hospitalId,
			bloodType,
			quantity,
			urgency,
		});

		await request.save();

		// AI matching will be handled by a separate service
		// that runs periodically to match donors to requests

		res.status(201).json(request);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Get hospital requests
export const getHospitalRequests = async (req, res) => {
	try {
		const { id } = req.params;
		const requests = await BloodRequest.find({ hospital: id })
			.sort({ createdAt: -1 })
			.populate('matchedDonors.donor');

		res.json(requests);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
