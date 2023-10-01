import { Request, Response, NextFunction } from 'express';
import { CatchAsyncerror } from '../middleware/catchAsyncerrors';
import ErrorHandler from '../utils/ErrorHandler';
import cloudinary from 'cloudinary';
import { createCourse } from '../services/course.service';
import courseModel from '../models/course.model';
import { redis } from '../utils/redis';

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

// Get single course --- without purchasing
export const getSingleCourse = CatchAsyncerror(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const courseId = req.params.id;

			const isCacheExist = await redis.get(courseId);

			if (isCacheExist) {
				const course = JSON.parse(isCacheExist);
				res.status(200).json({
					success: true,
					course,
				});
			} else {
				const course = await courseModel
					.findById(req.params.id)
					.select(
						'-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links'
					);
				await redis.set(courseId, JSON.stringify(course));

				res.status(200).json({
					success: true,
					course,
				});
			}
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// Get all courses --- without purchase
export const getAllCourses = CatchAsyncerror(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const isCacheExist = await redis.get('allCourses');

			if (isCacheExist) {
				const courses = JSON.parse(isCacheExist);
				res.status(200).json({
					success: true,
					courses,
				});
			} else {
				const courses = await courseModel
					.find()
					.select(
						'-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links'
					);

				await redis.set('allCourses', JSON.stringify(courses));

				res.status(200).json({
					success: true,
					courses,
				});
			}
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);
