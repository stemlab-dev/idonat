import dotenv from 'dotenv';
dotenv.config();

const accessToken = process.env.YOUR_MAPBOX_ACCESS_TOKEN;
const geocodeAddress = async (address) => {
	try {
		const addressString =
			`${address.city}, ${address.state}, ${address.country}`
				.replace(/, ,/g, ',')
				.trim();

		const response = await fetch(
			`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
				addressString
			)}.json?access_token=${accessToken}`
		);

		const data = await response.json();

		if (!data.features || data.features.length === 0) {
			throw new Error('Address not found');
		}

		setCoordinates({
			longitude: data.features[0].center[0],
			latitude: data.features[0].center[1],
		});
	} catch (err) {
		throw new Error('Could not find coordinates for this address');
	}
};

const getNominatimAddress = async (address) => {
	const addressString = `${address.city}, ${address.state}, ${address.country}`
		.replace(/, ,/g, ',')
		.trim();

	const response = await fetch(
		`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
			addressString
		)}`
	);

	const data = await response.json();

	if (!data || data.length === 0) {
		throw new Error('No results found for this address');
	}

	return {
		latitude: parseFloat(data[0].lat),
		longitude: parseFloat(data[0].lon),
	};
};

export { geocodeAddress, getNominatimAddress };
