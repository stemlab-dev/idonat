import express from 'express';
const router = express.Router();
import passport from 'passport';
import { requireAuth, verifyPermission } from '../middleware/requireAuth.js';
import { validate } from '../validators/validate.js';
import { upload } from '../middleware/multer.js';
import {
	userRegisterValidator,
	userLoginValidator,
	userAssignRoleValidator,
	userRoleBaseLoginValidator,
	userChangeCurrentPasswordValidator,
	userForgotPasswordValidator,
	userResetForgottenPasswordValidator,
} from '../validators/user.js';
import {
	signinUser,
	roleBasedLogin,
	loginUser,
	getUser,
	getUsers,
	assignRole,
	logoutUser,
	updateProfile,
	updateAvatar,
	forgetPassword,
	verifyResetToken,
	resetPassword,
	changePassword,
	sendOTP,
	verifyOTP,
	refreshAccessToken,
	resendEmailVerification,
	verifyEmail,
	deleteUser,
	handleSocialLogin,
} from '../controllers/user.js';

// console.log('hello');

// // get user
router.post('/login', userLoginValidator, validate, loginUser);
// // role base login
router.post('/signin', userRoleBaseLoginValidator, validate, roleBasedLogin);

// //new user
router.post('/register', userRegisterValidator, validate, signinUser);

// //forget Password link to mail
router.post(
	'/forgot-password',
	userForgotPasswordValidator,
	validate,
	forgetPassword
);

router.post('/refresh-token', refreshAccessToken);
router.get('/verify-email/:verificationToken', verifyEmail);
router.post('/resend-email-verification', requireAuth, resendEmailVerification);

// //send otp to mail
router.post('/send-otp', sendOTP);

// //verify otp
router.post('/verify-otp', verifyOTP);

// // //resetPassword
router.get('/verify-token/:token', verifyResetToken);

// verify refresh token and update password
router.post(
	'/reset-password/:token',
	userResetForgottenPasswordValidator,
	validate,
	resetPassword
);

// // //change Password
router.post(
	'/change-password',
	requireAuth,
	userChangeCurrentPasswordValidator,
	validate,
	changePassword
);

// Authenticate user
// //get user
router.get('/current-user', requireAuth, getUser);

// //log out user
router.post('/logout', requireAuth, logoutUser);

// // //update user profile
router.patch('/avatar', requireAuth, upload.single('avatar'), updateAvatar);

// // //update user profile with image or without image
router.patch('/profile', requireAuth, upload.single('avatar'), updateProfile);

router.delete('/delete-account', requireAuth, deleteUser);

// admin roles
router.get('/', requireAuth, verifyPermission(['ADMIN']), getUsers);
router.post(
	'/assign-role/:id',
	userAssignRoleValidator,
	requireAuth,
	verifyPermission(['ADMIN']),
	assignRole
);

// SSO routes
router.route('/google').get(
	passport.authenticate('google', {
		scope: ['profile', 'email'],
	}),
	(req, res) => {
		res.send('redirecting to google...');
	}
);

router
	.route('/google/callback')
	.get(passport.authenticate('google'), handleSocialLogin);

export default router;
