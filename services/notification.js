
import Donor from '../models/Donor.js';
import Hospital from '../models/Hospital.js';
import africastalking from 'africastalking';
// This is a mock implementation - in a real app you would integrate with an SMS gateway
export const sendSMS = async (phoneNumber, message) => {
	console.log(`Sending SMS to ${phoneNumber}: ${message}`);
	// In production, you would use a service like Twilio, Africa's Talking, etc.
	// Example with Africa's Talking:
	
    const africastalking = africastalking({
			apiKey: process.env.AT_API_KEY,
			username: process.env.AT_USERNAME,
		});
    
    try {
      await africastalking.SMS.send({
        to: phoneNumber,
        message: message,
      });
    } catch (error) {
      console.error('Error sending SMS:', error);
    }
    

	return { success: true };
};

export const sendDonationAlert = async (donorId, livesSaved) => {
	const donor = await Donor.findById(donorId);
	if (!donor) return;

	const message = `Your donation helped save ${livesSaved} lives! Thank you for being a hero.`;
	await sendSMS(donor.phone, message);
};

export const sendShortageAlert = async (hospitalId, bloodType) => {
	const hospital = await Hospital.findById(hospitalId);
	if (!hospital) return;

	const message = `Alert: ${bloodType} blood stock is low. Consider requesting donations.`;
	await sendSMS(hospital.contactPhone, message);
};
