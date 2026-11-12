import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { ArrowUp, LogOut, Plus, MessageSquare, Menu, X, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Home = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [activeChatId, setActiveChatId] = useState(localStorage.getItem('chatId'))
  const [user, setUser] = useState({})
  const [error, setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  useEffect(() => {
    async function init() {
      try {
        const meRes = await axios.get('http://localhost:5000/auth/get-me', { withCredentials: true })
        setUser(meRes.data.user)

        const chatsRes = await axios.get('http://localhost:5000/api/get-all-chats', { withCredentials: true })
        setChatHistory(chatsRes.data.chats || [])

        const chatId = localStorage.getItem('chatId')
        if (chatId) {
          const chatRes = await axios.get(`http://localhost:5000/api/get-chat/${chatId}`)
          setMessages(chatRes.data.chat.messages || [])
          setActiveChatId(chatId)
        }
      } catch (err) {
        navigate('/login')
      }
    }
    init()
  }, [])

  const createChat = async (prompt) => {
    const res = await axios.post('http://localhost:5000/api/create', { prompt }, { withCredentials: true })
    localStorage.setItem('chatId', res.data.chatId)
    setActiveChatId(res.data.chatId)
    return res.data.chatId
  }

  const sendMessage = async (prompt) => {
    if (!prompt.trim()) return
    setLoading(true)
    setError(null)

    if (!user.verified) {
      setError('Please verify your Google account to use Devin.')
      setLoading(false)
      return
    }

    const userMsg = { role: 'user', message: prompt }
    setMessages(prev => [...prev, userMsg])
    setInput('')

    try {
      let chatId = activeChatId
      if (!chatId) {
        chatId = await createChat(prompt)
      }

      const res = await axios.post(
        'http://localhost:5000/api/chat',
        { prompt, chatId },
        { withCredentials: true }
      )

      setMessages(prev => [...prev, { role: 'model', message: res.data.message }])
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setActiveChatId(null)
    localStorage.removeItem('chatId')
  }

  const loadChat = async (id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/get-chat/${id}`)
      setMessages(res.data.chat.messages || [])
      setActiveChatId(id)
      localStorage.setItem('chatId', id)
    } catch (err) {
      console.log(err)
    }
  }

  const handleLogout = async () => {
    await axios.get('http://localhost:5000/auth/logout', { withCredentials: true })
    localStorage.clear()
    navigate('/login')
  }

  const handleGoogleVerify = () => {
    window.location.href = 'http://localhost:5000/auth/google/connect'
  }

  return (
    <div className="h-screen w-screen flex bg-[#fafafa] text-[#111]">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-[280px]' : 'w-0'} transition-all duration-300 border-r border-[#e5e5e5] bg-white flex flex-col overflow-hidden`}>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-lg tracking-tight">
            <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
              <Sparkles size={15} className="text-white" />
            </div>
            Devin
          </div>
        </div>

        <div className="px-3 mb-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#e5e5e5] hover:bg-[#f5f5f5] text-sm font-medium"
          >
            <Plus size={16} />
            New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          {chatHistory.slice().reverse().map((chat) => (
            <button
              key={chat._id}
              onClick={() => loadChat(chat._id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center gap-2 truncate ${
                activeChatId === chat._id
                  ? 'bg-[#f0f0f0] font-medium'
                  : 'hover:bg-[#f5f5f5] text-[#444]'
              }`}
            >
              <MessageSquare size={15} className="opacity-60" />
              <span className="truncate">Chat</span>
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-[#e5e5e5]">
          <div className="flex items-center justify-between px-2">
            <div className="text-sm font-medium truncate">{user?.name || 'User'}</div>
            <button onClick={handleLogout} className="p-2 hover:bg-[#f0f0f0] rounded-lg">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Top bar */}
        <div className="h-14 border-b border-[#e5e5e5] bg-white flex items-center px-4 gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-[#f0f0f0] rounded-lg"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="text-sm font-medium text-[#666]">Your personal Event Manager</div>
          
          {!user?.verified && (
            <button
              onClick={handleGoogleVerify}
              className="ml-auto text-sm bg-black text-white px-4 py-1.5 rounded-full hover:bg-[#333]"
            >
              Verify Google Account
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-8">
          {messages.length === 0 && !loading ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mb-5">
                <Sparkles size={26} className="text-white" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight mb-2">What's on your mind?</h1>
              <p className="text-[#666] text-base max-w-md">
                Ask Devin to create, update, or manage your Google Calendar events.
              </p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl text-[15px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-black text-white rounded-br-md'
                        : 'bg-white border border-[#e5e5e5] text-[#111] rounded-bl-md shadow-sm'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#e5e5e5] px-4 py-3 rounded-2xl rounded-bl-md shadow-sm flex gap-1">
                    <span className="w-1.5 h-1.5 bg-[#999] rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-[#999] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-1.5 h-1.5 bg-[#999] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-50 text-red-600 text-sm px-4 py-2 rounded-full border border-red-100">
            {error}
          </div>
        )}

        {/* Input */}
        <div className="p-4 bg-[#fafafa]">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage(input)
            }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative flex items-center bg-white border border-[#e5e5e5] rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message Devin..."
                className="w-full bg-transparent px-5 py-4 outline-none text-[15px] placeholder:text-[#999]"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="mr-2 w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center disabled:opacity-30 hover:bg-[#222]"
              >
                <ArrowUp size={18} />
              </button>
            </div>
            <p className="text-center text-xs text-[#999] mt-3">
              Devin can make mistakes. Check important info.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Home
