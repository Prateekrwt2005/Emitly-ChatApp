import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { motion } from "framer-motion";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";

function ContactList() {
  const {
    getAllContacts,
    allContacts,
    setSelectedUser,
    isUsersLoading,
    selectedUser,
    isSidebarCollapsed,
    searchQuery,
  } = useChatStore(useShallow((state) => ({
    getAllContacts: state.getAllContacts,
    allContacts: state.allContacts,
    setSelectedUser: state.setSelectedUser,
    isUsersLoading: state.isUsersLoading,
    selectedUser: state.selectedUser,
    isSidebarCollapsed: state.isSidebarCollapsed,
    searchQuery: state.searchQuery,
  })));

  const { onlineUsers, authUser } = useAuthStore(useShallow((state) => ({
    onlineUsers: state.onlineUsers,
    authUser: state.authUser,
  })));

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  const filteredContacts = searchQuery.trim() === ""
    ? []
    : allContacts.filter((contact) =>
        contact.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div className="space-y-1">
      {filteredContacts.map((contact) => {
        const isActive = selectedUser?._id === contact._id;
        const isOnline = onlineUsers.includes(contact._id);
        const isBlocked = authUser?.blockedUsers?.includes(contact._id);

        return (
          <div
            key={contact._id}
            onClick={() => setSelectedUser(contact)}
            className={`relative flex items-center rounded-xl cursor-pointer transition-all duration-200 group
            ${
              isSidebarCollapsed
                ? "justify-center p-2 mx-auto w-12 h-12"
                : "gap-3 px-3 py-2.5"
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
                {contact.fullName}
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
                src={contact.profilePic || "/avatar.png"}
                alt={contact.fullName}
                className="w-9 h-9 rounded-full object-cover border border-white/5"
              />
              {contact.customStatus?.emoji && (
                <span className="absolute -top-1 -left-1 text-[10px] bg-[#0d0d0d] rounded-full border border-white/10 select-none px-0.5 z-10 pointer-events-none">
                  {contact.customStatus.emoji}
                </span>
              )}
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-white rounded-full border-2 border-[#0d0d0d]"></span>
              )}
              {isSidebarCollapsed && contact.unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-black font-bold text-[9px] min-w-4 h-4 rounded-full flex items-center justify-center px-1 border border-[#0d0d0d] shadow-sm">
                  {contact.unreadCount}
                </span>
              )}
            </div>

            {/* NAME / PREVIEW */}
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0 z-10 text-left">
                <p className="text-sm font-medium truncate flex items-center gap-1.5">
                  <span>{contact.fullName}</span>
                  {isBlocked && (
                    <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-1 py-0.2 rounded font-mono">
                      Blocked
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs text-zinc-400 truncate leading-none flex items-center gap-1">
                    {contact.customStatus?.emoji && <span>{contact.customStatus.emoji}</span>}
                    <span className="truncate">{isBlocked ? "Blocked" : contact.customStatus?.text || (isOnline ? "Online" : "Offline")}</span>
                  </span>
                </div>
              </div>
            )}

            {/* UNREAD BADGE (EXPANDED) */}
            {!isSidebarCollapsed && contact.unreadCount > 0 && (
              <div className="z-10 bg-white text-black font-semibold text-[10px] min-w-5 h-5 rounded-full flex items-center justify-center px-1.5 shadow-sm">
                {contact.unreadCount}
              </div>
            )}
          </div>
        );
      })}
      {searchQuery.trim() === "" ? (
        <div className="text-center py-12 px-4 flex flex-col items-center justify-center gap-2">
          <span className="text-xs text-zinc-500 font-medium leading-relaxed">
            Search for an account by name to start a conversation
          </span>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="text-center py-12 px-4 flex flex-col items-center justify-center gap-2">
          <span className="text-xs text-zinc-600">
            No contacts match your search
          </span>
        </div>
      ) : null}
    </div>
  );
}

export default ContactList;