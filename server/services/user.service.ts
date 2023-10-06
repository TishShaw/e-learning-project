import { NextFunction, Response } from 'express';
import userModel from '../models/user_model';
import { redis } from '../utils/redis';

// Get user by id
export const getUserById = async (id: string, res: Response) => {
	const userJson = await redis.get(id);
	if (userJson) {
		const user = JSON.parse(userJson);
		res.status(201).json({
			success: true,
			user,
		});
	}
};

// Get all users
export const getAllUsersService = async (res: Response) => {
	const users = await userModel.find().sort({ createdAt: -1 });

	res.status(200).json({
		success: true,
		users,
	});
};

// Update user role
export const UpdateUserRoleService = async (
	res: Response,
	id: string,
	role: string
) => {
	const users = await userModel.findByIdAndUpdate(id, { role }, { new: true });
	res.status(200).json({
		success: true,
		users,
	});
};
