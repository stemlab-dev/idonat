import { body } from 'express-validator';
import { AvailableUserRoles } from '../constants.js';

export const teacherRegisterValidator = [
	body('name')
		.trim()
		.notEmpty()
		.withMessage('Name is required')
		.isLowercase()
		.withMessage('Name must be lowercase')
		.isLength({ min: 3 })
		.withMessage('Name must be at lease 3 characters long'),
	body('email')
		.trim()
		.notEmpty()
		.withMessage('Email is required')
		.isEmail()
		.withMessage('Email is invalid'),
	body('password')
		.trim()
		.notEmpty()
		.withMessage('Password is required')
		.isLength({ min: 4 })
		.withMessage('Enter a strong password'),
];

export const createAnnouncementValidator = [
	body('title').notEmpty().withMessage('Title is required'),
	body('content').notEmpty().withMessage('Content is required'),
	body('schoolId').notEmpty().withMessage('School Id is required'),
	body('classId').notEmpty().withMessage('Class Id is required'),
	body('scheduleTime').notEmpty().withMessage('Schedule Time is required'),
];

export const userAssignRoleValidator = [
	body('role')
		.optional()
		.isIn(AvailableUserRoles)
		.withMessage('Invalid user role'),
];
