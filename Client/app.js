import express from 'express';
import cors from 'cors'
import {chatLoop} from './index.js'


const app = express();


app.use(express.json());
app.use(cors({
    origin:'http://localhost:5173',
    credentials:true,
}));


app.post('/chat',chatLoop)


app.listen('3001',()=>{
    console.log('Client server running on port 3001');
})