import Moment from '../models/Moment.js';
import { google } from 'googleapis';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import { Readable } from 'stream';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
	process.env.GOOGLE_CLIENTID,
	process.env.GOOGLE_CLIENTSECRET,
	process.env.GOOGLE_REDIRECT // e.g., http://localhost:3000/oauth2callback
);

oauth2Client.setCredentials({
	refresh_token: process.env.OAUTH_REFRESHTOKEN,
});

const youtube = google.youtube({
	version: 'v3',
	auth: oauth2Client,
});
// Cloudinary configuration
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_API_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a video buffer to YouTube.
 * @param {Buffer} buffer - The video file buffer
 * @param {string} filename - The original filename
 * @returns {Promise<{ url: string, thumbnail: string }>}
 */
async function uploadVideoToYouTube(buffer, filename) {
	try {
		const fileStream = Readable.from(buffer);

		const res = await youtube.videos.insert({
			part: ['snippet', 'status'],
			requestBody: {
				snippet: {
					title: `Moment - ${filename}`,
					description: 'Uploaded from the XtateHub Moments app',
					tags: ['moment', 'xtatehub', 'upload'],
				},
				status: {
					privacyStatus: 'public', // or 'unlisted'
				},
			},
			media: {
				body: fileStream,
			},
		});

		const videoId = res.data.id;

		// Get video info for URL + thumbnail
		const videoDetails = await youtube.videos.list({
			part: ['snippet'],
			id: [videoId],
		});

		const snippet = videoDetails.data.items[0].snippet;

		return {
			url: `https://www.youtube.com/watch?v=${videoId}`,
			thumbnail: snippet.thumbnails.default.url,
		};
	} catch (error) {
		console.error('YouTube upload failed:', error);
		throw new Error('YouTube upload failed');
	}
}

export const uploadImage = async (req, res) => {
	const { caption } = req.body;
	try {
		if (!req.file) {
			return res
				.status(400)
				.json({ message: 'Image and caption are required' });
		}
		if (!caption) {
			await fs.unlinkSync(req.file.path);
			return res.status(400).json({ message: 'Caption is required' });
		}

		const result = await cloudinary.uploader.upload(req.file.path, {
			folder: 'moments',
		});

		console.log('Image upload result:', result);

		const moment = await Moment.create({
			type: 'image',
			caption,
			mediaUrl: result.secure_url,
			cloudinaryId: result.public_id,
		});

		res.status(201).json({ moment });
	} catch (error) {
		if (req.file) {
			fs.unlinkSync(req.file.path);
		}
		console.error('Error fetching moments:', error);
		res.status(500).json({ message: 'Failed to fetch moments', error });
	}
};

// http://localhost:9000/api/v1/moments?page=1&limit=5&search=party&type=image&date=2025-07-20&all=true

export const getMoments = async (req, res) => {
	try {
		const {
			page = 1,
			limit = 10,
			search = '',
			date,
			type, // image or video
			all = false, // admin-only: if true, bypass 'approved' filter
		} = req.query;

		const query = {};

		// Admin-level access: only allow if user is admin
		const isAdmin = req.user && req.user.role === 'admin';

		// Only approved moments unless admin explicitly requests all
		if (!(all === 'true' && isAdmin)) {
			query.status = 'approved';
		}

		// Filter by caption (case-insensitive)
		if (search) {
			query.caption = { $regex: search, $options: 'i' };
		}

		// Filter by type (image or video)
		if (type && ['image', 'video'].includes(type)) {
			query.type = type;
		}

		// Filter by creation date (YYYY-MM-DD)
		if (date) {
			const start = new Date(date);
			const end = new Date(date);
			end.setHours(23, 59, 59, 999);
			query.createdAt = { $gte: start, $lte: end };
		}

		const moments = await Moment.find(query)
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(parseInt(limit));

		const total = await Moment.countDocuments(query);

		res.status(200).json({
			data: moments,
			currentPage: parseInt(page),
			totalPages: Math.ceil(total / limit),
			totalItems: total,
		});
	} catch (error) {
		console.error('Error fetching moments:', error);
		res
			.status(500)
			.json({ message: 'Failed to fetch moments', error: error.message });
	}
};

