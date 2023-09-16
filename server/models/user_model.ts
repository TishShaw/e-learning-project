import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

const emailRegexpattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Define types for user model
export interface IUser extends Document {
	name: string;
	email: string;
	password: string;
	avatar: {
		public_id: string;
		url: string;
	};
	role: string;
	isVerified: boolean;
	courses: Array<{ courseId: string }>;
	comparePassword: (password: string) => Promise<boolean>;
}

const userSchema: Schema<IUser> = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Please enter your email'],
		},
		email: {
			type: String,
			required: [true, 'Please enter you email'],
			validate: {
				validator: function (value: string) {
					return emailRegexpattern.test(value);
				},
				message: 'Please enter valid email',
			},
			unique: true,
		},
		password: {
			type: String,
			required: [true, 'Please enter you password'],
			minLength: [6, 'Password must be at leat 6 characters'],
			select: false,
		},
		avatar: {
			public_id: String,
			url: String,
		},
		role: {
			type: String,
			default: 'user',
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		courses: [
			{
				courseId: String,
			},
		],
	},
	{ timestamps: true }
);

// Hash Password before saving
userSchema.pre<IUser>('save', async function (next) {
	if (!this.isModified('password')) {
		next();
	}
	this.password = await bcrypt.hash(this.password, 10);
	next();
});
