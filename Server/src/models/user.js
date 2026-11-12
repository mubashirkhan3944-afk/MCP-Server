import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  refreshToken: String,
  accessToken: String,
});

export default mongoose.models.user || mongoose.model("user", userSchema);
