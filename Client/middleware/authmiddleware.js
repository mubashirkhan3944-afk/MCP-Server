import jwt from 'jsonwebtoken'
import userModel from '../models/user.js'


export async function checkLogin(req,res,next){
    const token = req.cookies.Token || req.headers.authorization?.split(' ')[1]

    if(!token){
        return res.status(409).json({
            message:'Login first'
        })
    }

    try{

        const decoded = jwt.verify(token,process.env.JWT_SECRET)

        if(!decoded){
            return res.status(404).json({
                message:'invalid token'
            })
        }

        const user = await userModel.findById(decoded.id);

        if(!user){
            return res.status(404).json({
                message:'User not found with this token'
            })
        }

        req.user = user
        next();
    
    }catch(error){
        return res.status(409).json({
            message:'Invalid Token'
        })
    }
}