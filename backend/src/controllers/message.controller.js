import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

// ================= GET ALL CONTACTS =================
export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const filteredUsers = await User.find({
      $and: [
        { _id: { $ne: loggedInUserId } },
        { blockedUsers: { $ne: loggedInUserId } } // Exclude users who blocked me, but keep users I blocked search-discoverable for unblocking
      ]
    }).select("-password");

    const contactsWithUnread = await Promise.all(
      filteredUsers.map(async (user) => {
        const unreadCount = await Message.countDocuments({
          senderId: user._id,
          receiverId: loggedInUserId,
          status: { $ne: "seen" },
        });
        return {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          profilePic: user.profilePic,
          unreadCount,
        };
      })
    );

    res.status(200).json(contactsWithUnread);
  } catch (error) {
    console.log("Error in getAllContacts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET MESSAGES =================
export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;

    // Mark all unseen messages from this user to me as seen in the DB
    await Message.updateMany(
      { senderId: userToChatId, receiverId: myId, status: { $ne: "seen" } },
      { $set: { status: "seen" } }
    );

    // Notify the sender that the chat has been read
    const senderSocketId = getReceiverSocketId(userToChatId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("chatSeen", { readerId: myId });
    }

    const messages = await Message.find({
      $and: [
        {
          $or: [
            { senderId: myId, receiverId: userToChatId },
            { senderId: userToChatId, receiverId: myId },
          ]
        },
        {
          $or: [
            { isViewOnce: { $ne: true } },
            { isViewOnce: true, isViewed: false }
          ]
        },
        {
          $or: [
            { status: { $ne: "scheduled" } },
            { status: "scheduled", senderId: myId }
          ]
        }
      ]
    })
      .populate("replyTo")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ================= SEND MESSAGE =================
export const sendMessage = async (req, res) => {
  try {
    const { text, image, audio, replyTo, isViewOnce, scheduledAt, isSecret } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !image && !audio) {
      return res.status(400).json({ message: "Text, image, or audio is required." });
    }

    if (senderId.equals(receiverId)) {
      return res.status(400).json({ message: "Cannot send messages to yourself." });
    }

    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    // ================= BLOCKING CHECKS =================
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (sender.blockedUsers && sender.blockedUsers.includes(receiverId)) {
      return res.status(400).json({ message: "You have blocked this user. Unblock them to send messages." });
    }

    if (receiver.blockedUsers && receiver.blockedUsers.includes(senderId)) {
      return res.status(400).json({ message: "You have been blocked by this user." });
    }

    // ================= IMAGE UPLOAD =================
    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    // ================= AUDIO UPLOAD =================
    let audioUrl;
    if (audio) {
      const uploadResponse = await cloudinary.uploader.upload(audio, {
        resource_type: "auto",
      });
      audioUrl = uploadResponse.secure_url;
    }

    // ================= STATUS =================
    const receiverSocketId = getReceiverSocketId(receiverId);

    let status = "sent";
    if (scheduledAt) {
      status = "scheduled";
    } else if (receiverSocketId) {
      status = "delivered";
    }

    let newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      audio: audioUrl,
      status,
      replyTo: replyTo || undefined,
      isViewOnce: !!isViewOnce,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      isSecret: !!isSecret,
    });

    if (replyTo) {
      newMessage = await newMessage.populate("replyTo");
    }

    // ================= REALTIME =================
    if (status !== "scheduled" && receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);

      const senderSocketId = getReceiverSocketId(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageDelivered", {
          messageId: newMessage._id,
        });
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ================= CHAT PARTNERS =================
export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
    });

    const chatPartnerIds = [
      ...new Set(
        messages.map((msg) =>
          msg.senderId.toString() === loggedInUserId.toString()
            ? msg.receiverId.toString()
            : msg.senderId.toString()
        )
      ),
    ];

    const chatPartners = await User.find({
      _id: { $in: chatPartnerIds },
    }).select("-password");

    const chatPartnersWithUnread = await Promise.all(
      chatPartners.map(async (partner) => {
        const unreadCount = await Message.countDocuments({
          senderId: partner._id,
          receiverId: loggedInUserId,
          status: { $ne: "seen" },
        });
        return {
          ...partner.toObject(),
          unreadCount,
        };
      })
    );

    res.status(200).json(chatPartnersWithUnread);
  } catch (error) {
    console.error("Error in getChatPartners:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ================= DELETE MESSAGE =================
export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Authorization check: only sender or receiver of the message
    if (message.senderId.toString() !== userId.toString() && message.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized to delete this message" });
    }

    await Message.findByIdAndDelete(messageId);

    // Notify receiver and sender via socket
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    const senderSocketId = getReceiverSocketId(message.senderId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", { messageId });
    }
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageDeleted", { messageId });
    }

    res.status(200).json({ message: "Message deleted successfully", messageId });
  } catch (error) {
    console.log("Error in deleteMessage controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ================= TOGGLE PIN MESSAGE =================
export const togglePinMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Authorization check: only sender or receiver can pin
    if (message.senderId.toString() !== userId.toString() && message.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized to pin this message" });
    }

    message.isPinned = !message.isPinned;
    await message.save();

    // Notify receiver and sender via socket
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    const senderSocketId = getReceiverSocketId(message.senderId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messagePinned", message);
    }
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagePinned", message);
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in togglePinMessage controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ================= BLOCK USER =================
export const blockUser = async (req, res) => {
  try {
    const { id: targetUserId } = req.params;
    const myId = req.user._id;

    if (myId.toString() === targetUserId.toString()) {
      return res.status(400).json({ message: "You cannot block yourself." });
    }

    const myUser = await User.findById(myId);
    if (!myUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const isBlocked = myUser.blockedUsers.includes(targetUserId);

    if (isBlocked) {
      // Unblock
      myUser.blockedUsers = myUser.blockedUsers.filter(id => id.toString() !== targetUserId.toString());
      await myUser.save();
      return res.status(200).json({ message: "User unblocked successfully", isBlocked: false });
    } else {
      // Block
      myUser.blockedUsers.push(targetUserId);
      await myUser.save();

      // Delete all messages between the two users
      await Message.deleteMany({
        $or: [
          { senderId: myId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: myId }
        ]
      });

      // Notify the target user via socket to clear messages on their screen if online
      const targetSocketId = getReceiverSocketId(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("userBlocked", { blockerId: myId });
      }

      return res.status(200).json({ message: "User blocked and conversation deleted", isBlocked: true });
    }
  } catch (error) {
    console.log("Error in blockUser controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ================= TOGGLE REACTION =================
export const toggleReaction = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({ message: "Emoji is required." });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user already reacted with this emoji
    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.userId.toString() === userId.toString() && r.emoji === emoji
    );

    if (existingReactionIndex > -1) {
      // Remove reaction
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Single reaction per user: remove any other reaction by this user first
      message.reactions = message.reactions.filter((r) => r.userId.toString() !== userId.toString());
      message.reactions.push({ userId, emoji });
    }

    await message.save();

    // Determine receiver socket target
    const receiverId = message.receiverId;
    const groupId = message.groupId;

    // Socket emission payload
    const payload = {
      messageId,
      reactions: message.reactions,
      triggerEmoji: emoji, // Send this to trigger canvas explosion!
      userId,
    };

    if (groupId) {
      io.to(`group_${groupId}`).emit("messageReaction", payload);
    } else {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageReaction", payload);
      }
      const senderSocketId = getReceiverSocketId(message.senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageReaction", payload);
      }
    }

    res.status(200).json(message.reactions);
  } catch (error) {
    console.log("Error in toggleReaction controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ================= VOTE POLL =================
export const votePoll = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { optionId } = req.body;
    const userId = req.user._id;

    if (!optionId) {
      return res.status(400).json({ message: "Option ID is required." });
    }

    const message = await Message.findById(messageId);
    if (!message || !message.poll) {
      return res.status(404).json({ message: "Poll not found." });
    }

    const option = message.poll.options.id(optionId);
    if (!option) {
      return res.status(404).json({ message: "Option not found." });
    }

    const alreadyVoted = option.votes.includes(userId);

    // Remove user vote from all options (enforcing single choice)
    message.poll.options.forEach((opt) => {
      opt.votes = opt.votes.filter((vId) => vId.toString() !== userId.toString());
    });

    // If they hadn't voted for this one, add it (toggle action)
    if (!alreadyVoted) {
      option.votes.push(userId);
    }

    await message.save();

    // Broadcast the update
    const payload = {
      messageId,
      poll: message.poll,
    };

    if (message.groupId) {
      io.to(`group_${message.groupId}`).emit("pollVote", payload);
    } else {
      const receiverSocketId = getReceiverSocketId(message.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("pollVote", payload);
      }
      const senderSocketId = getReceiverSocketId(message.senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("pollVote", payload);
      }
    }

    res.status(200).json(message.poll);
  } catch (error) {
    console.log("Error in votePoll controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};