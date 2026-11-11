import express from 'express'
import {registerUser,loginUser,logoutUser,getMe} from '../controllers/authcontroller.js'
import {checkLogin} from '../middleware/authmiddleware.js'
const router = express.Router();



router.post('/register',registerUser)
router.post('/login',loginUser)
router.get('/logout',logoutUser)
router.get('/get-me',checkLogin,getMe)




export default router