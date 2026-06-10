import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import CustomAudioPlayer from "./CustomAudioPlayer";
import { ArrowDownIcon, SearchIcon, Pin, ChevronLeft, ChevronRight, X, Eye, EyeOff } from "lucide-react";
import ForwardModal from "./ForwardModal";
import RightSidebar from "./RightSidebar";
import VotersModal from "./VotersModal";

// ✅ Tick Icons
const Tick = ({ color = "#888" }) => (
  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className="rotate-[10deg]">
    <path
      d="M4 10.5L8 14L16 6"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DoubleTick = ({ color = "#888" }) => (
  <div className="flex items-center">
    <Tick color={color} />
    <div className="-ml-1.5 mt-[1px]">
      <Tick color={color} />
    </div>
  </div>
);

const formatDividerDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (isSameDay(date, today)) {
    return "Today";
  } else if (isSameDay(date, yesterday)) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
};

const smokeVariants = {
  hidden: {
    opacity: 0,
    filter: "blur(12px) grayscale(100%)",
    scale: 1.15,
    transition: { duration: 0.8, ease: "easeOut" }
  },
  visible: {
    opacity: 1,
    filter: "blur(0px) grayscale(0%)",
    scale: 1,
  }
};

function ViewOnceMessage({ msg, isMe, authUser, selectedUser, socket }) {
  const [revealed, setRevealed] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [isExpiring, setIsExpiring] = useState(false);
  const [isLocallyViewed, setIsLocallyViewed] = useState(false);

  useEffect(() => {
    let timer;
    if (revealed && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (revealed && countdown === 0) {
      setIsExpiring(true);
      const animTimer = setTimeout(() => {
        setIsLocallyViewed(true);
        if (socket) {
          socket.emit("messageViewed", { messageId: msg._id, senderId: msg.senderId });
        }
      }, 800);
      return () => clearTimeout(animTimer);
    }
    return () => clearTimeout(timer);
  }, [revealed, countdown, msg, socket]);

  if (msg.isViewed || isLocallyViewed) {
    return (
      <div className="flex items-center gap-2 text-zinc-500 py-1.5 px-2 select-none">
        <EyeOff className="w-4 h-4 text-zinc-600" />
        <span className="text-xs italic font-medium">Opened view-once message</span>
      </div>
    );
  }

  if (isMe) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-amber-500 text-[10px] uppercase tracking-wider font-semibold select-none">
          <Eye className="w-3.5 h-3.5" />
          <span>View Once Sent</span>
        </div>
        {msg.image && (
          <img
            src={msg.image}
            alt="Shared view once"
            className="rounded-xl object-cover max-h-60 w-full opacity-60 filter blur-[1px]"
          />
        )}
        {msg.audio && (
          <div className="opacity-60 pointer-events-none">
            <CustomAudioPlayer src={msg.audio} isMe={isMe} />
          </div>
        )}
        {msg.text && (
          <p className="text-xs italic text-zinc-400">Content hidden for sender security</p>
        )}
      </div>
    );
  }

  if (!revealed) {
    return (
      <button
        onClick={() => setRevealed(true)}
        className="w-full flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 active:scale-[0.98] transition-all duration-200 text-center gap-2 min-w-[180px]"
      >
        <Eye className="w-6 h-6 text-amber-500 animate-pulse" />
        <div className="text-xs font-semibold text-amber-500">View Once Message</div>
        <div className="text-[10px] text-zinc-500">Click to reveal (10 seconds)</div>
      </button>
    );
  }

  return (
    <motion.div
      initial="visible"
      animate={isExpiring ? "hidden" : "visible"}
      variants={smokeVariants}
      className="relative flex flex-col gap-1.5"
    >
      <div className="absolute -top-2.5 -right-2.5 bg-amber-500 text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg border border-black/10 animate-bounce">
        {countdown}
      </div>

      {msg.image && (
        <img
          src={msg.image}
          alt="Shared"
          className="rounded-xl object-cover max-h-60 w-full"
        />
      )}

      {msg.audio && (
        <CustomAudioPlayer src={msg.audio} isMe={isMe} />
      )}

      {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
    </motion.div>
  );
}

