import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useChatStore } from "../store/useChatStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";
import { SearchIcon } from "lucide-react";
function ChatPage() {
  const { activeTab, selectedUser, selectedGroup, isSidebarCollapsed, searchQuery, setSearchQuery } = useChatStore(
    useShallow((state) => ({
      activeTab: state.activeTab,
      selectedUser: state.selectedUser,
      selectedGroup: state.selectedGroup,
      isSidebarCollapsed: state.isSidebarCollapsed,
      searchQuery: state.searchQuery,
      setSearchQuery: state.setSearchQuery,
    }))
  );

  useEffect(() => {
    // Lock body scroll on mobile viewports to prevent keyboard/layout shifts.
    // Inner chat messages area and sidebar scroll independently.
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalBodyPosition = document.body.style.position;
      const originalBodyWidth = document.body.style.width;
      const originalBodyHeight = document.body.style.height;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalHtmlHeight = document.documentElement.style.height;

      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.height = "100%";
      document.documentElement.style.overflow = "hidden";
      document.documentElement.style.height = "100%";

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.position = originalBodyPosition;
        document.body.style.width = originalBodyWidth;
        document.body.style.height = originalBodyHeight;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.documentElement.style.height = originalHtmlHeight;
      };
    }
  }, []);

  return (
    <div className="relative w-full max-w-6xl h-[var(--vvh,100dvh)] md:h-[88vh]">
      <BorderAnimatedContainer>
        <div className="flex h-full w-full overflow-hidden">
          {/* LEFT SIDEBAR */}
          <div
            className={`bg-[#0d0d0d] flex flex-col border-r border-white/[0.06] transition-[width] duration-300
              ${isSidebarCollapsed ? "md:w-20" : "md:w-72"}
              ${(selectedUser || selectedGroup) ? "hidden md:flex" : "w-full md:flex"}
            `}
          >
            <ProfileHeader />
            <ActiveTabSwitch />
            
            {/* Search Input (Desktop/Mobile - Only visible when sidebar expanded) */}
            {!isSidebarCollapsed && (
              <div className="px-4 py-2 border-b border-white/[0.03] transition-all duration-200">
                <div className="relative flex items-center bg-white/[0.03] border border-white/[0.06] rounded-xl hover:border-white/[0.1] focus-within:border-white/20 transition-all duration-200">
                  <SearchIcon className="absolute left-3 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chats or contacts..."
                    className="w-full bg-transparent pl-9 pr-3 py-1.5 text-base md:text-sm text-white placeholder:text-zinc-600 outline-none rounded-xl"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {activeTab === "chats" ? <ChatsList /> : <ContactList />}
            </div>
          </div>

          {/* RIGHT CHAT AREA */}
          <div
            className={`flex-1 flex flex-col bg-[#050505]
              ${(selectedUser || selectedGroup) ? "flex" : "hidden md:flex"}
            `}
          >
            {selectedUser || selectedGroup ? <ChatContainer key={selectedUser?._id || selectedGroup?._id} /> : <NoConversationPlaceholder />}
          </div>
        </div>
      </BorderAnimatedContainer>
    </div>
  );
}

export default ChatPage;