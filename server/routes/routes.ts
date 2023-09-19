import express from 'express';
import { registrationUser } from '../controllers/user.controller';
const userRouter = express.Router();

userRouter.post('/resgistration', registrationUser);

export default userRouter;
