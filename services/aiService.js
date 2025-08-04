// Enhanced matching function
import BloodRequest from '../models/BloodRequest.js';
import Hospital from '../models/Hospital.js';
import { sendSMS } from './notification.js';

export const matchDonorsToRequests = async () => {
	try {
		// Get all pending requests that aren't expired
		const pendingRequests = await BloodRequest.find({
			status: 'pending',
			requiredBy: { $gt: new Date() },
		}).populate('hospital');

		for (const request of pendingRequests) {
			// Skip if already has enough positive responses
			const positiveResponses = request.matchedDonors.filter(
				(md) => md.response === 'positive'
			).length;

			if (positiveResponses >= request.quantity) {
				continue;
			}

			// Find compatible donors who haven't been notified yet
			const alreadyNotifiedDonorIds = request.matchedDonors.map(
				(md) => md.donor
			);

			const compatibleDonors = await Donor.find({
				bloodType: request.bloodType,
				isActive: true,
				_id: { $nin: alreadyNotifiedDonorIds },
				location: {
					$near: {
						$geometry: {
							type: 'Point',
							coordinates: request.hospital.location.coordinates,
						},
						$maxDistance: getMaxDistanceForUrgency(request.urgency),
					},
				},
			})
				.sort({ lastDonationDate: 1 }) // Prioritize those who haven't donated recently
				.limit(getDonorLimitForUrgency(request.urgency));

			if (compatibleDonors.length > 0) {
				// Add new matched donors to the request
				request.matchedDonors.push(
					...compatibleDonors.map((donor) => ({
						donor: donor._id,
						notifiedAt: new Date(),
						responded: false,
						donated: false,
						response: 'pending',
					}))
				);

				await request.save();

				// Notify matched donors
				for (const donor of compatibleDonors) {
					await sendSMS(
						donor.phone,
						`URGENT: ${request.hospital.name} needs ${request.bloodType} blood. ` +
							`Can you donate within 24 hours? Reply YES or NO.`
					);
				}
			}
		}

		// Check for expired requests
		await expireOldRequests();
	} catch (error) {
		console.error('Error in donor matching:', error);
	}
};

// Helper functions for matching logic
const getMaxDistanceForUrgency = (urgency) => {
	switch (urgency) {
		case 'critical':
			return 100000; // 100km for critical
		case 'high':
			return 50000; // 50km for high
		case 'medium':
			return 30000; // 30km for medium
		case 'low':
			return 10000; // 10km for low
		default:
			return 30000; // Default 30km
	}
};

const getDonorLimitForUrgency = (urgency) => {
	switch (urgency) {
		case 'critical':
			return 30; // Notify more donors for critical needs
		case 'high':
			return 20;
		case 'medium':
			return 15;
		case 'low':
			return 10;
		default:
			return 15;
	}
};

// Mark expired requests
const expireOldRequests = async () => {
	await BloodRequest.updateMany(
		{
			status: 'pending',
			requiredBy: { $lt: new Date() },
		},
		{
			status: 'expired',
			updatedAt: new Date(),
		}
	);
};

// Enhanced shortage prediction with multiple factors
export const predictShortage = async (hospitalId, bloodType) => {
	try {
		const hospital = await Hospital.findById(hospitalId);
		if (!hospital) {
			throw new Error('Hospital not found');
		}

		// Get current inventory for the blood type
		const inventoryItem = hospital.bloodInventory.find(
			(item) => item.bloodType === bloodType
		);
		const currentStock = inventoryItem?.quantity || 0;

		// 1. Analyze historical usage patterns
		const historicalUsage = await analyzeHistoricalUsage(hospitalId, bloodType);

		// 2. Check upcoming scheduled procedures (if integrated with hospital system)
		const scheduledDemand = await estimateScheduledDemand(
			hospitalId,
			bloodType
		);

		// 3. Analyze recent request trends
		const requestTrends = await analyzeRequestTrends(hospitalId, bloodType);

		// 4. Consider seasonal factors
		const seasonalFactor = getSeasonalFactor();

		// 5. Calculate predicted daily usage
		const baseDailyUsage = historicalUsage.avgDailyUsage;
		const trendAdjustment =
			requestTrends.trend === 'increasing'
				? 1.2
				: requestTrends.trend === 'decreasing'
				? 0.8
				: 1;
		const predictedDailyUsage =
			baseDailyUsage * trendAdjustment * seasonalFactor;

		// 6. Calculate days until shortage
		let daysUntilShortage;
		if (predictedDailyUsage <= 0) {
			daysUntilShortage = Infinity; // No usage predicted
		} else {
			daysUntilShortage = Math.floor(currentStock / predictedDailyUsage);
		}

		// 7. Determine shortage likelihood and severity
		const { isLikely, severity, confidence } = calculateShortageRisk(
			currentStock,
			daysUntilShortage,
			scheduledDemand
		);

		// 8. Generate recommendations
		const recommendations = generateRecommendations(
			isLikely,
			severity,
			daysUntilShortage,
			currentStock,
			bloodType
		);

		// Return prediction results
		return {
			bloodType,
			currentStock,
			predictedDailyUsage,
			daysUntilShortage,
			isLikely,
			severity, // 'low', 'medium', 'high', 'critical'
			confidence, // 0-1
			nextCriticalDate: new Date(
				Date.now() + daysUntilShortage * 24 * 60 * 60 * 1000
			),
			historicalUsage,
			requestTrends,
			recommendations,
			lastUpdated: new Date(),
		};
	} catch (error) {
		console.error('Error in predictShortage:', error);
		return {
			isLikely: false,
			confidence: 0,
			error: error.message,
		};
	}
};

