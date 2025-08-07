import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { rateLimit } from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import fs from 'fs';
import path from 'path';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';

// routes
// import adminRoutes from './routes/admin/index.js';
import userRoutes from './routes/user.js';
import momentRoutes from './routes/moment.js';
import donorRoutes from './routes/donor.js';
import hospitalRoutes from './routes/hospital.js';
import bloodRequestRoutes from './routes/bloodRequest.js';
import leaderboardRoutes from './routes/leaderboard.js';
import squadRoutes from './routes/squad.js';
import indexRoutes from './routes/index.js';
import { matchDonorsToRequests } from './services/aiService.js';
import errorHandler from './middleware/errorHandler.js'; // In your app.js or server entry point
import chatRoutes from './routes/chat.js';

// setups
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const file = fs.readFileSync(path.resolve(__dirname, './swagger.yaml'), 'utf8');
const swaggerDocument = YAML.parse(file);
/* CONFIGURATION */
dotenv.config();
const app = express();

const PORT = process.env.PORT || 9000;
// Rate limiter to avoid misuse of the service and avoid cost spikes
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 500, // Limit each IP to 500 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	validate: { xForwardedForHeader: false },
	handler: (_, __, ___, options) => {
		throw new Error(
			options.statusCode || 500,
			`There are too many requests. You are only allowed ${
				options.max
			} requests per ${options.windowMs / 60000} minutes`
		);
	},
});

// Apply the rate limiting middleware to all requests
app.use(limiter);
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
app.use(morgan('common'));
app.use(bodyParser.json());
app.use(express.static('public')); // configure static file to save images locally
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
	cors({
		origin: [
			'http://localhost:3000',
			'http://localhost:8080',
			'http://localhost:5173',
		],
		credentials: true,
	})
);

// required for passport
app.use(
	session({
		secret: process.env.EXPRESS_SESSION_SECRET,
		resave: true,
		saveUninitialized: true,
	})
); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

/* ROUTES */
// app.use('/api/v1/admins', adminRoutes);
app.use('/api/v1/index', indexRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/moments', momentRoutes);
app.use('/api/v1/donors', donorRoutes);
app.use('/api/v1/hospitals', hospitalRoutes);
app.use('/api/v1/leaderboard', leaderboardRoutes);
app.use('/api/v1/squads', squadRoutes);
app.use('/api/v1/blood-requests', bloodRequestRoutes);
app.use('/api/v1/chats', chatRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
	res.status(200).json({ status: 'healthy' });
});

// * API DOCS
// ? Keeping swagger code at the end so that we can load swagger on "/" route
app.use(
	'/',
	swaggerUi.serve,
	swaggerUi.setup(swaggerDocument, {
		swaggerOptions: {
			docExpansion: 'all', // keep all the sections collapsed by default none/all
		},
		customSiteTitle: `${process.env.PROJECT_NAME || 'backend'} api docs`,
	})
);

// Schedule donor matching to run every 30 minutes
setInterval(matchDonorsToRequests, 30 * 60 * 1000);
// error
// common error handling middleware
app.use(errorHandler);

/* MONGOOSE SETUP */
mongoose
	.connect(process.env.MONGO_URL)
	.then(() => {
		app.listen(PORT, () => console.log(`Server Port: ${PORT}`));
	})
	.catch((error) => console.log(`${error} did not connect`));
