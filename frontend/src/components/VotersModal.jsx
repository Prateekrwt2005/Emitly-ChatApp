import { X } from "lucide-react";

function VotersModal({ isOpen, onClose, poll }) {
  if (!isOpen || !poll) return null;

  const totalVotes = poll.options?.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Modal Card */}
      <div className="w-full max-w-md bg-[#0a0a0c] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl flex flex-col mx-4 max-h-[500px]">
        {/* Header */}
        <div className="px-4 py-3 bg-[#0d0d0f] border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-white text-sm font-semibold">Poll Results</h3>
            <span className="text-[10px] text-zinc-500">
              {totalVotes} vote{totalVotes === 1 ? "" : "s"} • {poll.isAnonymous ? "Anonymous" : "Public"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#050507]">
          <h4 className="text-zinc-200 text-sm font-medium mb-4 leading-snug">
            {poll.question}
          </h4>

          {poll.isAnonymous ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2.5 text-zinc-500">
              <span className="text-2xl">🔒</span>
              <span className="text-xs text-center px-4">
                This poll is anonymous. Voter identities are hidden.
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {poll.options.map((opt) => {
                const votesCount = opt.votes?.length || 0;
                const percent = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;

                return (
                  <div
                    key={opt._id}
                    className="border border-white/[0.05] bg-white/[0.02] p-3.5 rounded-xl flex flex-col gap-2.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-200 font-semibold text-xs truncate max-w-[250px]">
                        {opt.text}
                      </span>
                      <span className="text-[10px] text-zinc-400 bg-white/5 px-2.5 py-0.5 rounded-full font-mono">
                        {percent}% ({votesCount})
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {votesCount > 0 ? (
                        opt.votes.map((voter) => {
                          const isPopulated = typeof voter === "object" && voter !== null;
                          const name = isPopulated ? (voter.fullName || "Member") : "Member";
                          const pic = isPopulated ? (voter.profilePic || "/avatar.png") : "/avatar.png";

                          return (
                            <div
                              key={isPopulated ? voter._id : voter}
                              className="flex items-center gap-2.5 py-1 px-1.5 rounded-lg hover:bg-white/[0.03] transition-colors"
                            >
                              <img
                                src={pic}
                                alt={name}
                                className="w-6 h-6 rounded-full object-cover border border-white/10"
                              />
                              <span className="text-zinc-300 text-xs font-medium">
                                {name}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-zinc-600 text-[10px] italic pl-1.5 py-0.5">
                          No votes yet
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VotersModal;
