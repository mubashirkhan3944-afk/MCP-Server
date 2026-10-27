import mongoose from 'mongoose';



async function connectDB() {
    await mongoose.connect(process.env.MONGO_URI)
        .then(()=>{
            console.log('Connected to DB')
        })
        .catch((err)=>{
            console.log('Error connectong to DB ',err.message)
        })
}

export default connectDB;