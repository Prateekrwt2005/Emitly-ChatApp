import { useEffect, useRef, useState } from "react";
import { PlayIcon, PauseIcon } from "lucide-react";

function CustomAudioPlayer({ src, isMe }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    if (audio.readyState >= 1) {
      setDuration(audio.duration || 0);
    }

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [src]);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    const seekTime = parseFloat(e.target.value);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const waveHeights = [
    6, 12, 16, 8, 4, 10, 14, 18, 12, 6, 8, 14, 16, 10, 6, 12, 18, 8, 4, 12, 16, 10
  ];

  const progressPercentage = duration > 0 ? (currentTime / duration) : 0;
  const activeBarsCount = Math.floor(progressPercentage * waveHeights.length);

  return (
    <div className={`flex items-center gap-3 py-2 px-3 rounded-2xl w-[260px] max-w-full select-none ${
      isMe 
        ? "bg-black/[0.04] border border-black/[0.08]" 
        : "bg-white/5 border border-white/[0.06]"
    }`}>
      {/* PLAY/PAUSE */}
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition flex-shrink-0 ${
          isMe ? "bg-black text-white hover:bg-zinc-800" : "bg-white text-black hover:bg-zinc-200"
        }`}
      >
        {isPlaying ? (
          <PauseIcon className={`w-4 h-4 ${isMe ? "fill-white" : "fill-black"}`} />
        ) : (
          <PlayIcon className={`w-4 h-4 translate-x-[1px] ${isMe ? "fill-white" : "fill-black"}`} />
        )}
      </button>

      {/* WAVEFORM & PROGRESS */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <div className="flex items-end gap-[2.5px] h-6 mb-1.5 px-0.5 justify-center">
          {waveHeights.map((height, idx) => {
            const isActive = idx < activeBarsCount;
            return (
              <div
                key={idx}
                style={{ height: `${height}px` }}
                className={`w-[3px] rounded-full transition-colors duration-150 ${
                  isActive 
                    ? isPlaying 
                      ? `${isMe ? "bg-black" : "bg-white"} animate-pulse` 
                      : `${isMe ? "bg-black" : "bg-white"}` 
                    : `${isMe ? "bg-black/10" : "bg-white/15"}`
                }`}
              />
            );
          })}
        </div>

        {/* SLIDER */}
        <div className="relative flex items-center w-full">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className={`w-full h-1 rounded-lg appearance-none cursor-pointer outline-none focus:outline-none ${
              isMe ? "accent-black" : "accent-white"
            }`}
            style={{
              background: isMe
                ? `linear-gradient(to right, rgba(0,0,0,0.65) ${progressPercentage * 100}%, rgba(0,0,0,0.06) ${progressPercentage * 100}%)`
                : `linear-gradient(to right, rgba(255,255,255,0.7) ${progressPercentage * 100}%, rgba(255,255,255,0.1) ${progressPercentage * 100}%)`
            }}
          />
        </div>

        {/* TIMERS */}
        <div className={`flex justify-between items-center text-[10px] mt-1 font-mono ${
          isMe ? "text-zinc-600" : "text-zinc-500"
        }`}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}

export default CustomAudioPlayer;
