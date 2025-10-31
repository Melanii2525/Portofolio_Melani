import mongoose from "mongoose";

const FeedbackSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  pesan: { type: String, required: true },
  foto: { type: String, default: "" },
}, { timestamps: true });

const Feedback = mongoose.model("Feedback", FeedbackSchema);
export default Feedback;