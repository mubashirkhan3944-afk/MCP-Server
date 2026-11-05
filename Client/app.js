import express from 'express';
import cors from 'cors'
import {chatLoop} from './index.js'
import {getChatHistory} from './index.js'
import {getAllChats} from './index.js'
import {createChat} from './index.js'
import connectDB from './db/db.js';
import { config } from 'dotenv';


const app = express();


config();
connectDB();



app.use(express.json());
app.use(cors({
    origin:'http://localhost:5173',
    credentials:true,
}));


app.post('/chat',chatLoop)
app.get('/get-chat/:id',getChatHistory)
app.get('/get-all-chats',getAllChats)
app.post('/create',createChat)


app.listen('3001',()=>{
    console.log('Client server running on port 3001');
})