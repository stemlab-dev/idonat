import Donor from '../models/Donor.js';
import { processDonorResponse } from '../services/aiService.js';

export const handleUSSDRequest = async (req, res) => {
	const { phoneNumber, text } = req.body;

	// USSD menu logic
	const input = text.split('*');
	let response = '';

	if (input.length === 1 && !input[0]) {
		// Initial menu
		response = `CON Welcome to iDonat
    1. Register as donor
    2. Check donation centers
    3. Respond to request`;
	} else if (input[0] === '1') {
		// Registration flow
		if (input.length === 1) {
			response = `CON Enter your full name:`;
		} else if (input.length === 2) {
			response = `CON Enter your blood type (A+, A-, B+, etc.):`;
		} else if (input.length === 3) {
			response = `CON Enter your location (town/city):`;
		} else if (input.length === 4) {
			// Complete registration
			const [_, name, bloodType, location] = input;

			// Simplified - in reality you'd geocode the location
			try {
				const donor = new Donor({
					name,
					phone: phoneNumber,
					bloodType,
					location: {
						type: 'Point',
						coordinates: [0, 0], // Default coordinates - should geocode
					},
				});

				await donor.save();
				response = `END Thank you for registering, ${name}! We'll contact you when your blood type is needed.`;
			} catch (error) {
				response = `END Registration failed. Please try again later.`;
			}
		}
	} else if (input[0] === '2') {
		// List nearby hospitals
		// Implementation would query hospitals near the donor's location
		response = `END Nearest donation centers:
    1. Kano General Hospital
    2. Aminu Kano Teaching Hospital
    Call for directions.`;
	} else if (input[0] === '3') {
		// Respond to donation request
		if (input.length === 1) {
			response = `CON Have you received a donation request?
      1. Yes, I can donate
      2. No, cancel`;
		} else if (input[1] === '1') {
			await processDonorResponse(phoneNumber, 'YES');
			response = `END Thank you! You'll receive hospital details shortly.`;
		} else {
			response = `END Thank you. We'll contact you next time.`;
		}
	} else {
		response = `END Invalid option. Please try again.`;
	}

	res.set('Content-Type', 'text/plain');
	res.send(response);
};
