import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({}, { strict: false, collection: "sessions" });

export default mongoose.model("Session", sessionSchema);
