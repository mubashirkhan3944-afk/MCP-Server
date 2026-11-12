import {config} from 'dotenv'
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {GoogleGenAI} from '@google/genai'
import {SSEClientTransport} from '@modelcontextprotocol/sdk/client/sse.js'
import chatModel from '../models/model.js';


config()

    const ai = new GoogleGenAI({
        apiKey:process.env.GEMINI_API_KEY3
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
    .catch((error)=>{
        console.log(error.message)
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
    
    
        const chat = await chatModel.findById(chatId).select('userId');

        if (!chat?.userId) {
            return res.status(400).json({
                message: 'This chat has no user. Create a new chat while logged in.'
            });
        }

        const toolResult = await mcpClient.callTool({
            name:toolCall.name,
            arguments:{
                ...toolCall.args,
                userId: String(chat.userId),
            },
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
                    role:'model',
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
            
            const chatLength = await chatModel.findById(chatId)

            if(chatLength?.messages.length >= 2){
                const updated = await chatModel.findByIdAndUpdate(chatId,{
                    $push:{
                        messages:{
                            role:'user',
                            message:req.body.prompt
                        }
                    }
                },{
                    new: true
                  })
            }
    
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
                        role:'model',
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

        const userId = req.user._id

        const chats = await chatModel.find({userId});

        return res.status(200).json({
            chats
        });
    }

    export async function createChat(req,res){
        const title = 'New Chat';
        const messages = [{role:'user',message:req.body.prompt}];

        const newChat = await chatModel.create({title,messages,userId:req.user._id});

        console.log('new chat created!',newChat._id);

        return res.status(201).json({
            message:'Chat created successfully',
            chatId: newChat._id
        });
    }