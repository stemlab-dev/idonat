import mongoose from 'mongoose';
import Donor from '../models/Donor.js';
import User from '../models/User.js';
import EmergencyContact from '../models/EmergencyContact.js';
import { sendSMS } from '../services/notification.js';
import { getNominatimAddress } from '../utils/location.js';

export const addDonor = async (req, res) => {
	const session = await mongoose.startSession();

	try {
		session.startTransaction();

		const {
			medicalInfo,
			address = {
				city: 'kano',
				state: 'kano state',
				country: 'nigeria',
			},
			emergencyContacts,
		} = req.body;

		const userId = req.user._id;

		// Validate required fields
		if (
			!medicalInfo?.bloodType ||
			!address?.city ||
			!address?.state ||
			!address?.country
		) {
			throw new Error('Missing required fields');
		}

		if (!emergencyContacts || emergencyContacts.length === 0) {
			throw new Error('At least one emergency contact is required');
		}

		const user = await User.findById(userId).session(session);
		if (!user) {
			throw new Error('User not found');
		}

		// Geocode address
		const location = await getNominatimAddress(address);
		// console.log('location', location);
		if (!location) {
			throw new Error('Could not determine location coordinates');
		}

		// Create emergency contacts
		const emergencyContact = await EmergencyContact.create(
			[
				{
					userId,
					contacts: emergencyContacts,
				},
			],
			{ session }
		);

		// Create donor record
		const donor = await Donor.create(
			[
				{
					userId,
					...medicalInfo,
					location: {
						type: 'Point',
						coordinates: [location.longitude, location.latitude],
					},
					lastUpdated: new Date(),
				},
			],
			{ session }
		);

		user.medInforCompleted = true;
		user.role = 'DONOR'; // Ensure role is updated
		await user.save({ session });

		await session.commitTransaction();

		// Send welcome message (async - don't await)
		// if (user.phone) {
		// 	sendSMS(
		// 		user.phone,
		// 		`Thank you ${user.name} for registering with iDonat! You're now part of our life-saving community.`
		// 	).catch(console.error); // Don't fail if SMS fails
		// }

		res.status(200).json({
			success: true,
			donor: donor[0],
			emergencyContact: emergencyContact[0],
			message: 'Registration successful',
		});
	} catch (error) {
		await session.abortTransaction();

		console.error('Donor registration error:', error);
		res.status(error.name === 'ValidationError' ? 400 : 500).json({
			success: false,
			message: error.message || 'Registration failed',
			...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
		});
	} finally {
		session.endSession();
	}
};
// Get all active donors
export const getDonorInfo = async (req, res) => {
	try {
		// const upcomingSlots = await Donor.findOne({ isActive: true });
		// const donationHistory = await Donor.findOne({ isActive: true });
		const upcomingSlots = [];
		const donationHistory = [];
		const donor = await Donor.findOne({ userId: req.user._id });
		const user = await User.findById(req.user._id).select('-password');
		res.status(200).json({ user, donor, upcomingSlots, donationHistory });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
// Get all active donors
export const getActiveDonors = async (req, res) => {
	try {
		const donors = await Donor.find({ isActive: true });
		res.json(donors);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Get donors by blood type and location
export const getDonorsByBloodType = async (req, res) => {
	try {
		const { bloodType, longitude, latitude, maxDistance = 10000 } = req.query;

		const donors = await Donor.find({
			bloodType,
			isActive: true,
			location: {
				$near: {
					$geometry: {
						type: 'Point',
						coordinates: [parseFloat(longitude), parseFloat(latitude)],
					},
					$maxDistance: parseInt(maxDistance),
				},
			},
		});

		res.json(donors);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Update donor information
export const updateDonor = async (req, res) => {
	try {
		const { id } = req.params;
		const donor = await Donor.findByIdAndUpdate(id, req.body, { new: true });

		if (!donor) {
			return res.status(404).json({ message: 'Donor not found' });
		}

		res.json(donor);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Add reward to donor
export const addDonorReward = async (req, res) => {
	try {
		const { id } = req.params;
		const { badge, healthCredits } = req.body;

		const update = {};
		if (badge) {
			update.$addToSet = { 'rewards.badges': badge };
		}
		if (healthCredits) {
			update.$inc = { 'rewards.healthCredits': healthCredits };
		}

		const donor = await Donor.findByIdAndUpdate(id, update, { new: true });

		if (!donor) {
			return res.status(404).json({ message: 'Donor not found' });
		}

		// Notify donor about reward
		if (badge || healthCredits) {
			let message = 'Thank you for your donation!';
			if (badge) message += ` You earned a new badge: ${badge}.`;
			if (healthCredits)
				message += ` You earned ${healthCredits} health credits.`;

			await sendSMS(donor.phone, message);
		}

		res.json(donor);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
