import { Eye, EyeClosed, GeorgianLariIcon } from 'lucide-react'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const Login = () => {

    const navigate = useNavigate()
    const [showpassword, setshowpassword] = useState(false)
    const [email, setemail] = useState('')
    const [password, setpassword] = useState('')
    const [error, seterror] = useState(null)

    async function SubmitForm(e){
      e.preventDefault();

      await axios.post('http://localhost:5000/auth/login',{email,password},{withCredentials:true})
      .then((response)=>{
        console.log(response.data.message);
        navigate('/')
      }).catch((error)=>{
        console.log(error.response.data.message)
        seterror(error.response.data.message)
      })
    }

    async function GoogleForm(){
        window.location.href =
          "http://localhost:5000/auth/google/connect";
    }

  return (
    <div className='h-screen w-screen flex justify-center items-center'>
      {error && <div className='absolute top-[5%] text-xl text-red-400 heading'>{error}</div>}
      <form className='h-[80%] w-[50%] rounded-4xl bg-[rgb(198,226,28)] flex flex-col justify-between p-5 items-center gap-2'
      onSubmit={SubmitForm}>
        <h1 className='text-5xl text-center pt-5 heading'>Welcome Back! </h1>
        <div className='w-full gap-5 flex flex-col items-center'>
          <div className='w-full flex justify-center'>
          <input type="email" value={email} title='email' className='bg-black h-10 w-[60%] rounded-4xl text-white p-4 outline-none'
          onChange={(e)=>{
            setemail(e.target.value)
          }} placeholder='Email'/>
          </div>
            <div className='flex bg-black h-10 w-[60%] rounded-4xl text-white'>
            <input type={showpassword ? 'text' : 'password'} value={password} title='password' className='w-[90%] h-full rounded-4xl p-4 outline-none'
            onChange={(e)=>{
              setpassword(e.target.value)
            }} placeholder='Password'/>
            <div className='flex justify-center items-center'>
            {showpassword ? 
            <Eye onClick={()=>{
              setshowpassword(!showpassword)
            }}/> : 
            <EyeClosed onClick={()=>{
              setshowpassword(!showpassword)
            }}/>}
            </div>
            </div>
            <div className='w-[42%] h-10 flex justify-center items-center bg-black rounded-4xl hover:bg-white/50 backdrop-blur-2xl'>
            <div title='Continue with google' className=' w-full text-white font-mono p-4 font-bold outline-none flex justify-center items-center google' onClick={GoogleForm}>
              Continue with Google
              </div>
            </div>
          </div>

      <div className='flex flex-col items-center justify-center'>
      <button className='text-2xl h-10 w-40 bg-black text-white px-5 py-2 rounded-4xl flex items-center justify-center hover:bg-black/80 transition-all'>Login</button>
      <div>New here!<button className='text-blue-800 hover:text-blue-500' onClick={()=>{navigate('/register')}}>Register</button>
      </div>
      </div>
      </form>
    </div>
  )
}

export default Login