export const uploadVideo = async (req, res) => {
	const { caption } = req.body;
	const filePath = req.file.path;
	try {
		if (!req.file) {
			return res
				.status(400)
				.json({ message: 'Video and caption are required' });
		}
		if (!caption) {
			await fs.unlinkSync(req.file.path);
			return res.status(400).json({ message: 'Caption is required' });
		}
		console.log('Uploading video to YouTube:', filePath);
		const videoResponse = await youtube.videos.insert({
			part: 'snippet,status',
			requestBody: {
				snippet: {
					title: caption || 'Moment Video',
					description: 'User-generated moment',
				},
				status: {
					privacyStatus: 'public',
				},
			},
			media: {
				body: fs.createReadStream(filePath),
			},
		});

		console.log('videoResponse:', videoResponse);
		const videoId = videoResponse.data.id;

		const moment = await Moment.create({
			userId: req?.user?._id,
			type: 'video',
			caption,
			mediaUrl: `https://www.youtube.com/watch?v=${videoId}`,
			youtubeVideoId: videoId,
		});

		res.status(201).json({ moment });
	} catch (error) {
		if (req.file) {
			fs.unlinkSync(req.file.path);
		}
		console.error('Error fetching moments:', error);
		res.status(500).json({ message: 'Failed to fetch moments', error });
	}
};

// 📸 GET /api/moments/gallery
export const getGalleryImages = async (req, res) => {
	try {
		const images = await Moment.find({
			type: 'image',
			status: 'approved',
		}).sort({ createdAt: -1 });
		res.status(200).json({ success: true, data: images });
	} catch (err) {
		res.status(500).json({ success: false, message: 'Error fetching images' });
	}
};

// 🎥 GET /api/moments/videos
export const getMomentVideos = async (req, res) => {
	try {
		const videos = await Moment.find({
			type: 'video',
			status: 'approved',
		}).sort({ createdAt: -1 });
		res.status(200).json({ success: true, data: videos });
	} catch (err) {
		res.status(500).json({ success: false, message: 'Error fetching videos' });
	}
};

export const uploadMultipleMoments = async (req, res) => {
	try {
		const files = req.files;
		const userId = req?.user?._id; // if authenticated
		const results = [];

		for (const file of files) {
			const ext = file.mimetype;

			if (ext.startsWith('image/')) {
				const streamUpload = () =>
					new Promise((resolve, reject) => {
						const stream = cloudinary.uploader.upload_stream(
							{ folder: 'moments/images' },
							(error, result) => {
								if (result) resolve(result);
								else reject(error);
							}
						);
						streamifier.createReadStream(file.buffer).pipe(stream);
					});

				const cloudRes = await streamUpload();

				const saved = await Moment.create({
					userId,
					type: 'image',
					caption: req.body.caption || '',
					mediaUrl: cloudRes.secure_url,
				});

				results.push(saved);
			}

			if (ext.startsWith('video/')) {
				// TODO: Validate duration < 1 min
				const youtubeRes = await uploadVideoToYouTube(
					file.buffer,
					file.originalname
				);
				const saved = await Moment.create({
					userId,
					type: 'video',
					caption: req.body.caption || '',
					mediaUrl: youtubeRes.url,
					thumbnailUrl: youtubeRes.thumbnail,
				});
				results.push(saved);
			}
		}

		res.status(201).json({ success: true, data: results });
	} catch (err) {
		if (req.files) {
			req.files.forEach((file) => {
				fs.unlinkSync(file.path);
			});
		}
		console.error('Upload error:', err);
		res.status(500).json({ success: false, message: 'Upload failed' });
	}
};

export const uploadMultipleImages = async (req, res) => {
	try {
		if (!req.files || req.files.length === 0) {
			return res.status(400).json({ message: 'No images uploaded.' });
		}

		const { caption } = req.body;
		const uploadedUrls = [];
		const moments = [];

		for (const file of req.files) {
			const result = await cloudinary.uploader.upload(file.path, {
				folder: 'moments',
				resource_type: 'image',
			});
			uploadedUrls.push(result);

			const moment = await Moment.create({
				type: 'image',
				caption,
				mediaUrl: result.secure_url,
				cloudinaryId: result.public_id,
			});
			moments.push(moment);
		}

		return res.status(201).json({
			message: 'Images uploaded successfully.',
			moments,
		});
	} catch (error) {
		console.error('Upload error:', error);
		// Clean up any uploaded files
		if (req.files) {
			req.files.forEach((file) => {
				fs.unlinkSync(file.path);
			});
		}
		return res
			.status(500)
			.json({ message: 'Image upload failed.', error: error.message });
	}
};

// independent student
// leaderbooard for school
// streak
