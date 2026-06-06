import SecretChat from "../models/SecretChat.js";
import Message from "../models/Message.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// ================= INITIATE SECRET CHAT =================
export const initiateSecretChat = async (req, res) => {
  try {
    const { receiverId, publicKey } = req.body;
    const initiatorId = req.user._id;

    if (!receiverId || !publicKey) {
      return res.status(400).json({ message: "Receiver ID and Public Key are required." });
    }

    // Try finding existing session
    let session = await SecretChat.findOne({
      $or: [
        { initiatorId, receiverId },
        { initiatorId: receiverId, receiverId: initiatorId }
      ]
    });

    if (session) {
      // Overwrite/reset existing session
      session.initiatorId = initiatorId;
      session.receiverId = receiverId;
      session.initiatorPublicKey = publicKey;
      session.receiverPublicKey = "";
      session.status = "pending";
      await session.save();
    } else {
      session = await SecretChat.create({
        initiatorId,
        receiverId,
        initiatorPublicKey: publicKey,
        status: "pending"
      });
    }

    // Notify receiver
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("secretChatRequest", {
        sessionId: session._id,
        initiatorId,
        publicKey,
      });
    }

    res.status(200).json(session);
  } catch (error) {
    console.error("Error in initiateSecretChat:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= ACCEPT SECRET CHAT =================
export const acceptSecretChat = async (req, res) => {
  try {
    const { sessionId, publicKey } = req.body;
    const receiverId = req.user._id;

    if (!sessionId || !publicKey) {
      return res.status(400).json({ message: "Session ID and Public Key are required." });
    }

    const session = await SecretChat.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Secret session not found" });
    }

    session.receiverPublicKey = publicKey;
    session.status = "active";
    await session.save();

    // Notify initiator
    const initiatorSocketId = getReceiverSocketId(session.initiatorId);
    if (initiatorSocketId) {
      io.to(initiatorSocketId).emit("secretChatAccepted", {
        sessionId: session._id,
        receiverPublicKey: publicKey,
      });
    }

    res.status(200).json(session);
  } catch (error) {
    console.error("Error in acceptSecretChat:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= CLOSE SECRET CHAT =================
export const closeSecretChat = async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user._id;

    const session = await SecretChat.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    session.status = "closed";
    await session.save();

    // Wipe all E2E encrypted messages between the users from DB
    await Message.deleteMany({
      isSecret: true,
      $or: [
        { senderId: session.initiatorId, receiverId: session.receiverId },
        { senderId: session.receiverId, receiverId: session.initiatorId }
      ]
    });

    // Notify partner
    const partnerId = session.initiatorId.toString() === userId.toString() ? session.receiverId : session.initiatorId;
    const partnerSocketId = getReceiverSocketId(partnerId);
    if (partnerSocketId) {
      io.to(partnerSocketId).emit("secretChatClosed", { sessionId });
    }

    res.status(200).json({ message: "Secret chat closed and messages wiped." });
  } catch (error) {
    console.error("Error in closeSecretChat:", error);
    res.status(500).json({ message: "Server error" });
  }
};
