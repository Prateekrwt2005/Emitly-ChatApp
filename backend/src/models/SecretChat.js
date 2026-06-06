import mongoose from "mongoose";

const secretChatSchema = new mongoose.Schema(
  {
    initiatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    initiatorPublicKey: {
      type: String,
      required: true,
    },
    receiverPublicKey: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "active", "closed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Prevent duplicate sessions between the same two users
secretChatSchema.index({ initiatorId: 1, receiverId: 1 }, { unique: true });

const SecretChat = mongoose.models.SecretChat || mongoose.model("SecretChat", secretChatSchema);
export default SecretChat;
