import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  month: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  images: [
    {
      filename: String,
      originalname: String,
      mimetype: String,
      size: Number
    }
  ],
  imageTitles: [String],
  imageDescriptions: [String], 
  createdAt: { type: Date, default: Date.now }
});

const Project = mongoose.model("Project", projectSchema);

export default Project;