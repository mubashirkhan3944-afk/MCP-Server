import express  from 'express'
import {chatLoop,getChatHistory,getAllChats,createChat} from '../controllers/chatcontroller.js'
import {checkLogin} from '../middleware/authmiddleware.js'

const router = express.Router();



router.post('/chat',chatLoop)
router.get('/get-chat/:id',getChatHistory)
router.get('/get-all-chats',checkLogin,getAllChats)
router.post('/create',checkLogin,createChat)





export default router