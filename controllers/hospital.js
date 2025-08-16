import mongoose from 'mongoose';
import Donor from '../models/Donor.js';
import User from '../models/User.js';
import Squad from '../models/Squad.js';
import UserAchievement from '../models/UserAchievment.js';
import Hospital from '../models/Hospital.js';
import BloodRequest from '../models/BloodRequest.js';
import { predictShortage } from '../services/aiService.js';
import { hash } from '../utils/hash.js';

// Register a new hospital
export const registerHospital = async (req, res) => {
	const session = await mongoose.startSession();

	try {
		session.startTransaction();
		const {
			hospitalName,
			name,
			address,
			phone,
			email,
			contactPhone,
			contactEmail,
			password = '123456',
		} = req.body;

		const hashedPassword = await hash(password);

		const user = await User.create(
			[
				{
					name,
					phone,
					email,
					password: hashedPassword,
					role: 'HOSPITAL',
				},
			],
			{ session }
		);
		// Geocode address
		const location = await getNominatimAddress(address);
		console.log('location', location);
		if (!location) {
			throw new Error('Could not determine location coordinates');
		}

		const hospital = new Hospital(
			[
				{
					name: hospitalName,
					address,
					location: {
						type: 'Point',
						coordinates: [location.longitude, location.latitude],
					},
					contactPhone,
					contactEmail,
				},
			],
			{ session }
		);

		await hospital.save({ session });

		await session.commitTransaction();
		res.status(201).json(hospital);
	} catch (error) {
		await session.abortTransaction();

		console.error('Hospital registration error:', error);
		res.status(error.name === 'ValidationError' ? 400 : 500).json({
			success: false,
			message: error.message || 'Registration failed',
			...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
		});
	} finally {
		session.endSession();
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
export const getHospitalDetails = async (req, res) => {
	try {
		const userId = req.user._id;

		const metricsData = {};
		const hospitalData = await Hospital.findById(req.params.id);

		res.json({
			hospitalData,
			metricsData,
		});
	} catch (error) {
		console.log('error', error);
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
