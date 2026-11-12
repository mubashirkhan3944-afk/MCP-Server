import { calendar as googleCalendar } from 'googleapis/build/src/apis/calendar/index.js';
import { OAuth2Client } from 'google-auth-library';
import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import userModel from './models/user.js';

const userIdField = z.string().optional().describe(
  'Filled by the app from the logged-in user. Do not set this.'
);

async function getCalendar(userId) {
  if (!userId) {
    throw new Error('Missing user id. Start a chat while logged in, then try again.');
  }

  const user = await userModel.findById(userId);

  if (!user?.refreshToken && !user?.accessToken) {
    throw new Error('This account has no Google Calendar tokens. Connect Google first.');
  }

  const auth = new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  });

  auth.setCredentials({
    refresh_token: user.refreshToken,
    access_token: user.accessToken,
  });

  return googleCalendar({
    version: 'v3',
    auth,
  });
}

export const server = new McpServer({
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
      userId: userIdField,
    }
  },

  async ({
    startDateTime,
    endDateTime,
    timeZone,
    description,
    googleEventId,
    userId
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

    const calendar = await getCalendar(userId);

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
        userId: userIdField,
        }
    },
    async ({
        summary,
        startDateTime,
        endDateTime,
        timeZone,
        description,
        location,
        userId,
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

          const calendar = await getCalendar(userId);
    
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
                text: `Could not create the Google Calendar event: ${error.message}`,
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

      startDateTime: z.string().datetime({
        offset: true,
      }),

      endDateTime: z.string().datetime({
        offset: true,
      }),

      location: z.string().max(100).optional(),

      summary: z.string().max(100),

      description: z.string().max(200).optional(),
      userId: userIdField,
    }
  },

  async ({eventId,startDateTime,endDateTime,location,summary,description,userId})=>{

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

    const calendar = await getCalendar(userId);

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

    const event = updatedEvent.data;

    return {
      content:[
        {
          type:'text',
          text: JSON.stringify({
            id: event.id,
            title: event.summary,
            start: event.start,
            end: event.end,
            htmlLink: event.htmlLink,
          })
        }
      ]
    }

  }

)

//Delete a specific event
server.registerTool(
  "Delete_Calendar_Event",
  {
    description:'Delete an existing event from calendar',
    inputSchema:{
      id:z.string(),
      userId: userIdField,
    }
  },

  async ({id, userId})=>{

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

      const calendar = await getCalendar(userId);

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
