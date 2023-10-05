import NotificationModel from '../models/notificationModel';
import { NextFunction, Request, Response } from 'express';
import { CatchAsyncerror } from '../middleware/catchAsyncerrors';
import ErrorHandler from '../utils/ErrorHandler';

// Get all notifications --- only admin
export const getNotification = CatchAsyncerror(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const notifications = await NotificationModel.find().sort({
				createdAt: -1,
			});

			res.status(201).json({
				success: true,
				notifications,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

//  Update notification status --- only admin
export const updateNotification = CatchAsyncerror(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const notification = await NotificationModel.findById(req.params.id);
			if (!notification) {
				return next(new ErrorHandler(' Notification not found', 404));
			} else {
				notification.status ? (notification.status = 'read') : notification;
			}

			await notification.save();

			const notifications = await NotificationModel.find().sort({
				createdAt: -1,
			});

			res.status(201).json({
				success: true,
				notifications,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);
