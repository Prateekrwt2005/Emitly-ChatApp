import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { X, Search } from "lucide-react";

function ForwardModal({ isOpen, onClose, messageToForward }) {
  const { allContacts, getAllContacts, forwardMessage, isUsersLoading } = useChatStore();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      getAllContacts();
    }
  }, [isOpen, getAllContacts]);

  if (!isOpen) return null;

  const filteredContacts = allContacts.filter((contact) =>
    contact.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleForward = async (recipientId) => {
    try {
      await forwardMessage(recipientId, messageToForward);
      onClose();
    } catch (error) {
      // Error handles in store
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Modal Card */}
      <div className="w-full max-w-md bg-[#0a0a0c] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl flex flex-col mx-4 max-h-[500px]">
        {/* Header */}
        <div className="px-4 py-3 bg-[#0d0d0f] border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="text-white text-sm font-semibold">Forward Message</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-white/[0.03] bg-[#09090b]">
          <div className="relative flex items-center bg-white/[0.03] border border-white/[0.06] rounded-xl hover:border-white/[0.1] focus-within:border-white/20 transition-all duration-200">
            <Search className="absolute left-3 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="w-full bg-transparent pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none rounded-xl"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto p-2 bg-[#050507]">
          {isUsersLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-zinc-500">
              <span className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
              <span className="text-xs">Loading contacts...</span>
            </div>
          ) : filteredContacts.length > 0 ? (
            <div className="flex flex-col gap-1">
              {filteredContacts.map((contact) => (
                <div
                  key={contact._id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={contact.profilePic || "/avatar.png"}
                      alt={contact.fullName}
                      className="w-8 h-8 rounded-full object-cover border border-white/10"
                    />
                    <span className="text-zinc-200 text-sm font-medium truncate">
                      {contact.fullName}
                    </span>
                  </div>
                  <button
                    onClick={() => handleForward(contact._id)}
                    className="px-3 py-1.5 bg-white text-black hover:bg-zinc-200 rounded-lg text-xs font-semibold transition-colors active:scale-95"
                  >
                    Send
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-zinc-600">
              No contacts found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForwardModal;
