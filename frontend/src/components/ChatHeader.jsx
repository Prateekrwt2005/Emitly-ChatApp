import { XIcon, ArrowLeftIcon, SearchIcon, Pin, Trash2, Reply, Forward, Palette, Info, Ban, HashIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import WallpaperSelector from "./WallpaperSelector";

function ChatHeader() {
  const [isWallpaperOpen, setIsWallpaperOpen] = useState(false);
  const { 
    selectedUser, 
    setSelectedUser, 
    selectedGroup,
    setSelectedGroup,
    typingUsers, 
    isMsgSearchOpen, 
    toggleMsgSearch, 
    setMsgSearchQuery,
    selectedMessage,
    setSelectedMessage,
    deleteMessage,
    togglePinMessage,
    setReplyToMessage,
    isRightSidebarOpen,
    toggleRightSidebar,
    blockUser,
    activeSecretChat,
    initiateSecretChat,
    closeSecretChat,
    deleteGroup,
  } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();

  const isGroup = !!selectedGroup;
  const activeChat = selectedGroup || selectedUser;

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        setSelectedUser(null);
        setSelectedGroup(null);
        setSelectedMessage(null);
      }
    };
    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser, setSelectedGroup, setSelectedMessage]);

  if (!activeChat) return null;

  const handleClose = () => {
    if (isMsgSearchOpen) toggleMsgSearch();
    setMsgSearchQuery("");
    setSelectedUser(null);
    setSelectedGroup(null);
    setSelectedMessage(null);
  };

  const isOnline = !isGroup && onlineUsers.includes(selectedUser?._id);
  const isTyping = !isGroup && typingUsers.includes(selectedUser?._id);
  const isBlocked = !isGroup && authUser?.blockedUsers?.includes(selectedUser?._id);
  const isAdmin = isGroup && selectedGroup.members?.some((m) => {
    const memberId = m.userId?._id || m.userId;
    return memberId?.toString() === authUser?._id?.toString() && m.role === "admin";
  });

  if (selectedMessage) {
    const isMe = selectedMessage.senderId === authUser._id || selectedMessage.senderId?._id === authUser._id;
    return (
      <div className="chat-header flex justify-between items-center px-4 py-3 bg-[#0d0d0d] border-b border-white/[0.06] h-[57px] animate-fadeIn">
        {/* LEFT */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setSelectedMessage(null)}
            className="p-2.5 rounded-xl text-[#555] hover:text-[#ececec] hover:bg-white/5 transition-all flex-shrink-0"
            title="Cancel selection"
          >
            <XIcon className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-zinc-400">
            Selected
          </span>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-1.5">
          {/* Reply */}
          <button
            onClick={() => {
              setReplyToMessage(selectedMessage);
              setSelectedMessage(null);
            }}
            className="p-2.5 rounded-xl text-[#555] hover:text-[#ececec] hover:bg-white/5 transition-all flex items-center justify-center flex-shrink-0"
            title="Reply to message"
          >
            <Reply className="w-4 h-4" />
          </button>

          {/* Forward */}
          <button
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("open-forward-modal", {
                  detail: { message: selectedMessage },
                })
              );
              setSelectedMessage(null);
            }}
            className="p-2.5 rounded-xl text-[#555] hover:text-[#ececec] hover:bg-white/5 transition-all flex items-center justify-center flex-shrink-0"
            title="Forward message"
          >
            <Forward className="w-4 h-4" />
          </button>

          {/* Toggle Pin */}
          <button
            onClick={() => {
              togglePinMessage(selectedMessage._id);
              setSelectedMessage(null);
            }}
            className="p-2.5 rounded-xl text-[#555] hover:text-[#ececec] hover:bg-white/5 transition-all flex items-center justify-center flex-shrink-0"
            title={selectedMessage.isPinned ? "Unpin message" : "Pin message"}
          >
            <Pin className={`w-4 h-4 ${selectedMessage.isPinned ? "fill-[#ececec] text-[#ececec]" : ""}`} />
          </button>

          {/* Delete */}
          {isMe && (
            <button
              onClick={() => {
                deleteMessage(selectedMessage._id);
                setSelectedMessage(null);
              }}
              className="p-2.5 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center flex-shrink-0"
              title="Delete message"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Header Details
  const displayName = isGroup ? selectedGroup.name : selectedUser.fullName;
  const displayAvatar = isGroup ? selectedGroup.avatar : selectedUser.profilePic;
  const displayBio = isGroup ? selectedGroup.description : selectedUser.bio;

  const isSecretActive = !isGroup && activeSecretChat && activeSecretChat.status === "active";
  const isSecretPending = !isGroup && activeSecretChat && activeSecretChat.status === "pending";

  return (
    <div className="chat-header flex justify-between items-center px-4 py-3 bg-[#0d0d0d] border-b border-white/[0.06] select-none">
      {/* LEFT */}
      <div className="flex items-center gap-3">
        {/* Mobile Back Button */}
        <button
          onClick={handleClose}
          className="md:hidden p-2.5 rounded-xl text-[#555] hover:text-[#ececec] hover:bg-white/5 transition-all flex-shrink-0"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>

        <div className="relative">
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt={displayName}
              className={`w-9 h-9 object-cover border border-white/10 ${isGroup ? "rounded-xl" : "rounded-full"}`}
            />
          ) : isGroup ? (
            <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-zinc-300 font-bold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
          ) : (
            <img
              src="/avatar.png"
              alt={displayName}
              className="w-9 h-9 rounded-full object-cover border border-white/10"
            />
          )}

          {!isGroup && isOnline && (
            <span className="absolute bottom-0 right-0">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white border-2 border-[#0d0d0d]"></span>
              </span>
            </span>
          )}
          {!isGroup && selectedUser.customStatus?.emoji && (
            <span className="absolute -top-1 -left-1 text-[10px] bg-[#0d0d0d] rounded-full border border-white/10 select-none px-0.5 z-10 pointer-events-none">
              {selectedUser.customStatus.emoji}
            </span>
          )}
        </div>

        <div className="text-left">
          <h3 className="text-[#ececec] font-medium text-sm leading-tight flex items-center gap-1.5 truncate max-w-[250px]" title={displayBio || undefined}>
            {isGroup && <HashIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />}
            <span className="truncate">{displayName}</span>
            {isSecretActive && (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.5 rounded font-semibold shrink-0 select-none flex items-center gap-0.5" title="End-to-End Encrypted">
                🔒 E2E
              </span>
            )}
            {isSecretPending && (
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.5 rounded font-semibold shrink-0 select-none flex items-center gap-0.5 animate-pulse" title="Establishing Secure Key Handshake...">
                🔒 Connecting
              </span>
            )}
            {displayBio && !isSecretActive && !isSecretPending && (
              <span className="text-[10px] text-zinc-500 font-normal italic truncate max-w-[120px] hidden sm:inline">
                — {displayBio}
              </span>
            )}
          </h3>
          {isGroup ? (
            <p className="text-[#555] text-xs mt-0.5 truncate max-w-[200px]">
              {selectedGroup.members?.length || 0} members
            </p>
          ) : isTyping ? (
            <p className="text-[#888] text-xs flex items-center gap-1 leading-none mt-0.5">
              typing
              <span className="flex items-center gap-0.5 ml-1">
                <span className="w-1 h-1 bg-[#888] rounded-full animate-bounce"></span>
                <span className="w-1 h-1 bg-[#888] rounded-full animate-bounce [animation-delay:0.15s]"></span>
                <span className="w-1 h-1 bg-[#888] rounded-full animate-bounce [animation-delay:0.3s]"></span>
              </span>
            </p>
          ) : (
            <p className="text-[#555] text-xs mt-0.5 truncate max-w-[200px]">
              {selectedUser.customStatus?.text ? (
                <span className="flex items-center gap-1">
                  {selectedUser.customStatus.emoji && <span>{selectedUser.customStatus.emoji}</span>}
                  <span>{selectedUser.customStatus.text}</span>
                </span>
              ) : (
                isOnline ? "Online" : "Offline"
              )}
            </p>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-1.5">
        {/* Search button */}
        <div className="relative group flex items-center">
          <button
            onClick={toggleMsgSearch}
            className={`p-2.5 rounded-xl transition-all ${
              isMsgSearchOpen
                ? "text-white bg-white/10"
                : "text-[#555] hover:text-[#ececec] hover:bg-white/5"
            }`}
          >
            <SearchIcon className="w-4 h-4" />
          </button>
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-50 bg-[#121214] border border-white/10 text-sm text-zinc-300 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap shadow-lg">
            Search messages
          </div>
        </div>

        {/* E2E Secret Chat Toggle Button (Only if NOT group) */}
        {!isGroup && (
          <div className="relative group flex items-center">
            <button
              onClick={() => {
                if (activeSecretChat) {
                  closeSecretChat(activeSecretChat._id);
                } else {
                  initiateSecretChat(selectedUser._id);
                }
              }}
              className={`p-2.5 rounded-xl text-sm transition-all flex items-center justify-center ${
                isSecretActive
                  ? "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                  : isSecretPending
                    ? "text-amber-400 bg-amber-500/10 animate-pulse"
                    : "text-[#555] hover:text-[#ececec] hover:bg-white/5"
              }`}
            >
              {isSecretActive || isSecretPending ? "🔒" : "🔓"}
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-50 bg-[#121214] border border-white/10 text-sm text-zinc-300 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap shadow-lg">
              {activeSecretChat ? "End Secret Chat" : "Start Secret Chat"}
            </div>
          </div>
        )}

        {/* Conversation Details / Right Sidebar */}
        <div className="relative group flex items-center">
          <button
            onClick={toggleRightSidebar}
            className={`p-2.5 rounded-xl transition-all ${
              isRightSidebarOpen
                ? "text-white bg-white/10"
                : "text-[#555] hover:text-[#ececec] hover:bg-white/5"
            }`}
          >
            <Info className="w-4 h-4" />
          </button>
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-50 bg-[#121214] border border-white/10 text-sm text-zinc-300 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap shadow-lg">
            Conversation details
          </div>
        </div>

        {/* Block User Button (Only if NOT group) */}
        {!isGroup && (
          <div className="relative group flex items-center">
            <button
              onClick={() => blockUser(selectedUser._id)}
              className={`p-2.5 rounded-xl transition-all ${
                isBlocked
                  ? "text-red-500 bg-red-500/10 hover:bg-red-500/20"
                  : "text-[#555] hover:text-red-400 hover:bg-white/5"
              }`}
            >
              <Ban className="w-4 h-4" />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-y-1/2 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-50 bg-[#121214] border border-white/10 text-sm text-zinc-300 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap shadow-lg">
              {isBlocked ? "Unblock user" : "Block user"}
            </div>
          </div>
        )}

        {/* Delete Group Button (Only if group and user is admin) */}
        {isGroup && isAdmin && (
          <div className="relative group flex items-center">
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this channel? This will permanently remove all messages and members.")) {
                  deleteGroup(selectedGroup._id);
                }
              }}
              className="p-2.5 rounded-xl text-[#555] hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center flex-shrink-0"
              title="Delete channel"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-y-1/2 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-50 bg-[#121214] border border-white/10 text-sm text-zinc-200 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap shadow-lg">
              Delete Channel
            </div>
          </div>
        )}

        {/* Wallpaper Customizer */}
        <div className="relative group flex items-center">
          <button
            onClick={() => setIsWallpaperOpen(true)}
            className="p-2.5 rounded-xl text-[#555] hover:text-[#ececec] hover:bg-white/5 transition-all"
          >
            <Palette className="w-4 h-4" />
          </button>
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-50 bg-[#121214] border border-white/10 text-sm text-zinc-300 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap shadow-lg">
            Change wallpaper
          </div>
        </div>

        {/* Close conversation button */}
        <div className="relative group flex items-center">
          <button
            onClick={handleClose}
            className="p-2.5 rounded-xl text-[#555] hover:text-[#ececec] hover:bg-white/5 transition-all"
          >
            <XIcon className="w-4 h-4" />
          </button>
          <div className="absolute top-full mt-2 right-0 scale-90 origin-top-right opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-50 bg-[#121214] border border-white/10 text-sm text-zinc-300 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap shadow-lg">
            Close conversation
          </div>
        </div>
      </div>

      <WallpaperSelector isOpen={isWallpaperOpen} onClose={() => setIsWallpaperOpen(false)} />
    </div>
  );
}

export default ChatHeader;