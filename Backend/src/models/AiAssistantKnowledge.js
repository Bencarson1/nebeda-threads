import mongoose from "mongoose";

const aiAssistantKnowledgeSchema = new mongoose.Schema(
  {
    section: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true },
);

const AiAssistantKnowledge = mongoose.model("AiAssistantKnowledge", aiAssistantKnowledgeSchema);

export default AiAssistantKnowledge;
