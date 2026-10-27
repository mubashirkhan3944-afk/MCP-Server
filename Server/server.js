import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import * as z from 'zod/v4';
import express from 'express';
import {google} from 'googleapis'
import {config} from 'dotenv'
import connectDB from './db/db.js'
import eventModel from './db/model.js';
import { id } from 'zod/v4/locales';


config();

// connectDB();

const app = express();

const transports = {};


const oauth2Client = new google.auth.OAuth2(
    {
        client_id:process.env.GOOGLE_CLIENT_ID,
        client_secret:process.env.GOOGLE_CLIENT_SECRET
    }
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

const calendar = google.calendar({
    version: "v3",
    auth: oauth2Client,
  });

  const server = new McpServer({
    name:'MCP_Server',
    version:'1.0.0'
  })

//Get all calendar events
server.registerTool(
  "Get_All_Events",
  {
    description:'Get All events listed on the google calendar of the user.All the details of the meeting can be accessed by calling this tool.',
    inputSchema:{
      startDateTime: z.string().datetime({
        offset:true
      }),
      endDateTime:z.string().datetime({
        offset:true
      }),
      timeZone:z.string().default('Asia/Karachi'),
      googleEventId:z.string(),
    }
  },

  async ({
    startDateTime,
    endDateTime,
    timeZone,
    description,
    googleEventId
  }) => {

    try{

      const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (
      !Number.isFinite(start.getTime()) ||
      !Number.isFinite(end.getTime()) ||
      end <= start
    ) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "Invalid event times. End time must be after start time.",
          },
        ],
      };
    }

    const response = await calendar.events.list({
      calendarId:'primary',
      timeMin: startDateTime,
      timeMax:endDateTime,
      timeZone,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 50,
    });

    const events = response.data.items??[];

    // let eventsSummary = '';


    // events.map((event)=>{
    //   eventsSummary += event.summary + "    " + event.id + '\n';
    // })

    return {
      content:[
        {
          type:'text',
          text:`You have in total ${events.length} events with the following details.` + JSON.stringify({
            ...events
          })
        }
      ]
    }

    }catch(err){

      console.log("Error getting events: ",err.message);

      return {
        isError:true,
        content:[
          {
            type:'text',
            text:`Error getting the events with error message: ${err.message}`
          }
        ]
      }

    }

  }
)

