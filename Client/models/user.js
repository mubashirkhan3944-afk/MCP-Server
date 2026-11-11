import mongoose from 'mongoose'


const userSchema = new mongoose.Schema({
    name: {
        type:String,
        required:true,
        minlength:5
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        minlength:5
    },
    refreshToken:{
        type:String
    },
    accessToken:{
        type:String
    },
    idToken:{
        type:String
    },
    verified:{
        type:Boolean,
        default:false
    },
    authProvider:{
        type:String
    }
},{
    timestamps:true
})


const userModel = mongoose.model('user',userSchema);

export default userModel