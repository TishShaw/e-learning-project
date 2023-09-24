import { Request, Response, NextFunction } from 'express';
import { CatchAsyncerror } from './catchAsyncerrors';
import ErrorHandler from '../utils/ErrorHandler';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { redis } from '../utils/redis';

//  Authenticate user
export const isAuthenticated = CatchAsyncerror(
	async (req: Request, res: Response, next: NextFunction) => {
		const access_token = req.cookies.access_token;

		if (!access_token) {
			return next(
				new ErrorHandler('Please login to access this resource.', 400)
			);
		}

		const decoded = jwt.verify(
			access_token,
			process.env.ACCESS_TOKEN as string
		) as JwtPayload;

		if (!decoded) {
			return next(new ErrorHandler('Access token is not valid', 400));
		}

		const user = await redis.get(decoded.id);

		if (!user) {
			return next(new ErrorHandler('User not found', 400));
		}

		req.user = JSON.parse(user);

		next();
	}
);

// Validate user role
export const authorizeRoles = (...roles: string[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		console.log(req.user);
		if (!roles.includes(req.user?.role || '')) {
			return next(
				new ErrorHandler(
					`Role: ${req.user?.role} is not allowed to access this resource`,
					403
				)
			);
		}
		next();
	};
};