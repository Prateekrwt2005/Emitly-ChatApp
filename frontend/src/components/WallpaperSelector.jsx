import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

const WALLPAPER_OPTIONS = [
  { id: "default", name: "Default Grid", class: "bg-[#050505] bg-[linear-gradient(to_right,rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:40px_40px]" },
  { id: "graphite", name: "Deep Graphite", class: "bg-[#0d0f12]" },
  { id: "solid-dark", name: "Solid Dark", class: "bg-[#000]" },
  { id: "violet-glow", name: "Violet Nebula", class: "bg-[#06040a] bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.08)_0%,transparent_75%)]" },
  { id: "bronze-glow", name: "Warm Amber", class: "bg-[#080604] bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.07)_0%,transparent_75%)]" },
  { id: "forest-mesh", name: "Emerald Mesh", class: "bg-[#040605] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0%,transparent_75%)]" }
];

const ACCENT_THEME_OPTIONS = [
  { id: "sky", name: "Sky Blue", color: "bg-[#0ea5e9]" },
  { id: "violet", name: "Violet Glow", color: "bg-[#8b5cf6]" },
  { id: "emerald", name: "Emerald Green", color: "bg-[#10b981]" },
  { id: "amber", name: "Amber Orange", color: "bg-[#f59e0b]" },
  { id: "crimson", name: "Crimson Red", color: "bg-[#ef4444]" },
];

function WallpaperSelector({ isOpen, onClose }) {
  const { chatWallpaper, setChatWallpaper, themeAccent, setThemeAccent } = useChatStore();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="relative w-full max-w-md bg-[#0d0d0f] border border-white/10 rounded-2xl p-5 shadow-2xl z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06] mb-4">
            <h3 className="text-white text-base font-semibold">Chat Customizer</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Wallpaper Options Grid */}
          <div>
            <h4 className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-2.5 text-left">Chat Wallpaper</h4>
            <div className="grid grid-cols-2 gap-3">
              {WALLPAPER_OPTIONS.map((opt) => {
                const isSelected = chatWallpaper === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setChatWallpaper(opt.id)}
                    className={`relative h-24 rounded-xl border-2 text-left p-3 overflow-hidden flex flex-col justify-end transition-all ${
                      isSelected ? "border-white shadow-lg" : "border-white/5 hover:border-white/20"
                    }`}
                  >
                    {/* Wallpaper Background Preview */}
                    <div className={`absolute inset-0 -z-10 ${opt.class}`} />

                    {/* Glass Card Name */}
                    <div className="flex items-center justify-between w-full bg-black/40 backdrop-blur-md px-2 py-1.5 rounded-lg border border-white/5">
                      <span className="text-[10px] font-medium text-zinc-300 truncate max-w-[80%]">
                        {opt.name}
                      </span>
                      {isSelected && (
                        <Check className="w-3 h-3 text-white flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent Theme Picker */}
          <div className="mt-5 pt-4 border-t border-white/[0.06]">
            <h4 className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-2.5 text-left">Theme Accent</h4>
            <div className="flex gap-3 items-center">
              {ACCENT_THEME_OPTIONS.map((opt) => {
                const isSelected = themeAccent === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setThemeAccent(opt.id)}
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all ${opt.color} hover:scale-110 active:scale-95 border-2 ${
                      isSelected ? "border-white scale-110 shadow-lg" : "border-transparent"
                    }`}
                    title={opt.name}
                  >
                    {isSelected && (
                      <Check className="w-4 h-4 text-black font-extrabold drop-shadow" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action button */}
          <div className="flex justify-end mt-5 pt-3 border-t border-white/[0.06]">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-black bg-white hover:bg-zinc-200 transition active:scale-95"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default WallpaperSelector;
