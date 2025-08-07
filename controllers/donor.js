import mongoose from 'mongoose';
import Donor from '../models/Donor.js';
import User from '../models/User.js';
import NextOfKin from '../models/NextOfKin.js';
import { sendSMS } from '../services/notification.js';

// Register a new donor
export const addDonor = async (req, res) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const { name, phone, email, bloodType, location, nextOfKins } = req.body;

		const existingUser = await User.findOne({ phone });

		// To handle the 409 status code, typically indicating a conflict, you might want to implement it in scenarios where there's a conflict with the current state of the resource.
		// For example, if you're trying to create a new user with an email or username that already exists, it would result in a conflict.
		if (existingUser) {
			return res.status(409).json({ error: 'Phone already Exists' });
		}

		const hashedPassword = await hash(password);

		const user = await User.create({
			name,
			email,
			phone,
			password: hashedPassword,
			role: 'USER',
		});
		const nextOfKin = await NextOfKin.create({
			userId: user._id,
			contacts: nextOfKins,
		});

		const donor = new Donor({
			userId: user._id,
			phone,
			bloodType,
			location: {
				type: 'Point',
				coordinates: [location.longitude, location.latitude],
			},
		});

		await donor.save();

		await session.commitTransaction();
		// Send welcome message
		await sendSMS(
			phone,
			`Thank you for registering with iDonat! You're now part of our life-saving community.`
		);

		res
			.status(201)
			.json({ user, donor, nextOfKin, message: 'Registration successful' });
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
