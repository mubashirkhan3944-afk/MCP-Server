import 'dotenv/config';
import express from "express";
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import connectDB from './src/db.js';
import {server} from './src/mcpserver.js';
await connectDB();

const app = express();


const transports = {};


app.get('/sse',async(req,res)=>{
    const transport = new SSEServerTransport('/messages',res);
    transports[transport.sessionId] = transport;

    res.on('close',()=>{
        delete transports[transport.sessionId];
    });
    await server.connect(transport);

})

app.post('/messages',async(req,res)=>{
    const sessionId = req.query.sessionId;
    const transport = transports[sessionId];
    if(transport){
        await transport.handlePostMessage(req,res);
    }else{
        res.status(400).send('No transport found for session id');
    }
});



app.listen(3000,async()=>{
    console.log('Server running on port 3000')
})
