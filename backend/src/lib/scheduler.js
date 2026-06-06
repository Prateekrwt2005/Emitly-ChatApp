import Message from "../models/Message.js";
import { getReceiverSocketId, io } from "./socket.js";

let schedulerInterval = null;

export const startScheduler = () => {
  if (schedulerInterval) return;

  console.log("Starting Emitly message dispatch scheduler...");

  schedulerInterval = setInterval(async () => {
    try {
      // Find all scheduled messages that are due
      const dueMessages = await Message.find({
        status: "scheduled",
        scheduledAt: { $lte: new Date() }
      });

      if (dueMessages.length === 0) return;

      console.log(`Scheduler: Dispatched ${dueMessages.length} due messages.`);

      for (const msg of dueMessages) {
        // Check if receiver is online
        const receiverSocketId = msg.receiverId ? getReceiverSocketId(msg.receiverId) : null;
        
        msg.status = receiverSocketId ? "delivered" : "sent";
        await msg.save();

        if (msg.groupId) {
          // Group Broadcast
          const populatedGroupMessage = await Message.findById(msg._id)
            .populate("senderId", "fullName profilePic")
            .populate("replyTo");

          io.to(`group_${msg.groupId}`).emit("newMessage", populatedGroupMessage);
        } else {
          // Direct Message Broadcast
          const populatedDirectMessage = await Message.findById(msg._id).populate("replyTo");

          // Send to receiver if online
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", populatedDirectMessage);
            
            // Send delivery receipt to sender if online
            const senderSocketId = getReceiverSocketId(msg.senderId);
            if (senderSocketId) {
              io.to(senderSocketId).emit("messageDelivered", { messageId: msg._id });
            }
          }

          // Send back to sender so it displays in their active window
          const senderSocketId = getReceiverSocketId(msg.senderId);
          if (senderSocketId) {
            io.to(senderSocketId).emit("newMessage", populatedDirectMessage);
          }
        }
      }
    } catch (error) {
      console.error("Error in message scheduler worker loop:", error);
    }
  }, 15000); // Run check every 15 seconds
};

export const stopScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("Emitly message dispatch scheduler stopped.");
  }
};
