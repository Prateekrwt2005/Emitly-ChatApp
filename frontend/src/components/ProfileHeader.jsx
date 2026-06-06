import { useState, useRef, useEffect } from "react";
import { LogOutIcon, VolumeOffIcon, Volume2Icon, ChevronLeftIcon, ChevronRightIcon, SettingsIcon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { motion, AnimatePresence } from "framer-motion";

const mouseClickSound = new Audio("/sounds/mouse-click.mp3");

function ProfileHeader() {
  const { logout, authUser, updateProfile, isSocketConnected } = useAuthStore();
  const { isSoundEnabled, toggleSound, isSidebarCollapsed, toggleSidebar } = useChatStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(authUser?.bio || "");
  const [statusEmoji, setStatusEmoji] = useState(authUser?.customStatus?.emoji || "");
  const [statusText, setStatusText] = useState(authUser?.customStatus?.text || "");

  useEffect(() => {
    if (authUser) {
      setBio(authUser.bio || "");
      setStatusEmoji(authUser.customStatus?.emoji || "");
      setStatusText(authUser.customStatus?.text || "");
    }
  }, [authUser]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await updateProfile({
      bio,
      customStatus: {
        emoji: statusEmoji,
        text: statusText,
      },
    });
    setIsEditing(false);
  };

  if (isSidebarCollapsed) {
    return (
      <div className="py-4 border-b border-white/[0.06] flex flex-col items-center gap-4 transition-all duration-300">
        {/* AVATAR */}
        <div className="relative flex-shrink-0">
          <button
            className="w-9 h-9 rounded-full overflow-hidden relative group flex-shrink-0 border border-white/10"
            onClick={() => fileInputRef.current.click()}
          >
            <img
              src={selectedImg || authUser.profilePic || "/avatar.png"}
              alt="User image"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-white text-[8px] font-medium">Edit</span>
            </div>
          </button>
          {authUser.customStatus?.emoji && (
            <span className="absolute -bottom-1 -right-1 text-xs bg-[#0d0d0d] rounded-full px-0.5 border border-white/10 pointer-events-none select-none">
              {authUser.customStatus.emoji}
            </span>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* VERTICAL ACTIONS */}
        <div className="flex flex-col gap-2 items-center">
          {/* Expand Sidebar */}
          <div className="relative group flex items-center">
            <button
              className="p-2.5 rounded-xl text-[#555] hover:text-[#ececec] hover:bg-white/5 transition-all"
              onClick={toggleSidebar}
            >
              <ChevronRightIcon className="size-5" />
            </button>
            <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-50 bg-[#121214] border border-white/10 text-sm text-zinc-300 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap shadow-lg">
              Expand Sidebar
            </div>
          </div>

          {/* Sound Toggle */}
          <div className="relative group flex items-center">
            <button
              className="p-2.5 rounded-xl text-[#555] hover:text-[#ececec] hover:bg-white/5 transition-all"
              onClick={() => {
                mouseClickSound.currentTime = 0;
                mouseClickSound.play().catch(() => {});
                toggleSound();
              }}
            >
              {isSoundEnabled ? (
                <Volume2Icon className="size-5" />
              ) : (
                <VolumeOffIcon className="size-5" />
              )}
            </button>
            <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-50 bg-[#121214] border border-white/10 text-sm text-zinc-300 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap shadow-lg">
              {isSoundEnabled ? "Mute sounds" : "Unmute sounds"}
            </div>
          </div>

          {/* Logout */}
          <div className="relative group flex items-center">
            <button
              className="p-2.5 rounded-xl text-[#555] hover:text-red-400 hover:bg-red-500/10 transition-all"
              onClick={logout}
            >
              <LogOutIcon className="size-5" />
            </button>
            <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-50 bg-[#121214] border border-white/10 text-sm text-zinc-300 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap shadow-lg">
              Logout
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 border-b border-white/[0.06] transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* AVATAR */}
          <div className="relative flex-shrink-0">
            <button
              className="w-8 h-8 rounded-full overflow-hidden relative group flex-shrink-0"
              onClick={() => fileInputRef.current.click()}
            >
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="User image"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-[9px] font-medium">Edit</span>
              </div>
            </button>
            {authUser.customStatus?.emoji && (
              <span className="absolute -bottom-1 -right-1 text-xs bg-[#0d0d0d] rounded-full px-0.5 border border-white/10 pointer-events-none select-none">
                {authUser.customStatus.emoji}
              </span>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* USERNAME */}
          <div className="min-w-0">
            <h3 className="text-[#ececec] font-medium text-sm leading-tight truncate" title={authUser.bio || undefined}>
              {authUser.fullName}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isSocketConnected ? "bg-white" : "bg-[#333]"}`} />
              <span className="text-[#555] text-xs leading-none truncate flex-1">
                {authUser.customStatus?.text || (isSocketConnected ? "Online" : "Connecting...")}
              </span>
            </div>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-0.5 items-center">
          {/* Edit Profile / Settings Cog */}
          <div className="relative group flex items-center">
            <button
              className={`p-2.5 rounded-xl transition-all ${isEditing ? "text-white bg-white/5" : "text-[#555] hover:text-[#ececec] hover:bg-white/5"}`}
              onClick={() => setIsEditing(!isEditing)}
            >
              <SettingsIcon className="size-5" />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-50 bg-[#121214] border border-white/10 text-sm text-zinc-300 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap shadow-lg">
              Edit profile status
            </div>
          </div>

          {/* Sound Toggle */}
          <div className="relative group flex items-center">
            <button
              className="p-2.5 rounded-xl text-[#555] hover:text-[#ececec] hover:bg-white/5 transition-all"
              onClick={() => {
                mouseClickSound.currentTime = 0;
                mouseClickSound.play().catch(() => {});
                toggleSound();
              }}
            >
              {isSoundEnabled ? (
                <Volume2Icon className="size-5" />
              ) : (
                <VolumeOffIcon className="size-5" />
              )}
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-50 bg-[#121214] border border-white/10 text-sm text-zinc-300 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap shadow-lg">
              {isSoundEnabled ? "Mute sounds" : "Unmute sounds"}
            </div>
          </div>

          {/* Logout */}
          <div className="relative group flex items-center">
            <button
              className="p-2.5 rounded-xl text-[#555] hover:text-red-400 hover:bg-red-500/10 transition-all"
              onClick={logout}
            >
              <LogOutIcon className="size-5" />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-50 bg-[#121214] border border-white/10 text-sm text-zinc-300 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap shadow-lg">
              Logout
            </div>
          </div>

          {/* Collapse Sidebar */}
          <div className="relative group flex items-center">
            <button
              className="p-2.5 rounded-xl text-[#555] hover:text-[#ececec] hover:bg-white/5 transition-all"
              onClick={toggleSidebar}
            >
              <ChevronLeftIcon className="size-5" />
            </button>
            <div className="absolute top-full mt-2 right-0 scale-90 origin-top-right opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-50 bg-[#121214] border border-white/10 text-sm text-zinc-300 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap shadow-lg">
              Collapse Sidebar
            </div>
          </div>
        </div>
      </div>

      {/* Inline Editing Form */}
      <AnimatePresence>
        {isEditing && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            onSubmit={handleSave}
            className="mt-4 pt-3 border-t border-white/[0.03] space-y-3 overflow-hidden text-left"
          >
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Bio</label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a bio..."
                className="w-full bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1] focus:border-white/20 transition rounded-lg px-2.5 py-1.5 text-xs text-white outline-none mt-1"
              />
            </div>
            
            <div className="flex gap-2">
              <div className="w-14">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Emoji</label>
                <input
                  type="text"
                  value={statusEmoji}
                  onChange={(e) => setStatusEmoji(e.target.value)}
                  placeholder="🚀"
                  maxLength={2}
                  className="w-full bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1] focus:border-white/20 transition rounded-lg py-1.5 text-center text-xs text-white outline-none mt-1"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Status Text</label>
                <input
                  type="text"
                  value={statusText}
                  onChange={(e) => setStatusText(e.target.value)}
                  placeholder="What's happening?"
                  className="w-full bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1] focus:border-white/20 transition rounded-lg px-2.5 py-1.5 text-xs text-white outline-none mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 rounded-md text-[10px] font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2.5 py-1 rounded-md text-[10px] font-medium text-black bg-white hover:bg-zinc-200 transition"
              >
                Save
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ProfileHeader;