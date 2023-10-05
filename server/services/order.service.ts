import { Response, NextFunction } from 'express';
import { CatchAsyncerror } from '../middleware/catchAsyncerrors';
import OrderModel from '../models/orderModel';

//  Create new order
export const newOrder = CatchAsyncerror(
	async (data: any, res: Response, next: NextFunction) => {
		const order = await OrderModel.create(data);

		res.status(201).json({
			success: true,
			order,
		});
	}
);
