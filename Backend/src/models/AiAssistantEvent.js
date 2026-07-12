import mongoose from "mongoose";

const aiAssistantEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      enum: [
        "opened",
        "message_sent",
        "suggestion_clicked",
        "product_recommendation",
        "no_answer",
        "whatsapp_escalation",
        "bespoke_started",
        "conversation_completed",
      ],
      required: true,
      index: true,
    },
    topic: {
      type: String,
      trim: true,
      maxlength: 80,
      index: true,
    },
    questionText: {
      type: String,
      trim: true,
      maxlength: 180,
    },
    productName: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    colour: {
      type: String,
      trim: true,
      maxlength: 60,
      index: true,
    },
    occasion: {
      type: String,
      trim: true,
      maxlength: 80,
      index: true,
    },
    budget: {
      type: String,
      trim: true,
      maxlength: 80,
      index: true,
    },
    source: {
      type: String,
      trim: true,
      maxlength: 80,
    },
  },
  { timestamps: true },
);

aiAssistantEventSchema.index({ createdAt: -1 });

const AiAssistantEvent = mongoose.model("AiAssistantEvent", aiAssistantEventSchema);

export default AiAssistantEvent;
