import dns from "node:dns";
import mongoose from "mongoose";

// Node's resolver (c-ares) fails SRV lookups against some local DNS servers
// with querySrv ECONNREFUSED, while Windows nslookup still works.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("connected to DB");
    } catch (error) {
        console.log('hello:',error.message);
    }
}

export default connectDB;