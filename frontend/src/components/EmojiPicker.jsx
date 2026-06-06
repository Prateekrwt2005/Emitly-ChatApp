import { useState } from "react";

const EMOJI_CATEGORIES = [
  {
    id: "smileys",
    name: "Smileys & People",
    icon: "😀",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", 
      "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", 
      "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", 
      "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", 
      "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐",
      "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕"
    ]
  },
  {
    id: "gestures",
    name: "Hearts & Hands",
    icon: "❤️",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", 
      "💘", "💝", "💟", "👍", "👎", "✊", "👊", "🤛", "🤜", "🤝", "🙌", "👐", "🤲", "👏", "👋", "🖐️", 
      "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️",
      "✍️", "🤳", "🙏"
    ]
  },
  {
    id: "nature",
    name: "Animals & Nature",
    icon: "🐶",
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", 
      "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", 
      "🐜", "🕷️", "🐢", "🐍", "🦎", "🐙", "🦑", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", 
      "🐊", "🐅", "🐆", "🦓", "🦍", "🐘", "🦛", "🦏", "🐪", "🐫", "🦒", "🦘", "🐃", "🐂", "🐄", "🐎", 
      "🌱", "🌲", "🌳", "🌴", "🌵", "🌾", "🌿", "🍀", "🍁", "🍂", "🍃"
    ]
  },
  {
    id: "food",
    name: "Food & Drink",
    icon: "🍏",
    emojis: [
      "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", 
      "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🌽", "🥕", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🥨", 
      "🧀", "🥚", "🍳", "🥞", "🥓", "🥩", "🌭", "🍔", "🍟", "🍕", "🥪", "🌮", "🌯", "🥗", "🥘", "🍝", 
      "🍜", "🍲", "🍛", "🍣", "🍱", "🥟", "🍤", "🍙", "🍨", "🍦", "🥧", "🍰", "🎂", "🍮", "🍭", "🍬", 
      "🍫", "🍿", "🍩", "🍪", "🍺", "🍻", "🥂", "🍷", "🥃", "🍹", "🥤"
    ]
  }
];

function EmojiPicker({ onSelect }) {
  const [activeTab, setActiveTab] = useState("smileys");

  const currentCategory = EMOJI_CATEGORIES.find((cat) => cat.id === activeTab) || EMOJI_CATEGORIES[0];

  return (
    <div className="absolute bottom-full mb-3 right-0 md:left-0 md:right-auto z-50 bg-[#0d0d10]/95 border border-white/10 rounded-2xl w-[280px] h-[310px] shadow-2xl flex flex-col p-3 backdrop-blur-xl select-none animate-in fade-in slide-in-from-bottom-2 duration-150">
      
      {/* TABS HEADER */}
      <div className="flex justify-between items-center border-b border-white/[0.06] pb-2 mb-2 flex-shrink-0">
        <div className="flex gap-1">
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab(cat.id);
              }}
              className={`w-7.5 h-7.5 text-base flex items-center justify-center rounded-lg hover:bg-white/5 transition-all ${
                activeTab === cat.id ? "bg-white/10 text-white" : "text-zinc-500"
              }`}
              title={cat.name}
            >
              {cat.icon}
            </button>
          ))}
        </div>
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold truncate max-w-[120px]">
          {currentCategory.name}
        </span>
      </div>

      {/* EMOJIS GRID */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-7 gap-1.5 justify-items-center">
          {currentCategory.emojis.map((emoji, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(emoji);
              }}
              className="w-8 h-8 text-lg flex items-center justify-center rounded-lg hover:bg-white/10 active:scale-90 transition-all"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EmojiPicker;
