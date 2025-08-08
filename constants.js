/**
 * @type {{ SUPER_ADMIN: 'SUPER_ADMIN', ADMIN: "ADMIN"; USER: "USER"} as const}
 */
export const UserRolesEnum = {
	SUPER_ADMIN: 'SUPER_ADMIN',
	ADMIN: 'ADMIN',
	DONOR: 'DONOR',
	HOSPITAL: 'HOSPITAL',
	USER: 'USER',
};

export const AvailableUserRoles = Object.values(UserRolesEnum);

/**
 * @type {{ GOOGLE: "GOOGLE"; GITHUB: "GITHUB"; EMAIL_PASSWORD: "EMAIL_PASSWORD"} as const}
 */
export const UserLoginType = {
	GOOGLE: 'GOOGLE',
	GITHUB: 'GITHUB',
	EMAIL_PASSWORD: 'EMAIL_PASSWORD',
};

export const AvailableSocialLogins = Object.values(UserLoginType);

export const USER_TEMPORARY_TOKEN_EXPIRY = 20 * 60 * 1000; // 20 minutes
