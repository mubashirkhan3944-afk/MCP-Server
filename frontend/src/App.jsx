import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {ArrowUp} from 'lucide-react'



function App() {


  const [loading, setloading] = useState(false);
  const [messages, setmessages] = useState([])
  const [message, setmessage] = useState({
    role: 'user',
    message:''
  })
  const [chatButton, setchatButton] = useState(false)
  const [chat, setchat] = useState({
    title:'',
    messages
  })
  const [chatHistory, setchatHistory] = useState([chat,chat])

  async function getChatHistory(id){

    try{
      const response = await axios.get(`http://localhost:3001/get-chat/${id}`) 

    setmessages(response.data.chat.messages);

    localStorage.setItem('chatId',id);

    }catch(error){

      console.log(error.message);

    }

  }

  useEffect(()=>{

    async function getAllChatHistory(){

      const chatId = localStorage.getItem('chatId');
      if(chatId){
        getChatHistory(chatId);
      }

      const response  = await axios.get('http://localhost:3001/get-all-chats',{withCredentials:true});

      setchatHistory(response.data.chats);
    }

    getAllChatHistory();
  },[]);

  async function createChat(prompt){

    const response = await axios.post('http://localhost:3001/create',{prompt},{withCredentials:true});

    localStorage.setItem('chatId',response.data.chatId);

  }

  async function sendMessage(prompt){


    setloading(true);

    
    if(!localStorage.getItem('chatId')){
      await createChat(prompt);
    }
    
    const chatId = localStorage.getItem('chatId');

    try{

      const response = await axios.post('http://localhost:3001/chat',{prompt,chatId},{withCredentials:true});

    setmessages((prev)=>[...prev,{role:'model',message:response.data.message}]);

    setloading(false);


    }catch(error){
      console.log(error.message);
      setloading(false);
    }

  }


  return (
    <div className='h-screen w-screen bg-[rgb(179,187,176)] text-white flex justify-around items-center main'>
      <div className='w-[20%] h-[90%] bg-[rgb(198,226,28)] rounded-4xl shadow-xl flex flex-col items-center pt-5'>
          <div className='h-[10%] w-[90%] bg-black rounded-xl flex justify-start items-center px-5 hover:text-gray-300 transition-all z-10' onClick={()=>{
            setchatButton(!chatButton)
          }}>Chat History</div>
          {chatButton ? 
          <div className='h-[80%] w-[90%] rounded-xl bg-white/30 backdrop-blur-xl shadow-xl chat flex flex-col items-center justify-start overflow-scroll scrollbar-none p-2 gap-2'>
            {chatHistory.map((chat,idx) => {
              return (
                <div className={`text-start w-full bg-black/80 hover:bg-black rounded-xl p-2 `} key={idx} onClick={()=>{
                  getChatHistory(chat._id);
                }}>Chat {idx + 1}</div>
              )
            })}
          </div> : 
          <div></div>}
      </div>
        <form className='h-[90%] w-[75%] flex flex-col justify-center items-center gap-[5%] bg-[rgb(239,239,237)] rounded-4xl p-5 shadow-xl' onSubmit={(e)=>{
          e.preventDefault();
          setmessages((prev)=> [...prev,message]);
          sendMessage(message.message);
          setmessage({message:''});


        }}>
        <div className='text-black font-medium text-start flex flex-col w-full bg-black/10 backdrop-blur-md shadow-xl px-5 py-2 rounded-2xl'>
          <div className='text-6xl w-full'>DEVIN</div>
          <p>Your personal Event Manager</p>
        </div>
        <div className='h-[80%] w-full rounded-2xl p-5 flex flex-col-reverse gap-5 overflow-y-auto scrollbar-none'>
        {loading ? <div className='bg-[rgb(10,10,10)] w-10 px-4 pb-2 flex items-center justify-center rounded-2xl'>
            <span className='dot1 text-3xl'>.</span>
            <span className='dot2 text-3xl'>.</span>
            <span className='dot3 text-3xl'>.</span>
          </div> : 
          <div></div>}
          {messages.length != 0 || loading  ? 
          <div>
            {messages.map((message,idx)=>{
              return (
                <div key={idx} className='flex w-full h-auto mt-2'>
                  {message.role == 'user' ? <div key={idx} className='ml-auto bg-white px-4 py-2 rounded-2xl w-auto text-[rgb(62,62,62)]'>{message.message}</div> : <div key={idx} className='bg-[rgb(11,11,11)] text-[rgb(226,226,226)] px-4 py-2 rounded-2xl'>{message.message}</div>}
                </div>
              )
          })}
          </div> : 
          <div className='w-full flex justify-center h-full'>
            <div className='text-black text-5xl w-[60%] text-center idea'>Whats on your mind today?</div></div>}
        </div>
        <div className='h-[10%] w-full flex justify-between items-center gap-2'>
          <input type="text" value={message.message} className='outline-none w-full text-black px-4 bg-white rounded-2xl overflow-hidden h-full' placeholder={messages.length == 0 ? 'Whats on your mind today?' : ' '} onChange={(e)=>{
            setmessage({role:'user',message:e.target.value})
          }}/>
          {loading ? <div className='orb'></div> : <div className='text-3xl rounded-full bg-[rgb(198,226,28)] h-10 w-10 text-black flex justify-center items-center arrow' onClick={(e)=>{
            if(message.message.length != 0){
              setmessages((prev)=> [...prev,message]);
              sendMessage(message.message);
              setmessage({message:''});

            }
          }}><ArrowUp/></div>}
        </div>
        </form>
    </div>
  )
}

export default App