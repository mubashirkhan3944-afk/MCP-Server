import { config } from 'dotenv';
config();
import express from 'express';
import cors from 'cors'
import connectDB from './db/db.js';
import authRoutes from './routes/authroutes.js'
import cookieParser from 'cookie-parser';
import chatRoutes from './routes/chatroutes.js'
import googleRoutes from './services/googleservices/routes/googleroutes.js'
import session from "express-session";


const app = express();


connectDB();


app.use(express.json());
app.use(cors({
    origin:'http://localhost:5173',
    credentials:true,
}));
app.use(cookieParser());



app.use('/auth',authRoutes)
app.use('/api',chatRoutes)
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // localhost development only
      sameSite: "lax",
      maxAge: 10 * 60 * 1000
    }
  });
  
app.use("/auth/google", sessionMiddleware, googleRoutes);


app.listen(5000,()=>{
    console.log('Client server running on port 5000');
})
