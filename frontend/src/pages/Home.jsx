import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {ArrowUp, LogOut} from 'lucide-react'
import { useNavigate } from 'react-router-dom'



const Home = () => {
 

    const navigate = useNavigate();
    const [loading, setloading] = useState(false);
    const [messages, setmessages] = useState([])
    const [message, setmessage] = useState({
      role: 'user',
      message:''
    })
    const [chatButton, setchatButton] = useState(true)
    const [chatHistory, setchatHistory] = useState([])
    const [index, setindex] = useState()
    const [user, setuser] = useState({})
    const [error, seterror] = useState(null)
    const [verify, setverify] = useState(true)
  
  
  
    async function getChatHistory(id){

          
          await axios.get(`http://localhost:5000/api/get-chat/${id}`)
          .then((response)=>{
            setmessages(response.data.chat.messages);
          })
          .catch((error)=>{
            console.log(error.response.data.message)
            localStorage.clear();
          })


    }
  
    useEffect(()=>{
  
      async function getAllChatHistory(){
  
        const response  = await axios.get('http://localhost:5000/api/get-all-chats',{withCredentials:true});
  
        setchatHistory(response.data.chats);

        const chatId = localStorage.getItem('chatId');
        if(chatId){
          getChatHistory(chatId);
        }
  
        for(let i=0;i<response.data.chats.length;i++){
          if(response.data.chats[i]._id == chatId){
            setindex(response.data.chats.length - i - 1)
          }
        }
      }

      async function getMe(){
        await axios.get('http://localhost:5000/auth/get-me',{withCredentials:true})
        .then((response)=>{
          setuser(response.data.user)
          setverify(response.data.user.verified)
        })
        .catch((error)=>{
          console.log(error.response.data.message)
          navigate('/login')
        })
          
        }
  
      getMe();
      getAllChatHistory();
    },[]);

    async function NewChat(){
      const newchat = {
        title:'New Chat',
        messages:{
          role:'user',
          message:''
        }
      }
  
  
      setchatHistory([...chatHistory,newchat])
      setmessages([])
  
      localStorage.removeItem('chatId')
    }
  
    async function createChat(prompt){
  
      const response = await axios.post('http://localhost:5000/api/create',{prompt},{withCredentials:true});

      localStorage.setItem('chatId',response.data.chatId);
  
    }
  
    async function sendMessage(prompt){
  
  
      setloading(true);

      console.log(user)

      if(!user.verified){
        seterror('Your account is not verified with google.You must verify to use the features!');
        setloading(false);
        return;
      }

      if(!localStorage.getItem('chatId')){
        await createChat(prompt);
      }
      
      const chatId = localStorage.getItem('chatId');
  
      try{
  
        const response = await axios.post('http://localhost:5000/api/chat',{prompt,chatId},{withCredentials:true});
  
      setmessages((prev)=>[...prev,{role:'model',message:response.data.message}]);
  
      setloading(false);
  
  
      }catch(error){
        console.log(error.message);
        setloading(false);
      }
  
    }

    async function GoogleSubmit(){
      window.location.href =
          "http://localhost:5000/auth/google/connect";
    }
  
    async function SignOut(){
      await axios.get('http://localhost:5000/auth/logout',{withCredentials:true})
      .then((response)=>{
        localStorage.clear();
        console.log(response.data.message)
        navigate('/login')
      })
      .catch((error)=>{
        console.log(error.response.data.message)
      })
    }
  
    return (
      <div className='h-screen w-screen bg-[rgb(179,187,176)] text-white flex justify-around items-center main'>
      {error && <div className='absolute top-[25%] left-[35%] text-xl text-red-400'>{error}</div>}
        <div className='w-[20%] h-[90%] bg-[rgb(198,226,28)] rounded-4xl shadow-xl flex flex-col items-center pt-5'>
            <div className='h-[10%] w-[90%] bg-black rounded-xl flex justify-start items-center px-5 hover:text-gray-300 transition-all z-10' onClick={()=>{
              setchatButton(!chatButton)
            }}>Chat History</div>
            <div className='h-[80%] w-[90%]'>
            {chatButton &&
            <div className='h-full w-full rounded-xl bg-white/30 backdrop-blur-xl shadow-xl chat flex flex-col items-center justify-start overflow-scroll scrollbar-none p-2 gap-2'>
              {chatHistory.toReversed().map((chat,idx) => {
                return (
                  <div className={`text-start w-full hover:bg-black rounded-xl p-2 ${index==idx ? 'bg-black' : 'bg-black/80'}`} key={idx} onClick={()=>{
                    getChatHistory(chat?._id);
                    setindex(idx)
                  }}>Chat {chatHistory.length - idx}</div>
                )
              })}
            </div>}
            </div>
            <div className='w-full flex justify-between px-4 '>
              <button className='w-25 h-10 rounded-full bg-black mt-2 hover:bg-black/80 transition-all flex justify-center items-center ' title='New Chat' onClick={()=>{
                NewChat()
              }}>New Chat</button>
              <button className='bg-black w-10 h-10 mt-2 rounded-full flex justify-center items-center hover:bg-black/80 transition-all' title='Logout' onClick={()=>
                SignOut()
              }>
                <LogOut size={20}/>
              </button>
            </div>
        </div>
          <form className='h-[90%] w-[75%] flex flex-col justify-center items-center gap-[5%] bg-[rgb(239,239,237)] rounded-4xl p-5 shadow-xl' onSubmit={(e)=>{
            e.preventDefault();
            setmessages((prev)=> [...prev,message]);
            sendMessage(message.message);
            setmessage({message:''});
  
  
          }}>
          <div className='text-black font-medium flex justify-between items-center text-start w-full bg-black/10 backdrop-blur-md shadow-xl px-5 py-2 rounded-2xl'>
            <div className='flex flex-col'>
              <div className='text-6xl w-full'>DEVIN</div>
            <p>Your personal Event Manager</p>
            </div>
            {!verify &&
              <div className='bg-black p-4 text-white rounded-2xl hover:scale-98 hover:text-gray-400 transition-all' onClick={GoogleSubmit}>Verify your Account</div>
            }
          </div>
          <div className='h-[80%] w-full rounded-2xl p-5 flex flex-col-reverse gap-5 overflow-y-auto scrollbar-none'>
          {loading && <div className='bg-[rgb(10,10,10)] w-10 px-4 pb-2 flex items-center justify-center rounded-2xl'>
              <span className='dot1 text-3xl'>.</span>
              <span className='dot2 text-3xl'>.</span>
              <span className='dot3 text-3xl'>.</span>
            </div>}
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

export default Home