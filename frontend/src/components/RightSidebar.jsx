import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { X, ImageIcon, Music, Link as LinkIcon, ExternalLink } from "lucide-react";
import CustomAudioPlayer from "./CustomAudioPlayer";

function RightSidebar() {
  const { messages, toggleRightSidebar } = useChatStore();
  const [activeTab, setActiveTab] = useState("media"); // "media" | "audio" | "links"

  // Filter Photos
  const photos = messages.filter((m) => m.image);

  // Filter Audio
  const audios = messages.filter((m) => m.audio);

  // Filter Links
  const linkMessages = messages.filter((m) => {
    if (!m.text) return false;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return urlRegex.test(m.text);
  });

  const extractLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  const allLinks = linkMessages.flatMap((m) => 
    extractLinks(m.text).map((url) => ({
      url,
      createdAt: m.createdAt,
    }))
  );

  return (
    <div className="w-full bg-[#0a0a0c] flex flex-col shrink-0">
      {/* HEADER */}
      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white tracking-wide">Shared Details</h3>
        <button
          onClick={toggleRightSidebar}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* TABS */}
      <div className="flex border-b border-white/[0.06] p-1 bg-black/20">
        <button
          onClick={() => setActiveTab("media")}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "media"
              ? "bg-[#161618] text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Photos ({photos.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("audio")}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "audio"
              ? "bg-[#161618] text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>Audio ({audios.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("links")}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "links"
              ? "bg-[#161618] text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Links ({allLinks.length})</span>
        </button>
      </div>

      {/* CONTENT SCROLL AREA */}
      <div className="max-h-[280px] overflow-y-auto p-4 custom-scrollbar">
        {/* PHOTOS TAB */}
        {activeTab === "media" && (
          <>
            {photos.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                {photos.map((m) => (
                  <div key={m._id} className="relative group overflow-hidden rounded-xl border border-white/5 aspect-square bg-white/5">
                    <img
                      src={m.image}
                      alt="Shared Media"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <a
                      href={m.image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-medium"
                    >
                      View Full
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center gap-2 py-12">
                <ImageIcon className="w-8 h-8 text-zinc-700" />
                <p className="text-xs text-zinc-500">No shared photos</p>
              </div>
            )}
          </>
        )}

        {/* AUDIO TAB */}
        {activeTab === "audio" && (
          <>
            {audios.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {audios.map((m) => (
                  <div key={m._id} className="bg-[#121214] border border-white/[0.04] p-2.5 rounded-xl flex flex-col gap-1.5">
                    <CustomAudioPlayer src={m.audio} isMe={false} />
                    <span className="text-[10px] text-zinc-600 self-end">
                      {new Date(m.createdAt).toLocaleDateString()} at {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center gap-2 py-12">
                <Music className="w-8 h-8 text-zinc-700" />
                <p className="text-xs text-zinc-500">No voice recordings</p>
              </div>
            )}
          </>
        )}

        {/* LINKS TAB */}
        {activeTab === "links" && (
          <>
            {allLinks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {allLinks.map((item, idx) => {
                  let hostname = "Link";
                  try {
                    hostname = new URL(item.url).hostname;
                  } catch (e) {
                    // fallback
                  }
                  return (
                    <a
                      key={idx}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col gap-1.5 p-3 rounded-xl bg-[#121214] border border-white/[0.04] hover:bg-[#161618] hover:border-white/10 transition text-left"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-white truncate max-w-[170px] group-hover:text-amber-400 transition-colors">
                          {hostname}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition" />
                      </div>
                      <span className="text-[11px] text-zinc-500 truncate w-full">
                        {item.url}
                      </span>
                      <span className="text-[9px] text-zinc-700 self-end">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center gap-2 py-12">
                <LinkIcon className="w-8 h-8 text-zinc-700" />
                <p className="text-xs text-zinc-500">No shared links</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default RightSidebar;
