import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import connectDB from './config/db.js';
import authRouter from './routes/auth.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import userRouter from './routes/user.routes.js';

const app = express();
app.use(cors({
  origin: 'https://virtual-assistant-byjay.onrender.com',
  credentials: true,
}));
const PORT = process.env.PORT || 5000;


app.use(express.json());
app.use(cookieParser());
app.use("/api/auth" , authRouter );


app.use("/api/user" , userRouter );

app.listen(PORT, () => {
connectDB();
  console.log(`Server is running on port localhost:${PORT}`);
});

