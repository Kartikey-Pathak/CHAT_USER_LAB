import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true }
  },
  { _id: false }
);

const ConversationSchema = new mongoose.Schema(
  {
    ownerId: { type: String, required: true, index: true },
    title: { type: String, default: "Untitled" },
    messages: { type: [MessageSchema], default: [] },
    // Track consecutive "show all users" attempts for the hallucination/leak feature
    leakAttemptCount: { type: Number, default: 0 },
    leaked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Conversation || mongoose.model("Conversation", ConversationSchema);
