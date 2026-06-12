import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";
import Message from "../models/Message.js";
import Group from "../models/Group.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed = [ENV.CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173"].includes(origin) || 
                        origin.endsWith(".vercel.app");
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  },
});

io.use(socketAuthMiddleware);

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

const userSocketMap = {};

io.on("connection", (socket) => {
  console.log("A user connected", socket.user.fullName);

  const userId = socket.userId;
  userSocketMap[userId] = socket.id;

  // Join group rooms
  Group.find({ "members.userId": userId }).then((myGroups) => {
    myGroups.forEach((g) => {
      socket.join(`group_${g._id}`);
      console.log(`User ${socket.user.fullName} joined room group_${g._id}`);
    });
  }).catch((err) => {
    console.log("Error joining group rooms on connection:", err);
  });

  socket.on("joinGroupRoom", ({ groupId }) => {
    socket.join(`group_${groupId}`);
    console.log(`User ${socket.user.fullName} manually joined room group_${groupId}`);
  });

  // ================= TYPING =================
  socket.on("typing", ({ receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", { senderId: userId });
    }
  });

  socket.on("stopTyping", ({ receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stopTyping", { senderId: userId });
    }
  });

  // ================= DELIVERED =================
  socket.on("messageDelivered", ({ messageId, senderId }) => {
    const senderSocketId = userSocketMap[senderId];
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageDelivered", { messageId });
    }
  });

  // ================= SEEN =================
  socket.on("messageSeen", async ({ messageId, senderId }) => {
    try {
      await Message.findByIdAndUpdate(messageId, {
        status: "seen",
      });

      const senderSocketId = userSocketMap[senderId];
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageSeenUpdate", { messageId });
      }
    } catch (error) {
      console.log("Error updating seen:", error);
    }
  });

  // ================= VIEWED (DISAPPEARING MESSAGE) =================
  socket.on("messageViewed", async ({ messageId, senderId }) => {
    try {
      const msg = await Message.findByIdAndUpdate(messageId, {
        isViewed: true,
        text: "",
        image: "",
        audio: "",
      }, { new: true });

      if (msg) {
        const senderSocketId = userSocketMap[senderId];
        if (senderSocketId) {
          io.to(senderSocketId).emit("messageViewedUpdate", { messageId });
        }
        const receiverSocketId = userSocketMap[msg.receiverId];
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("messageViewedUpdate", { messageId });
        }
      }
    } catch (error) {
      console.log("Error updating messageViewed:", error);
    }
  });

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.user.fullName);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };