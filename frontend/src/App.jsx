import React, { useState } from 'react'
import axios from 'axios'

function App() {


  const [loading, setloading] = useState(false);
  const [messages, setmessages] = useState([])
  const [message, setmessage] = useState({
    role: 'user',
    message:''
  })


  async function sendMessage(prompt){

    setloading(true);

    const response = await axios.post('http://localhost:3001/chat',{prompt},{withCredentials:true});

    console.log(response)

    setmessages((prev)=>[...prev,{role:'model',message:response.data.message}]);

    setloading(false);

  }



  return (
    <div className='h-screen w-screen bg-black/90 text-white flex justify-center items-center'>
        <form className='h-screen w-[80%] flex flex-col justify-center items-center gap-[5%]' onSubmit={(e)=>{
          e.preventDefault();
          setmessages((prev)=> [...prev,message]);
          sendMessage(message.message);
          setmessage({message:''});


        }}>
        <div className='h-[80%] w-[80%] bg-gray-500 rounded-2xl p-5 flex flex-col gap-5 scroll-auto overflow-auto'>
          {messages.map((message,idx)=>{
              return (
                <div key={idx} className='flex w-full h-auto'>
                  {message.role == 'user' ? <div key={idx} className='ml-auto bg-gray-700 px-4 py-2 rounded-2xl'>{message.message}</div> : <div key={idx} className='bg-gray-700 px-4 py-2 rounded-2xl'>{message.message}</div>}
                </div>
              )
          })}
          {loading ? <div className='bg-gray-700 w-10 px-4 py-2 flex items-center justify-center rounded-2xl'>
            <span className='dot1'>.</span>
            <span className='dot2'>.</span>
            <span className='dot3'>.</span>
          </div> : 
          <div></div>}
        </div>
        <div className='h-[10%] w-[80%] bg-gray-500 rounded-2xl flex justify-between px-4 items-center overflow-hidden gap-2'>
          <input type="text" value={message.message} className='outline-none w-full' onChange={(e)=>{
            setmessage({role:'user',message:e.target.value})
          }}/>
          {loading ? <div className='orb'></div> : <div className='text-3xl' onClick={(e)=>{
            if(message.message.length != 0){
              setmessages((prev)=> [...prev,message]);
              sendMessage(message.message);
              setmessage({message:''});

            }
          }}>{'>'}</div>}
        </div>
        </form>
    </div>
  )
}

export default App