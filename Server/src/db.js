import dns from "node:dns";
import mongoose from "mongoose";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

export default async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("connected to DB");
}
