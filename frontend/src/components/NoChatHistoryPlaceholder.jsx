import { MessageCircleIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
 
export const NoChatHistoryPlaceholder = ({ name }) => {
  const { sendMessage } = useChatStore();
 
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
        <MessageCircleIcon className="size-6 text-zinc-500" />
      </div>
      <h3 className="text-sm font-medium text-[#ececec] mb-2">
        Start chatting with {name}
      </h3>
      <p className="text-zinc-500 text-xs max-w-xs mb-5">
        This is the beginning of your conversation. Send a message to get started.
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {["👋 Hello", "🤝 How are you?", "📅 Meet up soon?"].map((label) => (
          <button
            key={label}
            onClick={() => sendMessage({ text: label })}
            className="px-3 py-1.5 text-xs text-zinc-400 bg-white/[0.04] border border-white/[0.08] rounded-lg hover:bg-white/[0.08] hover:text-[#ececec] transition-all active:scale-95"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
export default NoChatHistoryPlaceholder;
 