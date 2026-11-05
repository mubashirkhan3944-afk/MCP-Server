import {config} from 'dotenv';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {GoogleGenAI} from '@google/genai'
import {SSEClientTransport} from '@modelcontextprotocol/sdk/client/sse.js'
import readline from 'readline/promises'
import { stdin,stdout } from 'process';
import { text } from 'stream/consumers';
import chatModel from './db/model.js';
import { v4 } from 'uuid';


config();


    const ai = new GoogleGenAI({
        apiKey:process.env.GEMINI_API_KEY1
    });
    
    const mcpClient = new Client({
        name:'MCP-Client',
        version:'1.0.0'
    })
    
    
    const chatHistory = [];
    let tools = [];
    let question1 = `Today is ${new Date()}`;
    
    mcpClient.connect(new SSEClientTransport(new URL('http://localhost:3000/sse')))
    .then(async()=>{
    
        console.log('connected to mcp server');
    
        tools = ((await mcpClient.listTools()).tools.map(tool=>{
            return {
                name: tool.name,
                description: tool.description,
                parameters:{
                    type:tool.inputSchema.type,
                    properties:tool.inputSchema.properties,
                    required:tool.inputSchema.required
                }
            }
        }))
    })
    


    export async function chatLoop(req,res) {

        const chatId = req.body.chatId;
        
        if(req.body.toolCall){
            const {toolCall} = req.body;
    
        console.log('Calling Tool: ',toolCall);
    
        chatHistory.push({
            role:'model',
            parts:[{
                type:'text',
                text:`Calling tool ${toolCall.name}`
            }]
        })
    
    
        const toolResult = await mcpClient.callTool({
            name:toolCall.name,
            arguments:toolCall.args,
            id:toolCall.id
        })

        console.log(toolResult.content[0].text)
    
        chatHistory.push({
            role:'user',
            parts:[{
                type:'text',
                text:toolResult.content[0].text + `dont call a tool until its necessary.If you are not able to find a specific response dont call a tool again just give a certain response.`
            }]
        })
    
        const afterResponse = await ai.models.generateContent({
            model:'gemini-3.1-flash-lite',
            contents:chatHistory,
            config:{
                tools:[
                    {
                        functionDeclarations: tools,
                    }
                ]
            }
        })
    
        const againFunctionCall = afterResponse.candidates[0].content.parts[0].functionCall;
    
    
        if(againFunctionCall){
            return chatLoop({ body: { toolCall: againFunctionCall, chatId } }, res);
        }


        chatHistory.push({
            role:'model',
            parts:[{
                type:'text',
                text:afterResponse.text
            }]
        })

        const updatedchat = await chatModel.findByIdAndUpdate(chatId,{
            $push:{
                messages:{
                    role:'user',
                    message:afterResponse.text
                }
            }
        },{
            new: true
          })
    
        console.log('response added to chat',chatId);
        return res.status(200).json({
            message:afterResponse.text
        });
     
        }else{
    
    
            chatHistory.push({
                role:'user',
                parts:[
                    {
                        type:'text',
                        text:req.body.prompt + question1
                    }
                ]
            })

    
            const response = await ai.models.generateContent({
                model:'gemini-3.1-flash-lite',
                contents:chatHistory,
                config:{
                    tools:[
                        {
                            functionDeclarations: tools,
                        }
                    ]
                }
            })
    
            const functionCall = response.candidates[0].content.parts[0].functionCall
    
            if(functionCall){
                return chatLoop({ body: { toolCall: functionCall, chatId } }, res);
            }
    
            chatHistory.push({
                role:'model',
                parts:[{
                    type:'text',
                    text:response.text
                }]
            })

            const updated = await chatModel.findByIdAndUpdate(chatId,{
                $push:{
                    messages:{
                        role:'user',
                        message:response.text
                    }
                }
            },{
                new: true
              })
    
            console.log('response added to chat',chatId);
            res.status(200).json({
                message:response.text
            });
    
        }
    
        chatLoop();
    }

    export async function getChatHistory(req,res){
        const {id} = req.params;

        const chat = await chatModel.findById(id);  

        if(!chat){
            return res.status(404).json({
                message:'Chat not found'
            });
        }

        return res.status(200).json({
            chat
        });
    }

    export async function getAllChats(req,res){

        const chats = await chatModel.find();

        return res.status(200).json({
            chats
        });
    }

    export async function createChat(req,res){
        const title = 'New Chat';
        const messages = [{role:'user',message:req.body.prompt}];

        const newChat = await chatModel.create({title,messages});

        console.log('new chat created!');

        return res.status(201).json({
            message:'Chat created successfully',
            chatId:newChat._id
        });
    }