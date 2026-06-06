import { MessageCircleIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
 
export function NoChatsFound() {
  const { setActiveTab } = useChatStore();
 
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
      <div className="w-10 h-10 bg-white/[0.04] border border-white/[0.08] rounded-full flex items-center justify-center">
        <MessageCircleIcon className="w-5 h-5 text-zinc-500" />
      </div>
      <div>
        <h4 className="text-[#acacac] text-sm font-medium mb-1">No conversations yet</h4>
        <p className="text-zinc-500 text-xs px-4">
          Start a new chat from the contacts tab
        </p>
      </div>
      <button
        onClick={() => setActiveTab("contacts")}
        className="px-3 py-1.5 text-xs text-zinc-400 bg-white/[0.04] border border-white/[0.08] rounded-lg hover:bg-white/[0.08] hover:text-[#ececec] transition-all"
      >
        Find contacts
      </button>
    </div>
  );
}
export default NoChatsFound;