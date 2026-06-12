import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import React from "react";
import { 
  generateECDHKeyPair, 
  exportPublicKey, 
  importPublicKey, 
  deriveSharedKey, 
  encryptText, 
  decryptText 
} from "../lib/crypto";

const initialAccent = localStorage.getItem("emitly_theme_accent") || "sky";
document.documentElement.setAttribute("data-theme-accent", initialAccent);

// Ephemeral RAM key storage
const localCryptoKeys = {
  myPrivateKeys: {}, // partnerUserId -> privateKey
  sharedKeys: {},    // partnerUserId -> CryptoKey
};



export const useChatStore = create((set, get) => ({
  
  allContacts: [],
  chats: [],
  messages: [],
  seenMessageIds: new Set(),
  isRightSidebarOpen: false,
  chatWallpaper: localStorage.getItem("emitly_wallpaper") || "default",
  themeAccent: localStorage.getItem("emitly_theme_accent") || "sky",
  offlineQueue: JSON.parse(localStorage.getItem("emitly_offline_queue")) || [],
  typingUsers: [],
  activeTab: "chats",
  selectedUser: null,
  groups: [],
  selectedGroup: null,
  activeSecretChat: null,
  isGroupsLoading: false,
  selectedMessage: null,
  replyToMessage: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSidebarCollapsed: (JSON.parse(localStorage.getItem("isSidebarCollapsed")) === true) && (typeof window !== "undefined" ? window.innerWidth >= 768 : true),
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,
  searchQuery: "",
  isMsgSearchOpen: false,
  msgSearchQuery: "",

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setMsgSearchQuery: (msgSearchQuery) => set({ msgSearchQuery }),
  toggleMsgSearch: () => set({ isMsgSearchOpen: !get().isMsgSearchOpen }),

  toggleSidebar: () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return;
    const currentStored = JSON.parse(localStorage.getItem("isSidebarCollapsed")) === true;
    const nextVal = !currentStored;
    localStorage.setItem("isSidebarCollapsed", nextVal);
    set({ isSidebarCollapsed: nextVal });
  },

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => {
    if (selectedUser) {
      set((state) => ({
        selectedUser,
        selectedGroup: null,
        chats: state.chats.map((c) =>
          c._id === selectedUser._id ? { ...c, unreadCount: 0 } : c
        ),
        allContacts: state.allContacts.map((c) =>
          c._id === selectedUser._id ? { ...c, unreadCount: 0 } : c
        ),
      }));
    } else {
      set({ selectedUser });
    }
  },

  setSelectedGroup: (selectedGroup) => {
    if (selectedGroup) {
      set((state) => ({
        selectedGroup,
        selectedUser: null,
        groups: state.groups.map((g) =>
          g._id === selectedGroup._id ? { ...g, unreadCount: 0 } : g
        ),
      }));
      get().getGroupMessages(selectedGroup._id);
    } else {
      set({ selectedGroup });
    }
  },

  getGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load groups");
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  createGroup: async (groupData) => {
    try {
      const res = await axiosInstance.post("/groups/create", groupData);
      set((state) => ({
        groups: [...state.groups, res.data],
      }));
      toast.success("Group created successfully");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
    }
  },

  deleteGroup: async (groupId) => {
    try {
      await axiosInstance.delete(`/groups/delete/${groupId}`);
      set((state) => ({
        groups: state.groups.filter((g) => g._id !== groupId),
        selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup,
        messages: state.selectedGroup?._id === groupId ? [] : state.messages,
      }));
      toast.success("Channel deleted successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete channel");
    }
  },

  getGroupMessages: async (groupId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/groups/${groupId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load group messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  setSelectedMessage: (selectedMessage) => set({ selectedMessage }),
  toggleRightSidebar: () => set({ isRightSidebarOpen: !get().isRightSidebarOpen }),
  setChatWallpaper: (chatWallpaper) => {
    localStorage.setItem("emitly_wallpaper", chatWallpaper);
    set({ chatWallpaper });
  },
  setThemeAccent: (themeAccent) => {
    localStorage.setItem("emitly_theme_accent", themeAccent);
    document.documentElement.setAttribute("data-theme-accent", themeAccent);
    set({ themeAccent });
  },
  addToOfflineQueue: (item) => {
    const nextQueue = [...get().offlineQueue, item];
    localStorage.setItem("emitly_offline_queue", JSON.stringify(nextQueue));
    set({ offlineQueue: nextQueue });
  },
  processOfflineQueue: async () => {
    const queue = get().offlineQueue;
    if (queue.length === 0) return;
    const remainingQueue = [];
    const socket = useAuthStore.getState().socket;

    for (const item of queue) {
      try {
        const payload = {
          ...item.messageData,
          replyTo: item.replyToMessage?._id
        };
        const res = await axiosInstance.post(`/messages/send/${item.recipientId}`, payload);
        const savedMessage = { ...res.data, tempId: item.tempId };

        set((state) => ({
          messages: state.messages.map((m) =>
            m._id === item.tempId ? savedMessage : m
          ),
        }));

        if (socket?.connected) {
          socket.emit("messageDelivered", {
            messageId: savedMessage._id,
            senderId: savedMessage.senderId,
          });
        }
      } catch (error) {
        if (!error.response) {
          remainingQueue.push(item);
        } else {
          set((state) => ({
            messages: state.messages.filter((m) => m._id !== item.tempId),
          }));
        }
      }
    }

    localStorage.setItem("emitly_offline_queue", JSON.stringify(remainingQueue));
    set({ offlineQueue: remainingQueue });
  },
  setReplyToMessage: (replyToMessage) => set({ replyToMessage }),

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load contacts");
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load chats");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      let messages = res.data;

      // Decrypt secret messages locally in RAM
      const sharedKey = localCryptoKeys.sharedKeys[userId];
      messages = await Promise.all(
        messages.map(async (msg) => {
          const isProbablySecret = msg.isSecret || (msg.text && msg.text.includes(":") && !msg.text.includes(" "));
          if (isProbablySecret && msg.text) {
            if (sharedKey) {
              const decrypted = await decryptText(msg.text, sharedKey);
              return { ...msg, text: decrypted, isSecret: true };
            } else {
              return { ...msg, text: "[E2E Encrypted - Handshake Key Cleared]", isSecret: true };
            }
          }
          return msg;
        })
      );

      set({ messages });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, selectedGroup, messages, replyToMessage } = get();
    const { authUser } = useAuthStore.getState();

    const tempId = `temp-${Date.now()}`;

    // Intercept Scheduled Messages
    if (messageData.scheduledAt) {
      try {
        const payload = {
          ...messageData,
          replyTo: replyToMessage?._id
        };
        const endpoint = selectedGroup ? `/groups/send/${selectedGroup._id}` : `/messages/send/${selectedUser._id}`;
        await axiosInstance.post(endpoint, payload);
        toast.success("Message scheduled successfully");
        set({ replyToMessage: null });
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to schedule message");
      }
      return;
    }

    if (selectedGroup) {
      // Group message optimistic update
      const optimisticMessage = {
        _id: tempId,
        tempId: tempId,
        senderId: {
          _id: authUser._id,
          fullName: authUser.fullName,
          profilePic: authUser.profilePic,
        },
        groupId: selectedGroup._id,
        text: messageData.text,
        image: messageData.image,
        audio: messageData.audio,
        replyTo: replyToMessage,
        createdAt: new Date().toISOString(),
        isOptimistic: true,
        status: "sent",
      };

      set({ 
        messages: [...messages, optimisticMessage],
        replyToMessage: null
      });

      try {
        const payload = {
          ...messageData,
          replyTo: replyToMessage?._id
        };
        const res = await axiosInstance.post(`/groups/send/${selectedGroup._id}`, payload);
        const savedMessage = { ...res.data, tempId: tempId };
        
        set((state) => ({
          messages: state.messages.map((m) =>
            m._id === tempId ? savedMessage : m
          ),
        }));
      } catch (error) {
        set({ messages });
        toast.error(error.response?.data?.message || "Something went wrong");
      }
      return;
    }

    if (!selectedUser) return;

    // Secret Chat E2E encryption interceptor
    const isActiveSecret = get().activeSecretChat && 
                           get().activeSecretChat.status === "active" &&
                           selectedUser &&
                           (get().activeSecretChat.initiatorId === selectedUser._id || get().activeSecretChat.receiverId === selectedUser._id);

    if (isActiveSecret) {
      const sharedKey = localCryptoKeys.sharedKeys[selectedUser._id];
      if (sharedKey) {
        try {
          const encryptedText = await encryptText(messageData.text || "", sharedKey);
          
          const payload = {
            ...messageData,
            text: encryptedText,
            isSecret: true,
          };
          
          const optimisticMessage = {
            _id: tempId,
            tempId: tempId,
            senderId: authUser._id,
            receiverId: selectedUser._id,
            text: messageData.text, // Plaintext locally
            image: messageData.image,
            audio: messageData.audio,
            replyTo: replyToMessage,
            createdAt: new Date().toISOString(),
            isOptimistic: true,
            isSecret: true,
            status: "pending",
          };

          set({ 
            messages: [...messages, optimisticMessage],
            replyToMessage: null
          });

          const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, payload);
          const savedMessage = { ...res.data, text: messageData.text, tempId: tempId }; // Plaintext locally
          
          set((state) => ({
            messages: state.messages.map((m) =>
              m._id === tempId ? savedMessage : m
            ),
          }));
        } catch (error) {
          console.error(error);
          toast.error("Failed to encrypt and send message");
        }
        return;
      }
    }

    const optimisticMessage = {
      _id: tempId,
      tempId: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      audio: messageData.audio,
      replyTo: replyToMessage,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      isViewOnce: !!messageData.isViewOnce,
      status: "pending",
    };
    
    // immediately update the ui by adding the message and clear reply state
    set({ 
      messages: [...messages, optimisticMessage],
      replyToMessage: null
    });

    if (!navigator.onLine) {
      get().addToOfflineQueue({ tempId, recipientId: selectedUser._id, messageData, replyToMessage });
      return;
    }

    try {
      const payload = {
        ...messageData,
        replyTo: replyToMessage?._id
      };
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, payload);
      const savedMessage = { ...res.data, tempId: tempId };
      
      // Handle seen race condition
      if (get().seenMessageIds.has(savedMessage._id)) {
        savedMessage.status = "seen";
        get().seenMessageIds.delete(savedMessage._id);
      }

      const updatedMessages = get().messages.map((m) =>
        m._id === tempId ? savedMessage : m
      );
      set({ messages: updatedMessages });
    } catch (error) {
      if (!error.response) {
        get().addToOfflineQueue({ tempId, recipientId: selectedUser._id, messageData, replyToMessage });
        toast.error("Offline. Message queued.");
      } else {
        // restore original messages on failure
        set({ messages: messages });
        toast.error(error.response?.data?.message || "Something went wrong");
      }
    }
  },

  forwardMessage: async (recipientId, originalMsg) => {
    try {
      const payload = {
        text: originalMsg.text,
        image: originalMsg.image,
        audio: originalMsg.audio,
      };
      const res = await axiosInstance.post(`/messages/send/${recipientId}`, payload);
      toast.success("Message forwarded");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to forward message");
      throw error;
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/delete/${messageId}`);
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== messageId),
        selectedMessage: state.selectedMessage?._id === messageId ? null : state.selectedMessage
      }));
      toast.success("Message deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },

  togglePinMessage: async (messageId) => {
    try {
      const res = await axiosInstance.put(`/messages/pin/${messageId}`);
      const updatedMessage = res.data;
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? updatedMessage : msg
        ),
        selectedMessage: state.selectedMessage?._id === messageId ? updatedMessage : state.selectedMessage
      }));
      toast.success(updatedMessage.isPinned ? "Message pinned" : "Message unpinned");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to pin message");
    }
  },

  blockUser: async (targetUserId) => {
    try {
      const res = await axiosInstance.post(`/messages/block/${targetUserId}`);
      const { isBlocked } = res.data;
      
      const { authUser } = useAuthStore.getState();
      if (authUser) {
        let updatedBlockedUsers = authUser.blockedUsers || [];
        if (isBlocked) {
          updatedBlockedUsers = [...updatedBlockedUsers, targetUserId];
        } else {
          updatedBlockedUsers = updatedBlockedUsers.filter(id => id.toString() !== targetUserId.toString());
        }
        useAuthStore.setState({ authUser: { ...authUser, blockedUsers: updatedBlockedUsers } });
      }

      if (isBlocked) {
        toast.success("User blocked and conversation deleted");
        set((state) => ({
          selectedUser: null,
          messages: [],
          chats: state.chats.filter(c => c._id !== targetUserId),
          allContacts: state.allContacts.filter(c => c._id !== targetUserId),
          isRightSidebarOpen: false
        }));
      } else {
        toast.success("User unblocked");
      }
      return isBlocked;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to toggle block status");
    }
  },

  toggleReaction: async (messageId, emoji) => {
    try {
      const res = await axiosInstance.put(`/messages/reaction/${messageId}`, { emoji });
      const reactions = res.data;
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === messageId ? { ...m, reactions } : m
        ),
      }));
      // Trigger local reaction explosion
      window.dispatchEvent(
        new CustomEvent("trigger-reaction", {
          detail: { emoji, x: window.innerWidth / 2, y: window.innerHeight * 0.8 },
        })
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to add reaction");
    }
  },

  votePoll: async (messageId, optionId) => {
    try {
      const res = await axiosInstance.post(`/messages/vote/${messageId}`, { optionId });
      const updatedPoll = res.data;
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === messageId ? { ...m, poll: updatedPoll } : m
        ),
      }));
    } catch (error) {
      console.error(error);
      toast.error("Failed to cast vote");
    }
  },

  initiateSecretChat: async (partnerId) => {
    try {
      const keyPair = await generateECDHKeyPair();
      localCryptoKeys.myPrivateKeys[partnerId] = keyPair.privateKey;
      
      const myPublicKey = await exportPublicKey(keyPair.publicKey);
      const res = await axiosInstance.post("/secret/initiate", {
        receiverId: partnerId,
        publicKey: myPublicKey
      });
      
      set({ activeSecretChat: res.data });
      toast.success("Secret chat requested. Waiting for partner...");
    } catch (error) {
      toast.error("Failed to initiate secret chat");
    }
  },

  acceptSecretChatRequest: async (session) => {
    try {
      const partnerId = session.initiatorId;
      const keyPair = await generateECDHKeyPair();
      localCryptoKeys.myPrivateKeys[partnerId] = keyPair.privateKey;
      
      const myPublicKey = await exportPublicKey(keyPair.publicKey);
      const res = await axiosInstance.post("/secret/accept", {
        sessionId: session._id,
        publicKey: myPublicKey
      });
      
      const partnerPubKeyObj = await importPublicKey(session.initiatorPublicKey);
      const sharedKey = await deriveSharedKey(keyPair.privateKey, partnerPubKeyObj);
      localCryptoKeys.sharedKeys[partnerId] = sharedKey;

      set({ activeSecretChat: res.data });
      toast.success("Secret chat accepted. Conversation is secure!");
    } catch (error) {
      toast.error("Failed to accept secret chat");
    }
  },

  onSecretChatAccepted: async (sessionId, receiverPublicKey) => {
    const { activeSecretChat, selectedUser } = get();
    if (!activeSecretChat || activeSecretChat._id !== sessionId || !selectedUser) return;
    
    try {
      const partnerId = selectedUser._id;
      const myPrivateKey = localCryptoKeys.myPrivateKeys[partnerId];
      if (!myPrivateKey) return;

      const partnerPubKeyObj = await importPublicKey(receiverPublicKey);
      const sharedKey = await deriveSharedKey(myPrivateKey, partnerPubKeyObj);
      localCryptoKeys.sharedKeys[partnerId] = sharedKey;

      set((state) => ({
        activeSecretChat: { ...state.activeSecretChat, status: "active" }
      }));
      toast.success("Secret chat established. Conversation is secure!");
    } catch (error) {
      console.error("Failed to derive secret key on accept", error);
    }
  },

  closeSecretChat: async (sessionId) => {
    try {
      await axiosInstance.post(`/secret/close/${sessionId}`);
      const { selectedUser } = get();
      if (selectedUser) {
        delete localCryptoKeys.myPrivateKeys[selectedUser._id];
        delete localCryptoKeys.sharedKeys[selectedUser._id];
      }
      set({ activeSecretChat: null, messages: [] });
      toast.success("Secret chat closed. Messages wiped.");
      if (selectedUser) {
        get().getMessagesByUserId(selectedUser._id);
      }
    } catch (error) {
      toast.error("Failed to close secret chat");
    }
  },

  onSecretChatClosed: (sessionId) => {
    const { activeSecretChat, selectedUser } = get();
    if (activeSecretChat && activeSecretChat._id === sessionId) {
      if (selectedUser) {
        delete localCryptoKeys.myPrivateKeys[selectedUser._id];
        delete localCryptoKeys.sharedKeys[selectedUser._id];
      }
      set({ activeSecretChat: null, messages: [] });
      toast.error("Secret chat closed by partner. Messages wiped.");
      if (selectedUser) {
        get().getMessagesByUserId(selectedUser._id);
      }
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    
    // 🔥 TYPING START
    socket.on("typing", ({ senderId }) => {
      const { selectedUser } = get();
      if (selectedUser && selectedUser._id === senderId) {
        set((state) => ({
          typingUsers: state.typingUsers.includes(senderId)
            ? state.typingUsers
            : [...state.typingUsers, senderId],
        }));
      }
    });

    socket.on("stopTyping", ({ senderId }) => {
      set((state) => ({
        typingUsers: state.typingUsers.filter((id) => id !== senderId),
      }));
    });

    // ✅ DELIVERED
    socket.on("messageDelivered", ({ messageId }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, status: "delivered" } : msg
        ),
      }));
    });

    // ✅ SEEN (single message seen update)
    socket.on("messageSeenUpdate", ({ messageId }) => {
      get().seenMessageIds.add(messageId);
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, status: "seen" } : msg
        ),
      }));
    });

    // ✅ CHAT SEEN (bulk messages seen update)
    socket.on("chatSeen", ({ readerId }) => {
      const { selectedUser } = get();
      if (selectedUser && selectedUser._id === readerId) {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.senderId === useAuthStore.getState().authUser._id
              ? { ...msg, status: "seen" }
              : msg
          ),
        }));
      }
    });

    // ✅ DELETED
    socket.on("messageDeleted", ({ messageId }) => {
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== messageId),
        selectedMessage: state.selectedMessage?._id === messageId ? null : state.selectedMessage,
      }));
    });

    // ✅ PINNED
    socket.on("messagePinned", (updatedMessage) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        ),
        selectedMessage: state.selectedMessage?._id === updatedMessage._id ? updatedMessage : state.selectedMessage,
      }));
    });

    // ✅ VIEWED (disappearing message destruction)
    socket.on("messageViewedUpdate", ({ messageId }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, isViewed: true, text: "", image: "", audio: "" } : msg
        ),
      }));
    });

    socket.on("userBlocked", ({ blockerId }) => {
      const { selectedUser } = get();
      if (selectedUser && selectedUser._id === blockerId) {
        set({ selectedUser: null, messages: [] });
        toast.error("This conversation has been closed.");
      }
      set((state) => ({
        chats: state.chats.filter(c => c._id !== blockerId),
        allContacts: state.allContacts.filter(c => c._id !== blockerId)
      }));
    });

    // ✅ NEW GROUP (invitation/creation join room)
    socket.on("newGroup", (newGroup) => {
      set((state) => ({
        groups: [...state.groups.filter(g => g._id !== newGroup._id), newGroup]
      }));
      // Join group room on client socket if supported
      socket.emit("joinGroupRoom", { groupId: newGroup._id });
    });

    socket.on("groupDeleted", ({ groupId }) => {
      const { selectedGroup } = get();
      if (selectedGroup && selectedGroup._id === groupId) {
        set({ selectedGroup: null, messages: [] });
        toast.error("This channel has been deleted by the admin.");
      }
      set((state) => ({
        groups: state.groups.filter((g) => g._id !== groupId),
      }));
    });

    // ✅ MESSAGE REACTION RECEIVED
    socket.on("messageReaction", ({ messageId, reactions, triggerEmoji }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, reactions } : msg
        ),
      }));
      // Trigger canvas explosion animation
      window.dispatchEvent(
        new CustomEvent("trigger-reaction", {
          detail: { emoji: triggerEmoji },
        })
      );
    });

    // ✅ POLL VOTE RECEIVED
    socket.on("pollVote", ({ messageId, poll }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, poll } : msg
        ),
      }));
    });

    // ✅ SECRET CHAT HANDSHAKES
    socket.on("secretChatRequest", async ({ sessionId, initiatorId, publicKey }) => {
      const { allContacts } = get();
      const initiator = allContacts.find(c => c._id === initiatorId);
      const name = initiator ? initiator.fullName : "A user";

      toast((t) => 
        React.createElement("div", { className: "flex flex-col gap-2 p-1 text-left select-none" },
          React.createElement("span", { className: "text-xs font-semibold text-zinc-300" }, "New Encrypted Chat Request"),
          React.createElement("span", { className: "text-[10px] text-zinc-500" }, `Would you like to accept a secret chat session from ${name}?`),
          React.createElement("div", { className: "flex gap-2 mt-1" },
            React.createElement("button", {
              onClick: () => {
                toast.dismiss(t.id);
                get().acceptSecretChatRequest({ _id: sessionId, initiatorId, initiatorPublicKey: publicKey });
                if (initiator) {
                  get().setSelectedUser(initiator);
                }
              },
              className: "px-2.5 py-1 bg-white text-black text-[10px] font-bold rounded-md hover:bg-zinc-200"
            }, "Accept"),
            React.createElement("button", {
              onClick: () => toast.dismiss(t.id),
              className: "px-2.5 py-1 bg-white/10 text-white text-[10px] font-bold rounded-md hover:bg-white/20"
            }, "Decline")
          )
        ),
        { duration: 10000 }
      );
    });

    socket.on("secretChatAccepted", async ({ sessionId, receiverPublicKey }) => {
      get().onSecretChatAccepted(sessionId, receiverPublicKey);
    });

    socket.on("secretChatClosed", ({ sessionId }) => {
      get().onSecretChatClosed(sessionId);
    });

    socket.on("newMessage", async (newMessage) => {
      const { selectedUser, selectedGroup, chats, getMyChatPartners, isSoundEnabled } = get();
      const authUser = useAuthStore.getState().authUser;

      if (isSoundEnabled) {
        const notificationSound = new Audio("/sounds/notification.mp3");
        notificationSound.currentTime = 0; // reset to start
        notificationSound.play().catch((e) => console.log("Audio play failed:", e));
      }

      // Decrypt secret messages locally in RAM
      const isProbablySecret = newMessage.isSecret || (newMessage.text && newMessage.text.includes(":") && !newMessage.text.includes(" "));
      if (isProbablySecret && newMessage.text) {
        const senderId = newMessage.senderId?._id || newMessage.senderId;
        const sharedKey = localCryptoKeys.sharedKeys[senderId];
        if (sharedKey) {
          newMessage.text = await decryptText(newMessage.text, sharedKey);
          newMessage.isSecret = true;
        } else {
          newMessage.text = "[E2E Encrypted - Handshake Key Cleared]";
          newMessage.isSecret = true;
        }
      }

      const senderId = newMessage.senderId?._id || newMessage.senderId;
      const receiverId = newMessage.receiverId?._id || newMessage.receiverId;

      // Group messaging delivery check
      if (newMessage.groupId) {
        if (selectedGroup && newMessage.groupId === selectedGroup._id) {
          set((state) => {
            const existsIndex = state.messages.findIndex((m) =>
              m._id === newMessage._id ||
              (m._id && m._id.toString().startsWith("temp-") &&
                (m.text === newMessage.text || m.image === newMessage.image || m.audio === newMessage.audio) &&
                (m.senderId?._id || m.senderId || "").toString() === (newMessage.senderId?._id || newMessage.senderId || "").toString())
            );
            if (existsIndex > -1) {
              const updated = [...state.messages];
              updated[existsIndex] = newMessage;
              return { messages: updated };
            } else {
              return {
                messages: [...state.messages, newMessage]
              };
            }
          });
        } else {
          set((state) => ({
            groups: state.groups.map((g) =>
              g._id === newMessage.groupId
                ? { ...g, unreadCount: (g.unreadCount || 0) + 1 }
                : g
            ),
          }));
        }
        return;
      }

      const isCurrentChat = selectedUser && 
        ((senderId === selectedUser._id && receiverId === authUser?._id) ||
         (senderId === authUser?._id && receiverId === selectedUser._id));

      if (isCurrentChat) {
        set((state) => {
          const existsIndex = state.messages.findIndex((m) =>
            m._id === newMessage._id ||
            (m._id && m._id.toString().startsWith("temp-") &&
              (m.text === newMessage.text || m.image === newMessage.image || m.audio === newMessage.audio) &&
              (m.senderId?._id || m.senderId || "").toString() === (newMessage.senderId?._id || newMessage.senderId || "").toString())
          );
          if (existsIndex > -1) {
            const updated = [...state.messages];
            updated[existsIndex] = newMessage;
            return { messages: updated };
          } else {
            return {
              messages: [...state.messages, newMessage]
            };
          }
        });
        
        if (senderId === selectedUser._id) {
          socket.emit("messageSeen", {
            messageId: newMessage._id,
            senderId: senderId,
          });
        }
      } else {
        // Ignore my own messages sent to other chats
        const isFromMe = authUser && senderId === authUser._id;
        if (isFromMe) return;

        const chatExists = chats.some((c) => c._id === senderId);
        if (chatExists) {
          set({
            chats: chats.map((c) =>
              c._id === senderId
                ? { ...c, unreadCount: (c.unreadCount || 0) + 1 }
                : c
            ),
          });
        } else {
          getMyChatPartners();
        }

        // Also update allContacts list in real-time
        set((state) => ({
          allContacts: state.allContacts.map((c) =>
            c._id === senderId
              ? { ...c, unreadCount: (c.unreadCount || 0) + 1 }
              : c
          ),
        }));
      }

      if (authUser && senderId !== authUser._id) {
        socket.emit("messageDelivered", {
          messageId: newMessage._id,
          senderId: senderId,
        });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("typing");
    socket.off("stopTyping");
    socket.off("messageDelivered");
    socket.off("messageSeenUpdate");
    socket.off("chatSeen");
    socket.off("messageDeleted");
    socket.off("messagePinned");
    socket.off("messageViewedUpdate");
    socket.off("userBlocked");
    socket.off("newGroup");
    socket.off("messageReaction");
    socket.off("pollVote");
    socket.off("secretChatRequest");
    socket.off("secretChatAccepted");
    socket.off("secretChatClosed");
    socket.off("groupDeleted");
  },
}));

if (typeof window !== "undefined") {
  window.addEventListener("resize", () => {
    const isMobile = window.innerWidth < 768;
    const currentStored = JSON.parse(localStorage.getItem("isSidebarCollapsed")) === true;
    useChatStore.setState({
      isSidebarCollapsed: isMobile ? false : currentStored
    });
  });
}