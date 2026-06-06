import { MessageCircleIcon } from "lucide-react";


export const NoConversationPlaceholder = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <div className="w-14 h-14 bg-white/[0.04] border border-white/[0.08] rounded-full flex items-center justify-center mb-4">
        <MessageCircleIcon className="size-7 text-zinc-600" />
      </div>
      <h3 className="text-sm font-medium text-[#acacac] mb-1.5">Select a conversation</h3>
      <p className="text-zinc-500 text-xs max-w-xs">
        Choose a contact from the sidebar to start chatting.
      </p>
    </div>
  );
};
export default NoConversationPlaceholder;
 