import {config} from 'dotenv';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {GoogleGenAI} from '@google/genai'
import {SSEClientTransport} from '@modelcontextprotocol/sdk/client/sse.js'
import readline from 'readline/promises'
import { stdin,stdout } from 'process';
import { text } from 'stream/consumers';

config();


    const ai = new GoogleGenAI({
        apiKey:process.env.GEMINI_API_KEY4
    });
    
    const mcpClient = new Client({
        name:'MCP-Client',
        version:'1.0.0'
    })
    
    const rl = readline.createInterface({
        input:stdin,
        output:stdout,
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
    
        chatHistory.push({
            role:'user',
            parts:[{
                type:'text',
                text:toolResult.content[0].text + `dont call a tool until its necessary.If you are not able to find a specific response dont call a tool again just give a certain response.`
            }]
        })
    
        const afterResponse = await ai.models.generateContent({
            model:'gemini-3-flash-preview',
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
            return chatLoop({ body: { toolCall: againFunctionCall } }, res);
        }
    
        chatHistory.push({
            role:'model',
            parts:[{
                type:'text',
                text:afterResponse.text
            }]
        })
    
        // console.log(afterResponse.text);
        return res.status(200).json({
            message:afterResponse.text
        });
     
        }else{
    
            let question = '';
    
            if(chatHistory.length == 0){
                question = question1 + req.body.prompt;
                // question += await rl.question("You: ");
            }else{
                // question = await rl.question("You: ");
                question = req.body.prompt;
            }
    
    
            chatHistory.push({
                role:'user',
                parts:[
                    {
                        type:'text',
                        text:question
                    }
                ]
            })
    
            const response = await ai.models.generateContent({
                model:'gemini-3-flash-preview',
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
                return chatLoop({ body: { toolCall: functionCall } }, res);
            }
    
            chatHistory.push({
                role:'model',
                parts:[{
                    type:'text',
                    text:response.text
                }]
            })
    
            // console.log(response.text)
            return res.status(200).json({
                message:response.text
            });
    
        }
    
        chatLoop();
    }
