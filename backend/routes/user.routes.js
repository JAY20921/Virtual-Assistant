import express from 'express';
import { signup, Login, Logout } from '../controllers/auth.controller.js';
import { getCurrentUser, updateAssistant , askToAssistant } from '../controllers/user.controllers.js';
import isAuth from '../middlewares/isAuth.middleware.js';
import upload from '../middlewares/multer.middleware.js';

const authRouter=express.Router();


authRouter.get("/currentUser",isAuth, getCurrentUser);
authRouter.post("/update",isAuth,upload.single("assistantImage"), updateAssistant);

authRouter.post("/asktoassistant", isAuth, askToAssistant);


export default authRouter;