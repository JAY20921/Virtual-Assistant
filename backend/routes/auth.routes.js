import express from 'express';
import { signup, Login, Logout } from '../controllers/auth.controller.js';

const authRouter=express.Router();

authRouter.post("/signup", signup);
authRouter.post("/login", Login);
authRouter.get("/logout", Logout);

export default authRouter;