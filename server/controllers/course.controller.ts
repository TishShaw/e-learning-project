import { Request, Response, NextFunction } from 'express';
import { CatchAsyncerror } from '../middleware/catchAsyncerrors';
import ErrorHandler from '../utils/ErrorHandler';
import cloudinary from 'cloudinary';
import { createCourse } from '../services/course.service';
import courseModel from '../models/course.model';

// Upload course
export const uploadCourse = CatchAsyncerror(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const data = req.body;
			const thumbnail = data.thumbnail;
			if (thumbnail) {
				const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
					folder: 'Courses',
				});

				data.thumbnail = {
					public_id: myCloud.public_id,
					url: myCloud.secure_url,
				};
			}

			await createCourse(data, res, next);
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// Edit course
export const editCourse = CatchAsyncerror(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const data = req.body;

			const thumbnail = data.thumbnail;

			if (thumbnail) {
				await cloudinary.v2.uploader.destroy(thumbnail.public_id);

				const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
					folder: 'Courses',
				});

				data.thumbnail = {
					public_id: myCloud.public_id,
					url: myCloud.secure_url,
				};
			}

			const courseId = req.params.id;

			const course = await courseModel.findByIdAndUpdate(
				courseId,
				{
					$set: data,
				},
				{ new: true }
			);

			res.status(201).json({
				success: true,
				course,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);
