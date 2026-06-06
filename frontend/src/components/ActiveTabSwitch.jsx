import { motion } from "framer-motion";
import { MessageSquareIcon, UsersIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

function ActiveTabSwitch() {
  const { activeTab, setActiveTab, isSidebarCollapsed } = useChatStore();

  if (isSidebarCollapsed) {
    return (
      <div className="flex flex-col gap-2 px-2 py-3 border-b border-white/[0.06] items-center">
        {[
          { id: "chats", icon: MessageSquareIcon, label: "Chats" },
          { id: "contacts", icon: UsersIcon, label: "Contacts" },
        ].map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          return (
            <div key={id} className="relative group flex items-center">
              <button
                onClick={() => setActiveTab(id)}
                className={`relative p-2 rounded-xl transition-all ${
                  isActive ? "text-white" : "text-[#555] hover:text-[#888]"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-white/10 rounded-xl"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="size-4 relative z-10" />
              </button>
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-50 bg-[#121214] border border-white/10 text-sm text-zinc-300 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap shadow-lg">
                {label}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex gap-1 px-4 py-2.5 border-b border-white/[0.06]">
      {["chats", "contacts"].map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative flex-1 py-2 md:py-1.5 text-sm md:text-xs font-medium rounded-lg capitalize transition-all ${
              isActive ? "text-white" : "text-[#555] hover:text-[#888]"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-white/10 rounded-lg"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab}</span>
          </button>
        );
      })}
    </div>
  );
}

export default ActiveTabSwitch;