// Helper function to analyze historical usage
const analyzeHistoricalUsage = async (hospitalId, bloodType) => {
	// Get blood requests from last 90 days
	const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

	const requests = await BloodRequest.find({
		hospital: hospitalId,
		bloodType,
		status: { $in: ['fulfilled', 'partially-fulfilled'] },
		createdAt: { $gte: ninetyDaysAgo },
	});

	// Calculate daily usage
	const dailyUsage = {};
	requests.forEach((request) => {
		const dateStr = request.createdAt.toISOString().split('T')[0];
		dailyUsage[dateStr] = (dailyUsage[dateStr] || 0) + request.quantity;
	});

	const usageValues = Object.values(dailyUsage);
	const avgDailyUsage =
		usageValues.reduce((sum, val) => sum + val, 0) / (usageValues.length || 1);

	return {
		period: '90 days',
		totalUnits: usageValues.reduce((sum, val) => sum + val, 0),
		avgDailyUsage,
		peakUsage: Math.max(...usageValues, 0),
		lowUsage: Math.min(...usageValues, 0),
	};
};

// Helper function to estimate scheduled demand (mock - integrate with hospital systems)
const estimateScheduledDemand = async (hospitalId, bloodType) => {
	// In a real implementation, this would connect to hospital scheduling systems
	// For now, we'll use a simple mock with random data
	const scheduledProcedures = [
		{ date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), unitsNeeded: 2 },
		{ date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), unitsNeeded: 3 },
	];

	const relevantProcedures = scheduledProcedures.filter(
		(proc) => proc.unitsNeeded > 0
	);

	return {
		totalScheduled: relevantProcedures.reduce(
			(sum, proc) => sum + proc.unitsNeeded,
			0
		),
		nextProcedure: relevantProcedures[0] || null,
	};
};

// Helper function to analyze request trends
const analyzeRequestTrends = async (hospitalId, bloodType) => {
	const now = new Date();
	const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
	const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

	// Get requests from last 30 days
	const recentRequests = await BloodRequest.find({
		hospital: hospitalId,
		bloodType,
		createdAt: { $gte: thirtyDaysAgo },
	});

	// Get requests from previous 30 days (30-60 days ago)
	const olderRequests = await BloodRequest.find({
		hospital: hospitalId,
		bloodType,
		createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
	});

	const recentCount = recentRequests.length;
	const olderCount = olderRequests.length;

	let trend;
	if (recentCount > olderCount * 1.3) trend = 'increasing';
	else if (recentCount < olderCount * 0.7) trend = 'decreasing';
	else trend = 'stable';

	return {
		trend,
		recentPeriodCount: recentCount,
		previousPeriodCount: olderCount,
		changePercentage: ((recentCount - olderCount) / (olderCount || 1)) * 100,
	};
};

// Helper function for seasonal factors
const getSeasonalFactor = () => {
	const month = new Date().getMonth();
	// Increase usage during holiday seasons and summer months
	if (month === 11 || month === 0) return 1.3; // December/January
	if (month >= 5 && month <= 7) return 1.2; // Summer months
	return 1.0;
};

