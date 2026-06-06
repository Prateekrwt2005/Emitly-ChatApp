import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PlusIcon, HashIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { NoChatsFound } from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";
import GroupModal from "./GroupModal";

function ChatsList() {
  const {
    getMyChatPartners,
    chats,
    isUsersLoading,
    setSelectedUser,
    selectedUser,
    isSidebarCollapsed,
    searchQuery,
    typingUsers,
    // Group fields
    groups,
    selectedGroup,
    setSelectedGroup,
    getGroups,
    isGroupsLoading,
  } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  useEffect(() => {
    getMyChatPartners();
    getGroups();
  }, [getMyChatPartners, getGroups]);

  const filteredChats = chats.filter((chat) =>
    (chat.fullName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter((group) =>
    (group.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasAnyItems = filteredChats.length > 0 || filteredGroups.length > 0;

  if (!hasAnyItems && searchQuery.trim() === "" && !isUsersLoading && !isGroupsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4">
        <NoChatsFound />
        {!isSidebarCollapsed && (
          <button
            onClick={() => setIsGroupModalOpen(true)}
            className="mt-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold border border-white/10 transition-all"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Create Channel
          </button>
        )}
        <GroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* DIRECT MESSAGES SECTION */}
      {(filteredChats.length > 0 || isUsersLoading) && (
        <div className="space-y-1">
          {!isSidebarCollapsed && (
            <div className="px-3 py-1 flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
              <span>Direct Messages</span>
            </div>
          )}
          {isUsersLoading ? (
            <UsersLoadingSkeleton count={2} isSidebarCollapsed={isSidebarCollapsed} />
          ) : (
            filteredChats.map((chat) => {
            const isActive = selectedUser?._id === chat._id;
            const isOnline = onlineUsers.includes(chat._id);
            const isTyping = typingUsers.includes(chat._id);

            return (
              <div
                key={chat._id}
                onClick={() => setSelectedUser(chat)}
                className={`relative flex items-center rounded-xl cursor-pointer transition-all duration-200 group
                ${
                  isSidebarCollapsed
                    ? "justify-center p-2 mx-auto w-12 h-12"
                    : "gap-3 px-3 py-2"
                }
                ${
                  isActive
                    ? "text-white"
                    : "text-[#acacac] hover:text-white"
                }`}
              >
                {/* Custom Tooltip in Collapsed Sidebar */}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-50 bg-[#121214] border border-white/10 text-sm text-zinc-200 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap shadow-lg">
                    {chat.fullName}
                  </div>
                )}
                {/* Active item highlight sliding pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeUserSelection"
                    className="absolute inset-0 bg-white/5 rounded-xl border border-white/10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}

                {/* Hover highlight background (only if not active) */}
                {!isActive && (
                  <div className="absolute inset-0 rounded-xl hover:bg-white/[0.03] transition-all duration-150" />
                )}

                {/* AVATAR */}
                <div className="relative flex-shrink-0 z-10">
                  <img
                    src={chat.profilePic || "/avatar.png"}
                    alt={chat.fullName}
                    className="w-9 h-9 rounded-full object-cover border border-white/5"
                  />
                  {chat.customStatus?.emoji && (
                    <span className="absolute -top-1 -left-1 text-[10px] bg-[#0d0d0d] rounded-full border border-white/10 select-none px-0.5 z-10 pointer-events-none">
                      {chat.customStatus.emoji}
                    </span>
                  )}
                  {isOnline && (
                    <span className="absolute bottom-0 right-0">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white border-2 border-[#0d0d0d]"></span>
                      </span>
                    </span>
                  )}
                  {isSidebarCollapsed && chat.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-white text-black font-bold text-[9px] min-w-4 h-4 rounded-full flex items-center justify-center px-1 border border-[#0d0d0d] shadow-sm">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>

                {/* NAME / PREVIEW */}
                {!isSidebarCollapsed && (
                  <div className="flex-1 min-w-0 z-10 text-left">
                    <p className="text-sm font-medium truncate">
                      {chat.fullName}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {isTyping ? (
                        <span className="text-xs text-white/90 font-medium animate-pulse flex items-center gap-1 leading-none">
                          typing
                          <span className="flex items-center gap-0.5 ml-1">
                            <span className="w-1 h-1 bg-white/95 rounded-full animate-bounce"></span>
                            <span className="w-1 h-1 bg-white/95 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                            <span className="w-1 h-1 bg-white/95 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-[#555] truncate leading-none flex items-center gap-1">
                          {chat.customStatus?.emoji && <span>{chat.customStatus.emoji}</span>}
                          <span className="truncate">{chat.customStatus?.text || (isOnline ? "Online" : "Offline")}</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* UNREAD BADGE (EXPANDED) */}
                {!isSidebarCollapsed && chat.unreadCount > 0 && (
                  <div className="z-10 bg-white text-black font-semibold text-[10px] min-w-5 h-5 rounded-full flex items-center justify-center px-1.5 shadow-sm">
                    {chat.unreadCount}
                  </div>
                )}
              </div>
            );
          }))}
        </div>
      )}

      {/* CHANNELS / GROUPS SECTION */}
      <div className="space-y-1">
        {!isSidebarCollapsed ? (
          <div className="px-3 py-1 flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            <span>Channels</span>
            <button
              onClick={() => setIsGroupModalOpen(true)}
              className="p-1 hover:bg-white/5 rounded-md text-zinc-400 hover:text-white transition-all"
            >
              <PlusIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <button
              onClick={() => setIsGroupModalOpen(true)}
              className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-zinc-300 hover:text-white transition-all"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {isGroupsLoading ? (
          <UsersLoadingSkeleton count={2} isSidebarCollapsed={isSidebarCollapsed} />
        ) : (
          filteredGroups.map((group) => {
            const isActive = selectedGroup?._id === group._id;

          return (
            <div
              key={group._id}
              onClick={() => setSelectedGroup(group)}
              className={`relative flex items-center rounded-xl cursor-pointer transition-all duration-200 group
              ${
                isSidebarCollapsed
                  ? "justify-center p-2 mx-auto w-12 h-12"
                  : "gap-3 px-3 py-2"
              }
              ${
                isActive
                  ? "text-white"
                  : "text-[#acacac] hover:text-white"
              }`}
            >
              {/* Custom Tooltip in Collapsed Sidebar */}
              {isSidebarCollapsed && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-50 bg-[#121214] border border-white/10 text-sm text-zinc-200 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap shadow-lg">
                  {group.name}
                </div>
              )}
              {/* Active item highlight sliding pill */}
              {isActive && (
                <motion.div
                  layoutId="activeUserSelection"
                  className="absolute inset-0 bg-white/5 rounded-xl border border-white/10"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}

              {/* Hover highlight background (only if not active) */}
              {!isActive && (
                <div className="absolute inset-0 rounded-xl hover:bg-white/[0.03] transition-all duration-150" />
              )}

              {/* CHANNEL AVATAR (rounded-xl like Discord/Slack) */}
              <div className="relative flex-shrink-0 z-10">
                {group.avatar ? (
                  <img
                    src={group.avatar}
                    alt={group.name}
                    className="w-9 h-9 rounded-xl object-cover border border-white/5"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-zinc-300 font-bold text-sm">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {isSidebarCollapsed && group.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-black font-bold text-[9px] min-w-4 h-4 rounded-full flex items-center justify-center px-1 border border-[#0d0d0d] shadow-sm">
                    {group.unreadCount}
                  </span>
                )}
              </div>

              {/* NAME / PREVIEW */}
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0 z-10 text-left">
                  <p className="text-sm font-medium truncate flex items-center gap-1">
                    <HashIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate">{group.name}</span>
                  </p>
                  <p className="text-xs text-[#555] truncate mt-0.5 leading-none">
                    {group.description || `${group.members.length} members`}
                  </p>
                </div>
              )}

              {/* UNREAD BADGE */}
              {!isSidebarCollapsed && group.unreadCount > 0 && (
                <div className="z-10 bg-white text-black font-semibold text-[10px] min-w-5 h-5 rounded-full flex items-center justify-center px-1.5 shadow-sm">
                  {group.unreadCount}
                </div>
              )}
            </div>
          );
        }))}
      </div>

      {/* SEARCH EMPTY STATE */}
      {!hasAnyItems && searchQuery.trim() !== "" && !isUsersLoading && !isGroupsLoading && (
        <div className="text-center py-6 text-xs text-zinc-600">
          No conversations match your search
        </div>
      )}

      {/* Global Group Creation Modal */}
      <GroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />
    </div>
  );
}

export default ChatsList;