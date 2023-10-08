import { Request, Response, NextFunction } from 'express';
import ErrorHandler from '../utils/ErrorHandler';
import { CatchAsyncerror } from '../middleware/catchAsyncerrors';
import { generateLast12MonthData } from '../utils/analytics.generator';
import userModel from '../models/user_model';
import courseModel from '../models/course.model';
import OrderModel from '../models/orderModel';

// Get users analytics --- only for admin
export const getUserAnalytics = CatchAsyncerror(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const users = await generateLast12MonthData(userModel);

			res.status(200).json({
				success: true,
				users,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// Get course analytics --- only for admin
export const getCourseAnalytics = CatchAsyncerror(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const course = await generateLast12MonthData(courseModel);

			res.status(200).json({
				success: true,
				course,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// Get course analytics --- only for admin
export const getOrderAnalytics = CatchAsyncerror(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const order = await generateLast12MonthData(OrderModel);

			res.status(200).json({
				success: true,
				order,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);
