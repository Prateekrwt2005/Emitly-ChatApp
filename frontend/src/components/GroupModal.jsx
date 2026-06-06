import { useState, useEffect } from "react";
import { XIcon, CameraIcon, Loader2Icon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

function GroupModal({ isOpen, onClose }) {
  const { chats, getMyChatPartners, createGroup } = useChatStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatar, setAvatar] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getMyChatPartners();
    }
  }, [isOpen, getMyChatPartners]);

  if (!isOpen) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result);
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleToggleMember = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await createGroup({
        name: name.trim(),
        description: description.trim(),
        avatar,
        members: selectedMembers,
      });
      onClose();
      // Reset state
      setName("");
      setDescription("");
      setAvatar("");
      setAvatarPreview("");
      setSelectedMembers([]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
        >
          <XIcon className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold text-white mb-5">Create New Channel</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="relative group cursor-pointer">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center transition-all group-hover:border-white/20">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <CameraIcon className="w-8 h-8 text-zinc-500 group-hover:text-zinc-300 transition-all" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <span className="text-xs text-zinc-500">Upload Channel Icon</span>
          </div>

          {/* Group Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Channel Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Project Alpha, Design Sync"
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all"
            />
          </div>

          {/* Group Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this channel about?"
              rows={2}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all resize-none"
            />
          </div>

          {/* Select Members */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Select Members ({selectedMembers.length})
            </label>
            <div className="max-h-40 overflow-y-auto border border-white/[0.06] rounded-xl divide-y divide-white/[0.04] bg-white/[0.01]">
              {chats.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-600">
                  No active chats available to add
                </div>
              ) : (
                chats.map((contact) => {
                  const isChecked = selectedMembers.includes(contact._id);
                  return (
                    <div
                      key={contact._id}
                      onClick={() => handleToggleMember(contact._id)}
                      className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/[0.02] transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={contact.profilePic || "/avatar.png"}
                          alt={contact.fullName}
                          className="w-8 h-8 rounded-full object-cover border border-white/5"
                        />
                        <span className="text-sm text-zinc-300 font-medium">{contact.fullName}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by div click
                        className="rounded border-white/10 text-white focus:ring-0 bg-transparent w-4 h-4 cursor-pointer"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl py-2.5 text-sm font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-700 disabled:text-zinc-400 rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              {isSubmitting && <Loader2Icon className="w-4 h-4 animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GroupModal;
