import Donor from '../models/Donor.js';
import { sendSMS } from '../services/notification.js';

// Register a new donor
export const registerDonor = async (req, res) => {
	try {
		const { name, phone, bloodType, location } = req.body;

		const existingDonor = await Donor.findOne({ phone });
		if (existingDonor) {
			return res
				.status(400)
				.json({ message: 'Donor already registered with this phone number' });
		}

		const donor = new Donor({
			name,
			phone,
			bloodType,
			location: {
				type: 'Point',
				coordinates: [location.longitude, location.latitude],
			},
		});

		await donor.save();

		// Send welcome message
		await sendSMS(
			phone,
			`Thank you for registering with iDonat! You're now part of our life-saving community.`
		);

		res.status(201).json(donor);
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