// Helper function to calculate shortage risk
const calculateShortageRisk = (
	currentStock,
	daysUntilShortage,
	scheduledDemand
) => {
	if (currentStock === 0) {
		return { isLikely: true, severity: 'critical', confidence: 0.95 };
	}

	// Check if scheduled procedures will cause immediate shortage
	if (
		scheduledDemand.nextProcedure &&
		scheduledDemand.nextProcedure.unitsNeeded > currentStock
	) {
		return { isLikely: true, severity: 'high', confidence: 0.9 };
	}

	let isLikely = false;
	let severity = 'low';
	let confidence = 0;

	if (daysUntilShortage <= 1) {
		isLikely = true;
		severity = 'critical';
		confidence = 0.95;
	} else if (daysUntilShortage <= 3) {
		isLikely = true;
		severity = 'high';
		confidence = 0.85;
	} else if (daysUntilShortage <= 7) {
		isLikely = true;
		severity = 'medium';
		confidence = 0.75;
	} else if (daysUntilShortage <= 14) {
		isLikely = false;
		severity = 'low';
		confidence = 0.6;
	} else {
		isLikely = false;
		severity = 'none';
		confidence = 0.3;
	}

	// Adjust for scheduled demand
	if (scheduledDemand.totalScheduled > currentStock * 0.5) {
		severity =
			severity === 'critical'
				? 'critical'
				: severity === 'high'
				? 'high'
				: 'medium';
		confidence = Math.min(confidence + 0.1, 0.95);
	}

	return { isLikely, severity, confidence };
};

// Helper function to generate recommendations
const generateRecommendations = (
	isLikely,
	severity,
	daysUntilShortage,
	currentStock,
	bloodType
) => {
	const recommendations = [];

	if (!isLikely) {
		if (currentStock < 10) {
			recommendations.push({
				priority: 'medium',
				action: 'restock',
				message: `Consider restocking ${bloodType} blood to maintain safe levels`,
				suggestedOrder: 10 - currentStock,
			});
		}
		return recommendations;
	}

	// Critical shortage recommendations
	if (severity === 'critical') {
		recommendations.push({
			priority: 'critical',
			action: 'emergency_request',
			message: `Issue emergency blood request for ${bloodType} - stock may be depleted within 24 hours`,
			suggestedDonors: 15,
		});
		recommendations.push({
			priority: 'high',
			action: 'contact_other_hospitals',
			message: `Contact nearby hospitals for ${bloodType} blood transfers`,
		});
	}

	// High shortage recommendations
	if (severity === 'high') {
		recommendations.push({
			priority: 'high',
			action: 'urgent_request',
			message: `Issue urgent blood request for ${bloodType} - stock may be depleted in ${daysUntilShortage} days`,
			suggestedDonors: 10,
		});
		recommendations.push({
			priority: 'medium',
			action: 'prioritize_usage',
			message: `Prioritize ${bloodType} blood usage for critical cases only`,
		});
	}

	// Medium shortage recommendations
	if (severity === 'medium') {
		recommendations.push({
			priority: 'medium',
			action: 'standard_request',
			message: `Request additional ${bloodType} blood units to prevent future shortage`,
			suggestedOrder: Math.max(5, 10 - currentStock),
		});
		recommendations.push({
			priority: 'low',
			action: 'monitor_usage',
			message: `Monitor ${bloodType} blood usage closely for unexpected increases`,
		});
	}

	// Always include general recommendations
	recommendations.push({
		priority: 'low',
		action: 'schedule_drives',
		message: `Consider scheduling blood donation drives for ${bloodType} blood`,
	});

	return recommendations;
};

// Scheduled task to check for potential shortages
export const checkAllHospitalsForShortages = async () => {
	try {
		const hospitals = await Hospital.find();
		const shortageAlerts = [];

		for (const hospital of hospitals) {
			for (const inventoryItem of hospital.bloodInventory) {
				const prediction = await predictShortage(
					hospital._id,
					inventoryItem.bloodType
				);

				if (prediction.isLikely && prediction.confidence > 0.7) {
					shortageAlerts.push({
						hospital: hospital.name,
						bloodType: inventoryItem.bloodType,
						severity: prediction.severity,
						daysUntilShortage: prediction.daysUntilShortage,
					});

					// Send alert to hospital if shortage is critical or high
					if (
						prediction.severity === 'critical' ||
						prediction.severity === 'high'
					) {
						await sendSMS(
							hospital.contactPhone,
							`ALERT: ${inventoryItem.bloodType} blood shortage predicted in ` +
								`${prediction.daysUntilShortage} days. Current stock: ${inventoryItem.quantity} units. ` +
								`Action: ${prediction.recommendations[0].message}`
						);
					}
				}
			}
		}

		console.log('Shortage check completed. Alerts:', shortageAlerts.length);
		return shortageAlerts;
	} catch (error) {
		console.error('Error in shortage check:', error);
		return [];
	}
};

// Run shortage checks every 6 hours
setInterval(checkAllHospitalsForShortages, 6 * 60 * 60 * 1000);