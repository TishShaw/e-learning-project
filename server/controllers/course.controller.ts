import { Request, Response, NextFunction } from 'express';
import { CatchAsyncerror } from '../middleware/catchAsyncerrors';
import ErrorHandler from '../utils/ErrorHandler';
import cloudinary from 'cloudinary';
import { createCourse } from '../services/course.service';
import courseModel from '../models/course.model';
import { redis } from '../utils/redis';
import mongoose from 'mongoose';
import ejs from 'ejs';
import path from 'path';
import sendMail from '../utils/sendMail';
import NotificationModel from '../models/notificationModel';

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
				await redis.set(courseId, JSON.stringify(course), 'EX', 604800); // 7 days

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

// Get course content - only for valid user
export const getCourseByUser = CatchAsyncerror(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const userCourseList = req.user?.courses;

			const courseId = req.params.id;

			const courseExist = userCourseList?.find(
				(course: any) => course._id === courseId
			);

			if (!courseExist) {
				return next(
					new ErrorHandler('You are not allowed to access this course', 404)
				);
			}

			const course = await courseModel.findById(courseId);

			const content = course?.courseData;

			res.status(200).json({
				success: true,
				content,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// Add questions in course
interface IAddQuestionData {
	question: string;
	courseId: string;
	contentId: string;
}

export const addQuestion = CatchAsyncerror(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { question, courseId, contentId } = req.body as IAddQuestionData;

			const course = await courseModel.findById(courseId);

			if (!mongoose.Types.ObjectId.isValid(contentId)) {
				return next(new ErrorHandler('Invalid content id', 400));
			}

			const courseContent = course?.courseData?.find((item: any) =>
				item._id.equals(contentId)
			);

			if (!courseContent) {
				return next(new ErrorHandler('Invalid content id', 400));
			}

			// Create a new question object
			const newQuestion: any = {
				user: req.user,
				question,
				questionReplies: [],
			};

			// Add question to course content
			courseContent?.questions.push(newQuestion);

			await NotificationModel.create({
				user: req.user?._id,
				title: 'New Question Reciebede',
				message: `You have a new question from ${courseContent.title}
            `,
			});

			// Save updated course
			await course?.save();

			res.status(200).json({
				success: true,
				course,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// Add replies to question
interface IAddAnswerData {
	answer: string;
	courseId: string;
	contentId: string;
	questionId: string;
}

export const addAnswer = CatchAsyncerror(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { answer, courseId, contentId, questionId } =
				req.body as IAddAnswerData;

			const course = await courseModel.findById(courseId);

			if (!mongoose.Types.ObjectId.isValid(contentId)) {
				return next(new ErrorHandler('Invalid content id', 400));
			}

			const courseContent = course?.courseData?.find((item: any) =>
				item._id.equals(contentId)
			);

			if (!courseContent) {
				return next(new ErrorHandler('Invalid content id', 400));
			}

			const question = courseContent?.questions?.find((item: any) =>
				item._id.equals(questionId)
			);

			if (!question) {
				return next(new ErrorHandler('Invalid question id', 400));
			}

			const newAnswer: any = {
				user: req.user,
				answer,
			};

			// Add answer to question replies array
			question?.questionReplies?.push(newAnswer);

			// Save updated course
			await course?.save();

			if (req.user?._id === question.user._id) {
				// Notify user
				await NotificationModel.create({
					user: req.user?._id,
					title: 'New Question Reply Recieved',
					message: `You have a new question reply in ${courseContent.title}
            `,
				});
			} else {
				const data = {
					name: question.user.name,
					title: courseContent.title,
				};

				const html = await ejs.renderFile(
					path.join(__dirname, '../mails/question-replies.ejs'),
					data
				);

				try {
					await sendMail({
						email: question.user.email,
						subject: 'Questions Reply',
						template: 'question-replies.ejs',
						data,
					});
				} catch (error: any) {
					return next(new ErrorHandler(error.message, 500));
				}
			}

			res.status(200).json({
				success: true,
				course,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// Add review
interface IAddReviewData {
	review: string;
	courseId: string;
	rating: number;
	userId: string;
}

export const addReview = CatchAsyncerror(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const userCourseList = req.user?.courses;

			const courseId = req.params.id;

			//  Check if courseId already exists in users courses list
			const courseExist = userCourseList?.some(
				(course: any) => course._id.toString() === courseId.toString()
			);

			if (!courseExist) {
				return next(
					new ErrorHandler('You do not have permission to this course', 404)
				);
			}

			const course = await courseModel.findById(courseId);

			const { review, rating } = req.body as IAddReviewData;

			const reviewData: any = {
				user: req.user,
				rating,
				comment: review,
			};

			course?.reviews.push(reviewData);

			let avg = 0;

			course?.reviews.forEach((rev: any) => {
				avg += rev.rating;
			});

			if (course) {
				course.ratings = avg / course.reviews.length;
			}

			await course?.save();

			const notification = {
				title: 'New Review Recieved',
				message: `${req.user?.name} has given a review in ${course?.name}`,
			};

			res.status(200).json({
				success: true,
				course,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// Add reply to review
interface IAddReviewData {
	comment: string;
	courseId: string;
	reviewId: string;
}

export const addReplyToReview = CatchAsyncerror(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { comment, courseId, reviewId } = req.body as IAddReviewData;

			const course = await courseModel.findById(courseId);

			if (!course) {
				return next(new ErrorHandler('Course not found', 404));
			}

			const review = course?.reviews?.find(
				(rev: any) => rev._id.toString() === reviewId
			);

			if (!review) {
				return next(new ErrorHandler('Review not found', 404));
			}

			const replyData: any = {
				user: req.user,
				comment,
			};

			if (!review.commentReplies) {
				review.commentReplies = [];
			}

			review.commentReplies.push(replyData);

			await course?.save();

			res.status(200).json({
				success: true,
				course,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	}
);

// Delete course
export const deleteCourse = CatchAsyncerror(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { id } = req.params;

			const course = await courseModel.findById(id);

			if (!course) {
				return next(new ErrorHandler('Course not found', 404));
			}

			await course.deleteOne({ id });

			await redis.del(id);

			res.status(200).json({
				success: true,
				message: 'Course deleted successfully',
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 400));
		}
	}
);
