import { useState } from "react";
import { XIcon, PlusIcon, Trash2Icon, Loader2Icon, BarChart2Icon } from "lucide-react";
import toast from "react-hot-toast";

function PollCreator({ isOpen, onClose, onSend }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length >= 10) {
      toast.error("Maximum 10 options allowed");
      return;
    }
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 2) {
      toast.error("Minimum 2 options required");
      return;
    }
    setOptions(options.filter((_, idx) => idx !== index));
  };

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    const filledOptions = options.filter(opt => opt.trim() !== "");
    if (filledOptions.length < 2) {
      toast.error("Please fill in at least 2 options");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSend({
        poll: {
          question: question.trim(),
          options: filledOptions.map(opt => ({ text: opt.trim() })),
          isAnonymous,
        }
      });
      onClose();
      // Reset state
      setQuestion("");
      setOptions(["", ""]);
      setIsAnonymous(false);
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

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300">
            <BarChart2Icon className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-semibold text-white">Create Poll</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Question */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Poll Question
            </label>
            <input
              type="text"
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all"
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Options
            </label>
            <div className="max-h-52 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    disabled={options.length <= 2}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-25 disabled:hover:bg-transparent rounded-xl transition-all"
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddOption}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-all pt-1"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Add Option</span>
            </button>
          </div>

          {/* Anonymous Settings */}
          <div className="flex items-center justify-between p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl">
            <div className="text-left">
              <span className="block text-xs font-semibold text-zinc-300">Anonymous Voting</span>
              <span className="block text-[10px] text-zinc-500">Votes will not reveal voter identity</span>
            </div>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded border-white/10 text-white focus:ring-0 bg-transparent w-4 h-4 cursor-pointer"
            />
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
              disabled={isSubmitting || !question.trim()}
              className="flex-1 bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-700 disabled:text-zinc-400 rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              {isSubmitting && <Loader2Icon className="w-4 h-4 animate-spin" />}
              Send Poll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PollCreator;