//Create a calendar event
server.registerTool(
    'Create_Calendar_event',
    {
        title: "Create Google Calendar Event",
        description:
      "Create an event on the user's primary Google Calendar. " +
      "Requires a title, start time, and end time. " +
      "Use ISO 8601 timestamps with an explicit timezone offset. " +
      "Do not invent dates or times the user has not specified.",

      inputSchema: {
        summary: z.string().min(1).max(200),
  
        startDateTime: z.string().datetime({
          offset: true,
        }),
  
        endDateTime: z.string().datetime({
          offset: true,
        }),
  
        timeZone: z.string().default("Asia/Karachi"),
  
        description: z.string().max(2000).optional(),
  
        location: z.string().max(500).optional(),
        }
    },
    async ({
        summary,
        startDateTime,
        endDateTime,
        timeZone,
        description,
        location,
      }) => {
        try {
          const start = new Date(startDateTime);
          const end = new Date(endDateTime);
    
          if (
            !Number.isFinite(start.getTime()) ||
            !Number.isFinite(end.getTime()) ||
            end <= start
          ) {
            return {
              isError: true,
              content: [
                {
                  type: "text",
                  text: "Invalid event times. End time must be after start time.",
                },
              ],
            };
          }
    
          const response = await calendar.events.insert({
            calendarId: "primary",
    
            requestBody: {
              summary,
              description,
              location,
    
              start: {
                dateTime: startDateTime,
                timeZone,
              },
    
              end: {
                dateTime: endDateTime,
                timeZone,
              },
            },
          });
    
          const event = response.data;

          // await eventModel.create({
          //   id: event.id,
          //   title: event.summary,
          //   start: event.start.dateTime,
          //   end: event.end.dateTime,
          //   htmlLink: event.htmlLink,
          //   timeZone:event.start.timeZone
          // }).then(()=>{
          //   console.log('Event created successfully');
          // })

    
          return {
            content: [
              {
                type: "text",
    
                text: JSON.stringify(
                  {
                    success: true,
                    message: "Google Calendar event created successfully.",
                    event: {
                      id: event.id,
                      title: event.summary,
                      start: event.start,
                      end: event.end,
                      htmlLink: event.htmlLink,
                    },
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          console.error("Google Calendar error:", error.message);
    
          return {
            isError: true,
            content: [
              {
                type: "text",
                text:
                  "Could not create the Google Calendar event. " +
                  "Check your OAuth permissions, token, and event data.",
              },
            ],
          };
        }
      }
)

//Update an existing calendar event
server.registerTool(
  "Update_Event",
  {
    description:'To update an existing event',
    inputSchema:{
      eventId: z.string(),

      start: z.string().datetime({
        offset: true,
      }),

      end: z.string().datetime({
        offset: true,
      }),

      location: z.string().max(100).optional(),

      summary: z.string().max(100),

      description: z.string().max(200).optional()
    }
  },

  async (args)=>{

    if(!eventId){
      return {
        content:[
          {
            type:'text',
            text:'ID required to update an event'
          }
        ]
      }
    }

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    const updatedEvent = await calendar.events.patch({
      calendarId:'primary',
      eventId,
      requestBody: {
        summary,
        description,
        location,

        start: {
          dateTime: startDateTime,
          timeZone: 'Asia/Karachi',
        },

        end: {
          dateTime: endDateTime,
          timeZone: 'Asia/Karachi',
        },
      },
      sendUpdates:'all'
    })

    return {
      content:[
        {
          type:'text',
          text: JSON.stringify({...updatedEvent})
        }
      ]
    }

  }

)

//Check database for specific event
// server.registerTool(
//   "Get_Event_Details",
//   {
//     description:`To check a specific event details from database.
//     Exact title of the specific event must be given to fetch it and title can be found from google calendar using the tool Get_All_Events.`,
//     inputSchema:{
//       title: z.string()
//     }
//   },
//   async ({ title }) => {
//     try {
//       const filter = {};

//       if (title) {
//         filter.title = {
//           $regex: title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
//           $options: "i",
//         };
//       }

//       const tasks = await eventModel.find(filter)
//         .select("title description status")
//         .limit(10)
//         .lean();

//       return {
//         content: [
//           {
//             type: "text",
//             text: JSON.stringify(tasks, null, 2),
//           },
//         ],
//       };
//     } catch (error) {
//       console.error("MongoDB search error:", error.message);

//       return {
//         isError: true,
//         content: [
//           {
//             type: "text",
//             text: "Unable to retrieve tasks from MongoDB.",
//           },
//         ],
//       };
//     }
//   }
// )

//Delete a specific event
server.registerTool(
  "Delete_Calendar_Event",
  {
    description:'Delete an existing event from calendar',
    inputSchema:{
      id:z.string()
    }
  },

  async ({id})=>{

    if(!id){
      return {
        isError:true,
        content:[
        {
          type:'text',
          text:'No ID provided'
        }
        ]
      }
    }

    try{

      const deleteEvent = await calendar.events.delete({
        eventId:id,
        calendarId:'primary'
      })
      // .then(async ()=>{
      //   await eventModel.findOneAndDelete({id}) ;
      //   console.log('Event deleted successfully');
      // })
  
      return {
        content:[
          {
            type:'text',
            text:`Event deleted successfully!`
          }
        ]
      }

    }catch(error){

      return {
        isError:true,
        content:[
          {
            type:'text',
            text:`Error deleting the event: ${error.message}`
          }
        ]
      }

    }

  }
)


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



app.listen(3000,()=>{
    console.log('Server running on port 3000')
})