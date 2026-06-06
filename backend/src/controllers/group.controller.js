import cloudinary from "../lib/cloudinary.js";
import Group from "../models/Group.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

// ================= CREATE GROUP =================
export const createGroup = async (req, res) => {
  try {
    const { name, description, members, avatar } = req.body;
    const adminId = req.user._id;

    if (!name) {
      return res.status(400).json({ message: "Group name is required." });
    }

    // Upload avatar to Cloudinary if present
    let avatarUrl = "";
    if (avatar) {
      const uploadResponse = await cloudinary.uploader.upload(avatar);
      avatarUrl = uploadResponse.secure_url;
    }

    // Parse members (ensure admin is also included)
    let parsedMembers = [];
    if (Array.isArray(members)) {
      parsedMembers = members.map((id) => ({
        userId: id,
        role: "member",
      }));
    }
    
    // Add admin
    parsedMembers.push({
      userId: adminId,
      role: "admin",
    });

    // Remove duplicates
    const uniqueMembersMap = {};
    parsedMembers.forEach((m) => {
      uniqueMembersMap[m.userId.toString()] = m;
    });
    const finalMembers = Object.values(uniqueMembersMap);

    const group = await Group.create({
      name,
      description: description || "",
      avatar: avatarUrl,
      members: finalMembers,
    });

    // Populate members details
    const populatedGroup = await Group.findById(group._id).populate("members.userId", "-password");

    // Make online member sockets join the group room and emit newGroup
    finalMembers.forEach((m) => {
      const socketId = getReceiverSocketId(m.userId);
      if (socketId) {
        const memberSocket = io.sockets.sockets.get(socketId);
        if (memberSocket) {
          memberSocket.join(`group_${group._id}`);
        }
        io.to(socketId).emit("newGroup", populatedGroup);
      }
    });

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error("Error in createGroup:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET GROUPS =================
export const getGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({
      "members.userId": userId,
    }).populate("members.userId", "-password");

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error in getGroups:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET GROUP MESSAGES =================
export const getGroupMessages = async (req, res) => {
  try {
    const { id: groupId } = req.params;

    const messages = await Message.find({ groupId })
      .populate("senderId", "-password")
      .populate("replyTo")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getGroupMessages:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= SEND GROUP MESSAGE =================
export const sendGroupMessage = async (req, res) => {
  try {
    const { text, image, audio, replyTo } = req.body;
    const { id: groupId } = req.params;
    const senderId = req.user._id;

    if (!text && !image && !audio) {
      return res.status(400).json({ message: "Text, image, or audio is required." });
    }

    const groupExists = await Group.exists({ _id: groupId });
    if (!groupExists) {
      return res.status(404).json({ message: "Group not found." });
    }

    // Image Upload
    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    // Audio Upload
    let audioUrl;
    if (audio) {
      const uploadResponse = await cloudinary.uploader.upload(audio, {
        resource_type: "auto",
      });
      audioUrl = uploadResponse.secure_url;
    }

    let newMessage = await Message.create({
      senderId,
      groupId,
      text,
      image: imageUrl,
      audio: audioUrl,
      status: "sent",
      replyTo: replyTo || undefined,
    });

    newMessage = await Message.findById(newMessage._id)
      .populate("senderId", "fullName profilePic")
      .populate("replyTo");

    // Realtime broadcast to group socket room
    io.to(`group_${groupId}`).emit("newMessage", newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendGroupMessage controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
