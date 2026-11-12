import userModel from '../models/user.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
export async function registerUser(req,res){
    const {name,email,password} = req.body;

    if(!name || !email || !password){
        return res.status(401).json({
            message:'Incomplete credentials'
    })
    }

    const alreadyuser = await userModel.findOne({email});

    if(alreadyuser){
        return res.status(409).json({
            message:'User already exists with this email!'
        })
    }

    try{
        const hash = await bcrypt.hash(password,10);

    const user = await userModel.create({name,email,password:hash})

    const token = jwt.sign({
        id:user._id
    },process.env.JWT_SECRET);


    res.cookie('Token',token)

    return res.status(201).json({
        message:'User created successfully!',
        user
    })
    }catch(error){
        return res.status(500).json({
            message: error.message
        })
    }


}


export async function loginUser(req,res) {
    const {email,password} = req.body;

    if(!email || !password){
        return res.status(409).json({
            message:'Incomplete credentials!'
        })
    }

    const user = await userModel.findOne({email});

    if(!user){
        return res.status(404).json({
            message:'User not found!'
        })
    }

    if(!user.password){
        return res.status(401).json({
            message:'Your account is created with google authentication.You must continue with Google!'
        })
    }

    const corrPassword = await bcrypt.compare(password,user.password);

    if(!corrPassword){
        return res.status(409).json({
            message:'Invalid credentials'
        })
    }

    const token = jwt.sign({
        id:user._id
    },process.env.JWT_SECRET)

    res.cookie('Token',token)

    return res.status(200).json({
        message:'User logged in successfully!'
    })

}


export async function logoutUser(req,res) {
    const token = req.cookies.Token || req.headers.authorization?.split(' ')[1]

    if(!token){
        return res.status(200).json({
            message:'User already logged out!'
        })
    }

    res.clearCookie('Token');

    return res.status(200).json({
        message:'User logged out successfully'
    })
}

export async function getMe(req,res){
    const user = req.user;


    return res.status(200).json({
        message:'access granted',
        user
    })
}