function ChatContainer() {
  const {
    selectedUser,
    selectedGroup,
    getMessagesByUserId,
    getGroupMessages,
    messages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
    isMsgSearchOpen,
    msgSearchQuery,
    setMsgSearchQuery,
    selectedMessage,
    setSelectedMessage,
    togglePinMessage,
    replyToMessage,
    chatWallpaper,
    isRightSidebarOpen,
    toggleReaction,
    votePoll,
  } = useChatStore(useShallow((state) => ({
    selectedUser: state.selectedUser,
    selectedGroup: state.selectedGroup,
    getMessagesByUserId: state.getMessagesByUserId,
    getGroupMessages: state.getGroupMessages,
    messages: state.messages,
    isMessagesLoading: state.isMessagesLoading,
    subscribeToMessages: state.subscribeToMessages,
    unsubscribeFromMessages: state.unsubscribeFromMessages,
    isMsgSearchOpen: state.isMsgSearchOpen,
    msgSearchQuery: state.msgSearchQuery,
    setMsgSearchQuery: state.setMsgSearchQuery,
    selectedMessage: state.selectedMessage,
    setSelectedMessage: state.setSelectedMessage,
    togglePinMessage: state.togglePinMessage,
    replyToMessage: state.replyToMessage,
    chatWallpaper: state.chatWallpaper,
    isRightSidebarOpen: state.isRightSidebarOpen,
    toggleReaction: state.toggleReaction,
    votePoll: state.votePoll,
  })));

  const { authUser, socket, isSocketConnected } = useAuthStore(useShallow((state) => ({
    authUser: state.authUser,
    socket: state.socket,
    isSocketConnected: state.isSocketConnected,
  })));
  const messageEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const mountedAtRef = useRef(Date.now());

  const pressTimerRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  const [currentPinIndex, setCurrentPinIndex] = useState(0);

  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  const [isVotersModalOpen, setIsVotersModalOpen] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState(null);

  const activeChat = selectedUser || selectedGroup;
  const pinnedMessages = messages.filter((m) => m.isPinned);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);

  const searchMatches = messages.filter(
    (m) => m.text && msgSearchQuery && m.text.toLowerCase().includes(msgSearchQuery.toLowerCase())
  );

  useEffect(() => {
    setActiveMatchIndex(0);
  }, [msgSearchQuery]);

  const handlePrevMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIndex = (activeMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setActiveMatchIndex(nextIndex);
    scrollToMessage(searchMatches[nextIndex]._id);
  };

  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIndex = (activeMatchIndex + 1) % searchMatches.length;
    setActiveMatchIndex(nextIndex);
    scrollToMessage(searchMatches[nextIndex]._id);
  };

  useEffect(() => {
    if (selectedUser) {
      getMessagesByUserId(selectedUser._id);
    } else if (selectedGroup) {
      getGroupMessages(selectedGroup._id);
    }
  }, [selectedUser, selectedGroup, getMessagesByUserId, getGroupMessages]);

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser, selectedGroup, socket, isSocketConnected, subscribeToMessages, unsubscribeFromMessages]);

  const prevMessagesLengthRef = useRef(messages.length);
  const prevActiveChatIdRef = useRef(null);
  const activeChatId = selectedUser?._id || selectedGroup?._id;

  useEffect(() => {
    if (!activeChatId) return;

    // Chat switched -> scroll to bottom instantly
    if (activeChatId !== prevActiveChatIdRef.current) {
      prevActiveChatIdRef.current = activeChatId;
      prevMessagesLengthRef.current = messages.length;
      scrollToBottom();
      return;
    }

    // New message arrived or sent
    if (messages.length > prevMessagesLengthRef.current) {
      if (prevMessagesLengthRef.current === 0) {
        // Initial load of messages -> scroll to bottom
        scrollToBottom();
      } else {
        const lastMsg = messages[messages.length - 1];
        const lastMsgSenderId = lastMsg.senderId?._id || lastMsg.senderId;
        const isMe = lastMsgSenderId === authUser?._id;

        if (isMe) {
          scrollToBottom();
        } else {
          // Only scroll if already near bottom
          const container = scrollContainerRef.current;
          if (container) {
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 350;
            if (isNearBottom) {
              scrollToBottom();
            }
          }
        }
      }
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages, activeChatId, authUser]);

  useEffect(() => {
    if (pinnedMessages.length > 0 && currentPinIndex >= pinnedMessages.length) {
      setCurrentPinIndex(Math.max(0, pinnedMessages.length - 1));
    }
  }, [pinnedMessages.length, currentPinIndex]);

  useEffect(() => {
    if (!selectedUser) return;
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    let hasUpdates = false;
    const updatedMessages = messages.map((msg) => {
      const msgSenderId = msg.senderId?._id || msg.senderId;
      if (msgSenderId === selectedUser._id && msg.status !== "seen") {
        socket.emit("messageSeen", { messageId: msg._id, senderId: msgSenderId });
        hasUpdates = true;
        return { ...msg, status: "seen" };
      }
      return msg;
    });

    if (hasUpdates) {
      useChatStore.setState({ messages: updatedMessages });
    }
  }, [messages, selectedUser]);

  // Click outside selected message to dismiss selection/reactions popup
  useEffect(() => {
    if (!selectedMessage) return;

    const handleDocumentClick = (e) => {
      const selectedEl = document.getElementById(`msg-${selectedMessage._id}`);
      const headerEl = document.querySelector(".chat-header");

      if (
        (selectedEl && selectedEl.contains(e.target)) ||
        (headerEl && headerEl.contains(e.target))
      ) {
        return;
      }
      setSelectedMessage(null);
    };

    const timer = setTimeout(() => {
      document.addEventListener("click", handleDocumentClick);
      document.addEventListener("touchstart", handleDocumentClick);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("touchstart", handleDocumentClick);
    };
  }, [selectedMessage, setSelectedMessage]);

  // Listen for the custom "open-forward-modal" event dispatched from ChatHeader
  useEffect(() => {
    const handleOpenForward = (e) => {
      setMessageToForward(e.detail.message);
      setIsForwardModalOpen(true);
    };
    window.addEventListener("open-forward-modal", handleOpenForward);
    return () => window.removeEventListener("open-forward-modal", handleOpenForward);
  }, []);

  if (!activeChat) return null;

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  };

  const scrollToMessage = (msgId) => {
    const element = document.getElementById(`msg-${msgId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMsgId(msgId);
      setTimeout(() => {
        setHighlightedMsgId(null);
      }, 1500);
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 300;
    setShowScrollBtn((prev) => {
      if (prev !== isScrolledUp) return isScrolledUp;
      return prev;
    });
  };

  const handleContainerClick = (e) => {
    // Clear selection when clicking the empty background space
    if (e.target === scrollContainerRef.current) {
      setSelectedMessage(null);
    }
  };

  const handleReact = (msgId, emoji) => {
    toggleReaction(msgId, emoji);
  };

  const getGroupedReactions = (reactionsList) => {
    if (!reactionsList) return [];
    const grouped = {};
    reactionsList.forEach((r) => {
      if (!grouped[r.emoji]) {
        grouped[r.emoji] = { emoji: r.emoji, count: 0, userIds: [] };
      }
      grouped[r.emoji].count += 1;
      grouped[r.emoji].userIds.push(r.userId?._id || r.userId);
    });
    return Object.values(grouped);
  };

  // Long press timer functions
  const startPressTimer = (msg) => {
    cancelPressTimer();
    pressTimerRef.current = setTimeout(() => {
      setSelectedMessage(msg);
    }, 400); // 400ms threshold for long-press hold
  };

  const cancelPressTimer = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const parseMarkdown = (text, isMe) => {
    if (!text) return null;

    const highlight = (txt) => {
      if (!msgSearchQuery) return txt;
      const regex = new RegExp(`(${msgSearchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
      const subparts = txt.split(regex);
      return subparts.map((subpart, i) => 
        regex.test(subpart) 
          ? <mark 
              key={i} 
              className={isMe 
                ? "bg-amber-500/35 text-amber-950 px-0.5 rounded shadow-[0_0_4px_rgba(245,158,11,0.3)] font-semibold" 
                : "bg-amber-500/40 text-amber-200 px-0.5 rounded shadow-[0_0_6px_rgba(245,158,11,0.5)] font-semibold"
              }
            >
              {subpart}
            </mark> 
          : subpart
      );
    };

    // Code Blocks
    const parts = text.split("```");
    if (parts.length >= 3) {
      return parts.map((part, index) => {
        if (index % 2 === 1) {
          const lines = part.split("\n");
          const code = lines.slice(1).join("\n").trim() || part.trim();
          return (
            <div key={index} className="my-2 bg-[#09090b]/80 border border-white/[0.06] rounded-xl p-3 font-mono text-xs text-[#d1d5db] overflow-x-auto relative group/code select-text">
              <div className="absolute top-2 right-2 group/copy flex items-center">
                <button
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="p-1 rounded-md bg-white/5 border border-white/5 text-zinc-500 hover:text-white transition opacity-100 md:opacity-0 md:group-hover/code:opacity-100"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
                <div className="absolute right-full mr-2 scale-90 opacity-0 group-hover/copy:scale-100 group-hover/copy:opacity-100 transition-all duration-150 pointer-events-none z-50 bg-[#121214] border border-white/10 text-xs text-zinc-300 px-2.5 py-1 rounded-lg font-medium whitespace-nowrap shadow-lg">
                  Copy Code
                </div>
              </div>
              <code className="whitespace-pre">{highlight(code)}</code>
            </div>
          );
        }
        return <span key={index}>{renderInlineStyles(part, isMe)}</span>;
      });
    }

    return renderInlineStyles(text, isMe);
  };

  const renderInlineStyles = (text, isMe) => {
    const highlight = (txt) => {
      if (!msgSearchQuery) return txt;
      const regex = new RegExp(`(${msgSearchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
      const subparts = txt.split(regex);
      return subparts.map((subpart, i) => 
        regex.test(subpart) 
          ? <mark 
              key={i} 
              className={isMe 
                ? "bg-amber-500/35 text-amber-950 px-0.5 rounded shadow-[0_0_4px_rgba(245,158,11,0.3)] font-semibold" 
                : "bg-amber-500/40 text-amber-200 px-0.5 rounded shadow-[0_0_6px_rgba(245,158,11,0.5)] font-semibold"
              }
            >
              {subpart}
            </mark> 
          : subpart
      );
    };

    const regex = /(\*\*.*?\*\*|\*.*?\*|_.*?_|~~.*?~~|`.*?`)/g;
    const parts = text.split(regex);

    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className={`font-bold ${isMe ? "text-black" : "text-white"}`}>
            {highlight(part.slice(2, -2))}
          </strong>
        );
      } else if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
        return (
          <em key={idx} className={`italic ${isMe ? "text-zinc-800" : "text-zinc-300"}`}>
            {highlight(part.slice(1, -1))}
          </em>
        );
      } else if (part.startsWith("~~") && part.endsWith("~~")) {
        return (
          <del key={idx} className={`line-through ${isMe ? "text-zinc-400" : "text-zinc-500"}`}>
            {highlight(part.slice(2, -2))}
          </del>
        );
      } else if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={idx} className={`font-mono text-xs px-1.5 py-0.5 rounded border ${
            isMe 
              ? "bg-black/5 text-zinc-800 border-black/5" 
              : "bg-black/40 text-zinc-200 border-white/5"
          }`}>
            {highlight(part.slice(1, -1))}
          </code>
        );
      }
      return <span key={idx}>{highlight(part)}</span>;
    });
  };

  const getWallpaperClass = () => {
    switch (chatWallpaper) {
      case "graphite":
        return "bg-[#0d0f12]";
      case "solid-dark":
        return "bg-[#000]";
      case "violet-glow":
        return "bg-[#06040a] bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.08)_0%,transparent_75%)] animate-fadeIn";
      case "bronze-glow":
        return "bg-[#080604] bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.07)_0%,transparent_75%)] animate-fadeIn";
      case "forest-mesh":
        return "bg-[#040605] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0%,transparent_75%)] animate-fadeIn";
      case "default":
      default:
        return "bg-[#050505] bg-[linear-gradient(to_right,rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:40px_40px]";
    }
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden select-none">
      <ChatHeader />

      {/* TOP DETAIL DRAWER */}
      <AnimatePresence>
        {isRightSidebarOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="w-full bg-[#0a0a0c]/95 border-b border-white/[0.08] shadow-2xl z-20 shrink-0 overflow-hidden"
          >
            <RightSidebar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* PINNED MESSAGES BANNER */}
      {pinnedMessages.length > 0 && (
        <div className="bg-[#0b0b0d]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 py-2.5 flex items-center justify-between gap-4 z-10 select-none shrink-0 animate-fadeIn">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Pin className="w-3.5 h-3.5 text-zinc-400 rotate-45 shrink-0" />
            <div 
              onClick={() => scrollToMessage(pinnedMessages[currentPinIndex]._id)}
              className="cursor-pointer hover:text-white transition-colors min-w-0 flex-1 text-left"
            >
              <span className="text-zinc-500 font-semibold text-[10px] uppercase tracking-wider mr-2 bg-white/5 px-1.5 py-0.5 rounded-md">
                Pin {pinnedMessages.length > 1 ? `${currentPinIndex + 1}/${pinnedMessages.length}` : ""}
              </span>
              <span className="text-zinc-300 text-sm font-medium truncate">
                {pinnedMessages[currentPinIndex].text 
                  ? (pinnedMessages[currentPinIndex].text.length > 70 
                      ? pinnedMessages[currentPinIndex].text.substring(0, 70) + "..." 
                      : pinnedMessages[currentPinIndex].text)
                  : pinnedMessages[currentPinIndex].image 
                    ? "📷 Photo" 
                    : pinnedMessages[currentPinIndex].audio 
                      ? "🎵 Voice message" 
                      : "Message"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {pinnedMessages.length > 1 && (
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setCurrentPinIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentPinIndex === 0}
                  className="p-1 rounded-md text-zinc-500 hover:text-white disabled:opacity-35 disabled:hover:text-zinc-500 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPinIndex(prev => Math.min(pinnedMessages.length - 1, prev + 1))}
                  disabled={currentPinIndex === pinnedMessages.length - 1}
                  className="p-1 rounded-md text-zinc-500 hover:text-white disabled:opacity-35 disabled:hover:text-zinc-500 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            {pinnedMessages.length > 1 && <div className="w-[1px] h-4 bg-white/10" />}
            <button
              onClick={() => togglePinMessage(pinnedMessages[currentPinIndex]._id)}
              className="p-1 rounded-md text-zinc-500 hover:text-red-400 transition-colors"
              title="Unpin message"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MESSAGES AREA */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onClick={handleContainerClick}
        className={`flex-1 px-3 py-4 md:px-4 overflow-y-auto overflow-x-hidden custom-scrollbar relative ${getWallpaperClass()}`}
      >
        {/* Sticky Chat search panel */}
        {isMsgSearchOpen && (
          <div className="sticky top-0 z-20 w-full max-w-md mx-auto mb-4 px-1 md:px-2">
            <div className="flex items-center bg-[#0d0d0f]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl px-3 py-2 shadow-lg gap-2">
              <SearchIcon className="w-4 h-4 text-zinc-500 mr-1 flex-shrink-0" />
              <input
                type="text"
                value={msgSearchQuery}
                onChange={(e) => setMsgSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="flex-1 bg-transparent text-base md:text-sm text-white placeholder:text-zinc-600 outline-none"
              />
              {msgSearchQuery && searchMatches.length > 0 && (
                <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5 shrink-0">
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {activeMatchIndex + 1}/{searchMatches.length}
                  </span>
                  <button
                    onClick={handlePrevMatch}
                    className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 transition"
                    title="Previous match"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleNextMatch}
                    className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 transition"
                    title="Next match"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {msgSearchQuery && (
                <button
                  onClick={() => setMsgSearchQuery("")}
                  className="text-xs text-zinc-500 hover:text-white transition px-1"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {messages.length > 0 && !isMessagesLoading ? (
          <div className="w-full max-w-full flex flex-col gap-2 px-1 md:px-2">
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => {
                const msgSenderId = msg.senderId?._id || msg.senderId;
                const isMe = msgSenderId === authUser._id;
                const activeReactions = getGroupedReactions(msg.reactions);

                // Date separator calculations
                const msgDate = msg.createdAt ? new Date(msg.createdAt) : null;
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const prevMsgDate = prevMsg && prevMsg.createdAt ? new Date(prevMsg.createdAt) : null;
                const isDifferentDay = !prevMsgDate || !msgDate || 
                  msgDate.getFullYear() !== prevMsgDate.getFullYear() ||
                  msgDate.getMonth() !== prevMsgDate.getMonth() ||
                  msgDate.getDate() !== prevMsgDate.getDate();

                // Message text matches the search
                const hasQuery = !!msgSearchQuery;
                const isMatch = msg.text && msgSearchQuery && msg.text.toLowerCase().includes(msgSearchQuery.toLowerCase());
                
                const hasSelection = selectedMessage !== null;
                const isSelected = selectedMessage?._id === msg._id;
                const isHighlighted = highlightedMsgId === msg._id;

                let stateClasses = "opacity-100";
                if (hasSelection) {
                  stateClasses = isSelected 
                    ? "opacity-100 z-10" 
                    : "opacity-35 blur-[0.1px]";
                } else if (hasQuery && !isMatch) {
                  stateClasses = "opacity-35 blur-[0.2px]";
                }

                const isHistorical = msg.createdAt ? (new Date(msg.createdAt).getTime() < mountedAtRef.current - 1000) : false;

                // Calculate total votes for poll
                const totalVotes = (msg.poll && msg.poll.question) ? msg.poll.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0) : 0;
                const renderBubbleContent = () => (
                  <div className={`flex relative ${isMe ? "justify-end" : "justify-start"} w-full`}>
                    {/* Emojis Reactions Popover (renders above the selected message bubble) */}
                    {isSelected && (
                      <div className={`absolute -top-9 z-20 flex gap-1 p-1 bg-[#121214] border border-white/10 rounded-full shadow-lg animate-fadeIn ${
                        isMe ? "right-2" : "left-2"
                      }`}>
                        {["👍", "❤️", "🔥", "😂", "👏"].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReact(msg._id, emoji);
                              setSelectedMessage(null);
                            }}
                            className="hover:scale-125 active:scale-95 transition px-2 py-0.5 text-base md:text-sm"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    <div
                      onMouseDown={() => startPressTimer(msg)}
                      onMouseUp={cancelPressTimer}
                      onMouseLeave={cancelPressTimer}
                      onTouchStart={() => startPressTimer(msg)}
                      onTouchEnd={cancelPressTimer}
                      onDoubleClick={() => setSelectedMessage(msg)}
                      className={`relative max-w-[85%] md:max-w-[72%] rounded-2xl text-[14px] leading-relaxed shadow-sm cursor-pointer select-text break-words overflow-visible
                        ${(msg.image || msg.audio) && !msg.text ? "p-1 pb-1.5" : "px-3.5 py-2"}
                        ${isMe
                          ? "bg-white text-black rounded-br-[4px] shadow-[0_4px_12px_rgba(255,255,255,0.03)]"
                          : "bg-[#121214] text-[#ececec] border border-white/[0.06] rounded-bl-[4px]"
                        }
                        ${isSelected ? "ring-2 ring-zinc-500/50" : ""}
                        ${isHighlighted ? "ring-2 ring-white/50 scale-[1.02]" : ""}
                        ${searchMatches[activeMatchIndex]?._id === msg._id ? "ring-2 ring-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)] scale-[1.01]" : ""}
                        transition-[box-shadow,transform] duration-150 ease-out`}
                    >
                      {/* Group Sender Name */}
                      {!isMe && msg.groupId && (
                        <div className="text-[11px] font-bold text-amber-500 mb-1 text-left select-none">
                          {msg.senderId?.fullName || "Group Member"}
                        </div>
                      )}

                      {/* REPLY QUOTE BLOCK */}
                      {msg.replyTo && (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent bubble click handlers
                            scrollToMessage(msg.replyTo._id);
                          }}
                          className="mb-2 p-2 bg-[#000]/25 hover:bg-[#000]/35 transition-colors border-l-2 border-zinc-500 rounded-r-lg text-xs cursor-pointer select-none text-left"
                        >
                          <div className={`font-semibold text-[10px] ${isMe ? "text-zinc-500" : "text-zinc-400"}`}>
                            {msg.replyTo.senderId === authUser._id || msg.replyTo.senderId?._id === authUser._id ? "You" : (selectedUser?.fullName || msg.replyTo.senderId?.fullName || "Member")}
                          </div>
                          <div className={`truncate max-w-[220px] ${isMe ? "text-zinc-700" : "text-zinc-300"}`}>
                            {msg.replyTo.text 
                              ? msg.replyTo.text 
                              : msg.replyTo.image 
                                ? "📷 Photo" 
                                : msg.replyTo.audio 
                                  ? "🎵 Voice message" 
                                  : "Message"}
                          </div>
                        </div>
                      )}

                      {msg.isViewOnce ? (
                        <ViewOnceMessage
                          msg={msg}
                          isMe={isMe}
                          authUser={authUser}
                          selectedUser={selectedUser}
                          socket={socket}
                        />
                      ) : (
                        <>
                          {/* IMAGE */}
                          {msg.image && (
                            <img
                              src={msg.image}
                              alt="Shared"
                              className={`rounded-xl object-cover max-h-60 w-full ${msg.text ? "mb-1.5" : ""}`}
                            />
                          )}

                          {/* AUDIO */}
                          {msg.audio && (
                            <CustomAudioPlayer src={msg.audio} isMe={isMe} />
                          )}

                          {/* POLL CARD */}
                          {msg.poll && msg.poll.question && (
                            <div className={`poll-card my-1.5 p-3.5 rounded-xl border text-left min-w-[220px] sm:min-w-[260px] select-none
                              ${isMe 
                                ? "bg-black/[0.03] border-black/5" 
                                : "bg-black/30 border-white/5"
                              }`}
                            >
                              <h4 className={`text-xs sm:text-sm font-semibold mb-3 leading-snug
                                ${isMe ? "text-zinc-900" : "text-white"}`}
                              >
                                {msg.poll.question}
                              </h4>
                              <div className="space-y-2">
                                {msg.poll.options.map((opt) => {
                                  const votesCount = opt.votes?.length || 0;
                                  const hasVoted = opt.votes?.some(v => {
                                    const voterId = v._id || v;
                                    return voterId.toString() === authUser._id.toString();
                                  });
                                  const percent = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;
                                  
                                  const voterNames = !msg.poll.isAnonymous && opt.votes
                                    ? opt.votes.map(v => v.fullName || "Member").join(", ")
                                    : "";

                                  return (
                                    <button
                                      key={opt._id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        votePoll(msg._id, opt._id);
                                      }}
                                      className={`relative w-full text-left p-2 rounded-lg border overflow-hidden transition-all active:scale-[0.99] flex items-center justify-between
                                        ${isMe 
                                          ? `border-black/5 hover:bg-black/[0.04] ${hasVoted ? "border-[var(--accent-color)]/30 bg-[var(--accent-color)]/[0.03] hover:bg-[var(--accent-color)]/[0.05]" : ""}` 
                                          : `border-white/5 hover:bg-white/5 ${hasVoted ? "border-[var(--accent-color)]/40 bg-[var(--accent-color)]/10 hover:bg-[var(--accent-color)]/15" : ""}`
                                        }`}
                                    >
                                      {/* Progress fill */}
                                      <div
                                        className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out
                                          ${isMe ? "bg-[var(--accent-color)]/[0.08]" : "bg-[var(--accent-color)]/20"}`}
                                        style={{ width: `${percent}%` }}
                                      />
                                      <span className={`relative z-10 text-xs font-semibold truncate flex-1 pr-2
                                        ${isMe ? "text-zinc-800" : "text-zinc-200"}`}
                                      >
                                        {opt.text}
                                      </span>
                                      <div className="flex items-center gap-1.5 relative z-10 shrink-0">
                                        {/* Voters Facepile */}
                                        {!msg.poll.isAnonymous && opt.votes && opt.votes.length > 0 && (
                                          <div 
                                            className="flex items-center -space-x-1.5 mr-1 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedPoll(msg.poll);
                                              setIsVotersModalOpen(true);
                                            }}
                                          >
                                            {opt.votes.slice(0, 3).map((voter) => {
                                              const name = voter.fullName || "Member";
                                              const pic = voter.profilePic || "/avatar.png";
                                              return (
                                                <div
                                                  key={voter._id || voter}
                                                  className="group/voter relative hover:z-30 transition-all"
                                                >
                                                  <img
                                                    src={pic}
                                                    alt={name}
                                                    className={`w-4 h-4 rounded-full object-cover border ${isMe ? "border-white" : "border-[#121214]"}`}
                                                  />
                                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/voter:block bg-zinc-950/90 backdrop-blur-md text-zinc-100 text-[9px] py-1 px-1.5 rounded-lg whitespace-nowrap shadow-xl border border-white/10 z-50 pointer-events-none font-medium">
                                                    {name}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                            {opt.votes.length > 3 && (
                                              <div className="group/more relative pl-1 select-none hover:z-30 transition-all">
                                                <span className={`text-[8px] font-bold ${isMe ? "text-zinc-600" : "text-zinc-400"}`}>
                                                  +{opt.votes.length - 3}
                                                </span>
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/more:block bg-zinc-950/90 backdrop-blur-md text-zinc-100 text-[9px] py-1 px-1.5 rounded-lg whitespace-nowrap shadow-xl border border-white/10 z-50 pointer-events-none font-medium max-w-[200px] overflow-hidden text-ellipsis">
                                                  {voterNames}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        <span className={`relative z-10 text-[10px] font-mono font-medium shrink-0
                                          ${isMe ? "text-zinc-500" : "text-zinc-400"}`}
                                        >
                                          {percent}% ({votesCount})
                                        </span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (totalVotes > 0) {
                                    setSelectedPoll(msg.poll);
                                    setIsVotersModalOpen(true);
                                  }
                                }}
                                className={`mt-3 text-[10px] font-medium text-left select-none
                                  ${totalVotes > 0 ? "cursor-pointer hover:underline" : ""}
                                  ${isMe ? "text-zinc-500" : "text-zinc-500"}`}
                              >
                                {totalVotes} vote{totalVotes === 1 ? "" : "s"} • {msg.poll.isAnonymous ? "Anonymous Poll" : "Public Poll"}
                              </div>
                            </div>
                          )}

                          {/* TEXT (Parsed Markdown) */}
                          {msg.text && (!msg.poll || !msg.poll.question) && parseMarkdown(msg.text, isMe)}
                        </>
                      )}

                      {/* TIME + STATUS */}
                      <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] select-none ${isMe ? "text-zinc-600" : "text-zinc-400"}`}>
                        {msg.status === "scheduled" ? (
                          <span className="text-amber-500 font-semibold flex items-center gap-1 select-none">
                            🕒 Scheduled for {new Date(msg.scheduledAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                          </span>
                        ) : (
                          <>
                            {msg.isPinned && (
                              <Pin className={`w-2.5 h-2.5 rotate-45 mr-0.5 ${isMe ? "text-zinc-500" : "text-zinc-400"}`} />
                            )}
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {isMe && !msg.groupId && (
                              <span className="ml-0.5 flex items-center">
                                {msg.status === "sent" && <Tick color="#71717a" />}
                                {msg.status === "delivered" && <DoubleTick color="#71717a" />}
                                {msg.status === "seen" && <DoubleTick color="var(--accent-color)" />}
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Reactions view */}
                      {activeReactions.length > 0 && (
                        <div className={`absolute -bottom-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#121214] border border-white/10 text-[10px] text-[#acacac] shadow-lg z-10 select-none ${
                          isMe ? "left-3" : "right-3"
                        }`}>
                          {activeReactions.map((reaction) => (
                            <button
                              key={reaction.emoji}
                              onClick={(e) => {
                                  e.stopPropagation();
                                  handleReact(msg._id, reaction.emoji);
                              }}
                              className="hover:scale-110 active:scale-95 transition flex items-center gap-0.5"
                            >
                              <span>{reaction.emoji}</span>
                              {reaction.count > 1 && (
                                <span className="text-[9px] text-zinc-500 font-semibold">{reaction.count}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );

                const containerClasses = `flex flex-col relative ${
                  (hasSelection || hasQuery)
                    ? "transition-[opacity,filter] duration-150 ease-out " + stateClasses
                    : ""
                } ${isMe ? "items-end" : "items-start"} ${activeReactions.length > 0 ? "mb-2.5" : ""}`;

                return (
                  <div key={msg.tempId || msg._id} className="w-full flex flex-col gap-2">
                    {isDifferentDay && msgDate && (
                      <div className="flex justify-center items-center my-3.5 select-none">
                        <div className="bg-black/20 backdrop-blur-md border border-white/[0.04] text-zinc-400 text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                          {formatDividerDate(msg.createdAt)}
                        </div>
                      </div>
                    )}
                    {isHistorical ? (
                      <div
                        id={`msg-${msg._id}`}
                        className={containerClasses}
                      >
                        {renderBubbleContent()}
                      </div>
                    ) : (
                      <motion.div
                        id={`msg-${msg._id}`}
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className={containerClasses}
                      >
                        {renderBubbleContent()}
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </AnimatePresence>
            <div ref={messageEndRef} />
          </div>
        ) : isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : (
          <NoChatHistoryPlaceholder name={activeChat.name || activeChat.fullName} />
        )}
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBtn && (
        <div className="absolute bottom-20 right-6 z-30 group flex items-center select-none">
          <button
            onClick={scrollToBottom}
            className="p-2.5 rounded-full bg-white text-black hover:bg-[#e0e0e0] shadow-lg transition-all active:scale-95 duration-200"
          >
            <ArrowDownIcon className="w-4 h-4" />
          </button>
          <div className="absolute right-full mr-2.5 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-50 bg-[#121214] border border-white/10 text-sm text-zinc-300 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap shadow-lg">
            Scroll to bottom
          </div>
        </div>
      )}

      {/* INPUT */}
      <MessageInput />

      {/* FORWARD MODAL */}
      <ForwardModal
        isOpen={isForwardModalOpen}
        onClose={() => {
          setIsForwardModalOpen(false);
          setMessageToForward(null);
        }}
        messageToForward={messageToForward}
      />

      {/* VOTERS MODAL */}
      <VotersModal
        isOpen={isVotersModalOpen}
        onClose={() => {
          setIsVotersModalOpen(false);
          setSelectedPoll(null);
        }}
        poll={selectedPoll}
      />
    </div>
  );
}

export default ChatContainer;