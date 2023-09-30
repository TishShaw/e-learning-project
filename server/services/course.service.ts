import { NextFunction, Response } from 'express';
import courseModel from '../models/course.model';
import { CatchAsyncerror } from '../middleware/catchAsyncerrors';
import ErrorHandler from '../utils/ErrorHandler';

// Create course
export const createCourse = CatchAsyncerror(
	async (data: any, res: Response, next: NextFunction) => {
		const course = await courseModel.create(data);
		res.status(201).json({
			success: true,
			course,
		});
		next();
	}
);
