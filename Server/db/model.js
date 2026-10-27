import mongoose from 'mongoose';


const eventSchema = new mongoose.Schema({
    id:{
        type:String,
        required:true,
        unique:true
    },
    title:{
        type:String,
        required:true
    },
    start:{
        type:String,
        required:true
    },
    end:{
        type:String,
        required:true
    },
    htmlLink:{
        type:String,
        required:true
    },
    timeZone:{
        type:String,
        default:'Asia/Karachi'
    }
},{
    timestamps:true
})


const eventModel = mongoose.model('event',eventSchema);

export default eventModel;