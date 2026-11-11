import mongoose from "mongoose";


const chatSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    messages:[{
        role:{
            type:String,
            required:true
        },
        message:{
            type:String,
            required:true
        }
    }],
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true
    }
})


const chatModel = mongoose.model('chat',chatSchema);


export default chatModel;