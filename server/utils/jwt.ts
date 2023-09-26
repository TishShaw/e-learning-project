require('dotenv').config();
import { Response, CookieOptions } from 'express';
import { IUser } from '../models/user_model';
import { redis } from './redis';

//  Parse environment variables to integrates with fallback values
const accessTokenExpire = parseInt(
	process.env.ACCESS_TOKEN_EXPIRE || '300',
	10
);
const refreshTokenExpire = parseInt(
	process.env.REFRESH_TOKEN_EXPIRE || '1200',
	10
);

//  Options for cookies
export const accessTokenOptions: CookieOptions = {
	expires: new Date(Date.now() * accessTokenExpire * 60 * 60 * 1000),
	maxAge: accessTokenExpire * 60 * 60 * 1000,
	httpOnly: true,
	sameSite: 'lax',
	secure: true,
};

export const refreshTokenOptions: CookieOptions = {
	expires: new Date(Date.now() * refreshTokenExpire * 24 * 60 * 60 * 1000),
	maxAge: accessTokenExpire * 24 * 60 * 60 * 1000,
	httpOnly: true,
	sameSite: 'lax',
};

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
	const accessToken = user.signAccessToken();
	const refreshToken = user.signRefreshToken();

	//  Upload session to redis
	redis.set(user._id, JSON.stringify(user));

	//  Only set secure to true in production
	if (process.env.NODE_ENV === 'production') {
		accessTokenOptions.secure = true;
	}

	res.cookie('access_token', accessToken, accessTokenOptions);
	res.cookie('refresh_token', refreshToken, refreshTokenOptions);
	res.status(statusCode).json({
		success: true,
		user,
	});
};
