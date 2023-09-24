import { NextFunction, Response } from 'express';
import userModel from '../models/user_model';

// Get user by id
export const getUserById = async (id: string, res: Response) => {
	const user = await userModel.findById(id);
	res.status(201).json({
		success: true,
		user,
	});
};
