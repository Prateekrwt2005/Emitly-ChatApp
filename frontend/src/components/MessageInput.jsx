import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import { 
  ImageIcon, SendIcon, XIcon, MicIcon, CameraIcon, Trash2Icon, SmileIcon, 
  Eye, EyeOff, CalendarIcon, BarChart2Icon, Loader2Icon, PlusIcon
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import CameraModal from "./CameraModal";
import EmojiPicker from "./EmojiPicker";
import PollCreator from "./PollCreator";

function MessageInput() {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isViewOnce, setIsViewOnce] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isPollOpen, setIsPollOpen] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);

  // Scheduled message states
  const [scheduledAt, setScheduledAt] = useState(null);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const shouldSendRef = useRef(true);
  const emojiPickerRef = useRef(null);
  const schedulePickerRef = useRef(null);
  const actionsMenuRef = useRef(null);

  const { sendMessage, isSoundEnabled, selectedUser, selectedGroup, replyToMessage, setReplyToMessage } = useChatStore(
    useShallow((state) => ({
      sendMessage: state.sendMessage,
      isSoundEnabled: state.isSoundEnabled,
      selectedUser: state.selectedUser,
      selectedGroup: state.selectedGroup,
      replyToMessage: state.replyToMessage,
      setReplyToMessage: state.setReplyToMessage,
    }))
  );
  const { authUser } = useAuthStore(useShallow((state) => ({ authUser: state.authUser })));
  const activeChat = selectedUser || selectedGroup;
  const isBlockedByMe = selectedUser ? authUser?.blockedUsers?.includes(selectedUser?._id) : false;

  const handleBlur = () => {
    // Reset window scroll offset to fix mobile keyboard layout viewport shifts.
    // We run this on a 50ms interval for 400ms to ensure it catches the end of the keyboard collapse animation.
    let count = 0;
    const interval = setInterval(() => {
      window.scrollTo(0, 0);
      if (document.body) document.body.scrollTop = 0;
      if (document.documentElement) document.documentElement.scrollTop = 0;
      
      count++;
      if (count > 8) {
        clearInterval(interval);
        window.dispatchEvent(new Event("resize"));
      }
    }, 50);
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (isSoundEnabled) playRandomKeyStrokeSound();

    sendMessage({ 
      text: text.trim(), 
      image: imagePreview, 
      isViewOnce,
      scheduledAt: scheduledAt || undefined
    });

    setText("");
    setImagePreview(null);
    setIsEmojiPickerOpen(false);
    setIsViewOnce(false);
    setScheduledAt(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendPoll = (pollData) => {
    sendMessage(pollData);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreview(reader.result);
            toast.success("Image pasted from clipboard");
          };
          reader.readAsDataURL(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  const handleTyping = () => {
    const socket = useAuthStore.getState().socket;
    if (!selectedUser || !socket) return;
    socket.emit("typing", { receiverId: selectedUser._id });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (socket) {
        socket.emit("stopTyping", { receiverId: selectedUser._id });
      }
    }, 800);
  };

  // Recording Logic
  const startRecording = async () => {
    chunksRef.current = [];
    shouldSendRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result;
          if (shouldSendRef.current) {
            sendMessage({ 
              audio: base64Audio, 
              isViewOnce,
              scheduledAt: scheduledAt || undefined
            });
            setIsViewOnce(false);
            setScheduledAt(null);
          }
        };
        reader.readAsDataURL(blob);
        
        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = (send = true) => {
    if (!mediaRecorderRef.current) return;
    shouldSendRef.current = send;
    clearInterval(timerRef.current);
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const formatRecordingTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  };

  // Close emoji picker and scheduler when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setIsEmojiPickerOpen(false);
      }
      if (schedulePickerRef.current && !schedulePickerRef.current.contains(event.target)) {
        setShowSchedulePicker(false);
      }
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
        setIsActionsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // Schedule handler
  const handleSetSchedule = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!scheduleDate || !scheduleTime) {
      toast.error("Please specify both date and time");
      return;
    }
    const target = new Date(`${scheduleDate}T${scheduleTime}`);
    if (target <= new Date()) {
      toast.error("Schedule time must be in the future");
      return;
    }
    setScheduledAt(target.toISOString());
    setShowSchedulePicker(false);
  };

  if (!activeChat) return null;

  return (
    <div className="relative z-30 px-3 py-4 md:px-4 bg-[#0a0a0a] border-t border-white/[0.06]">
      {/* REPLY PREVIEW */}
      {replyToMessage && (
        <div className="w-full max-w-full px-1 md:px-2 mb-2 bg-[#121214] border border-white/[0.06] rounded-xl px-3 py-2 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0 flex-1 border-l-2 border-zinc-500 pl-2">
            <div className="min-w-0 flex-1 text-left">
              <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                Replying to {replyToMessage.senderId === authUser._id || replyToMessage.senderId?._id === authUser._id ? "you" : (selectedUser?.fullName || replyToMessage.senderId?.fullName || "Member")}
              </div>
              <div className="text-xs text-zinc-300 truncate">
                {replyToMessage.text 
                  ? replyToMessage.text 
                  : replyToMessage.image 
                    ? "📷 Photo" 
                    : replyToMessage.audio 
                      ? "🎵 Voice message" 
                      : "Message"}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReplyToMessage(null)}
            className="p-1 rounded-md text-zinc-500 hover:text-white transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SCHEDULED MESSAGE BANNER */}
      {scheduledAt && (
        <div className="w-full max-w-full px-1 md:px-2 mb-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 flex items-center justify-between gap-3 animate-fadeIn select-none">
          <div className="flex items-center gap-2 text-left">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs text-amber-200">
              Message will send later: <strong className="font-semibold">{new Date(scheduledAt).toLocaleString()}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setScheduledAt(null)}
            className="p-1 rounded-md text-amber-500 hover:text-white transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}


      {/* IMAGE PREVIEW */}
      {imagePreview && (
        <div className="w-full max-w-full px-1 md:px-2 mb-3 flex items-center">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-16 h-16 object-cover rounded-xl border border-white/10"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#1e1e1e] border border-white/10 flex items-center justify-center text-[#aaa] hover:text-white transition"
              type="button"
            >
              <XIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* INPUT BAR */}
      <form onSubmit={handleSendMessage} className="w-full max-w-full px-1 md:px-2">
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl
          bg-[#1a1a1a] border transition-all ${
            isViewOnce 
              ? "border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] focus-within:border-amber-500/80" 
              : "border-white/[0.08] focus-within:border-white/20"
          }`}
        >
          {isRecording ? (
            /* RECORDING ACTIVE VIEW */
            <div className="flex-1 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm text-zinc-400 font-mono">
                  {formatRecordingTime(recordingTime)}
                </span>
              </div>
              <div className="flex-1 text-center text-xs text-zinc-600 truncate">
                Recording voice message...
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => stopRecording(false)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 transition"
                  title="Discard Recording"
                >
                  <Trash2Icon className="w-4.5 h-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => stopRecording(true)}
                  className="p-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 transition"
                  title="Send Recording"
                >
                  <SendIcon className="w-4 h-4 fill-black" />
                </button>
              </div>
            </div>
          ) : (
            /* NORMAL VIEW */
            <>
              {/* MOBILE "+" MENU (Only visible on mobile) */}
              <div ref={actionsMenuRef} className="flex md:hidden relative">
                <button
                  type="button"
                  onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
                  disabled={isBlockedByMe}
                  className={`p-1.5 rounded-lg transition-all ${
                    isActionsMenuOpen ? "text-white bg-white/10 rotate-45" : "text-zinc-400 hover:text-white"
                  }`}
                  title="More Actions"
                >
                  <PlusIcon className="w-4.5 h-4.5 transition-transform" />
                </button>

                {isActionsMenuOpen && (
                  <div className="absolute bottom-full mb-3 left-0 bg-[#0d0d0f]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 shadow-2xl z-40 min-w-[200px] flex flex-col gap-1.5 animate-fadeIn select-none">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCameraOpen(true);
                        setIsActionsMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-3.5 py-2 text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl text-left text-xs transition-all"
                    >
                      <CameraIcon className="w-4 h-4 text-zinc-500" />
                      <span>Camera Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        fileInputRef.current?.click();
                        setIsActionsMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-3.5 py-2 text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl text-left text-xs transition-all"
                    >
                      <ImageIcon className="w-4 h-4 text-zinc-500" />
                      <span>Attach Image</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsPollOpen(true);
                        setIsActionsMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-3.5 py-2 text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl text-left text-xs transition-all"
                    >
                      <BarChart2Icon className="w-4 h-4 text-zinc-500" />
                      <span>Create Poll</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowSchedulePicker(true);
                        setIsActionsMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-3.5 py-2 text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl text-left text-xs transition-all"
                    >
                      <CalendarIcon className="w-4 h-4 text-zinc-500" />
                      <span>Schedule Message</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsEmojiPickerOpen(true);
                        setIsActionsMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-3.5 py-2 text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl text-left text-xs transition-all"
                    >
                      <SmileIcon className="w-4 h-4 text-zinc-500" />
                      <span>Choose Emoji</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsViewOnce(!isViewOnce);
                        setIsActionsMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-3.5 py-2 text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl text-left text-xs transition-all"
                    >
                      {isViewOnce ? <EyeOff className="w-4 h-4 text-amber-500" /> : <Eye className="w-4 h-4 text-zinc-500" />}
                      <span>{isViewOnce ? "Disable View Once" : "Enable View Once"}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* LEFT ACTIONS GROUP (Only visible on desktop) */}
              <div className="hidden md:flex items-center gap-0.5 sm:gap-1 shrink-0">
                {/* CAMERA BUTTON */}
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  disabled={isBlockedByMe}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition disabled:opacity-20 disabled:hover:text-zinc-400"
                  title="Camera Photo"
                >
                  <CameraIcon className="w-4 h-4" />
                </button>

                {/* IMAGE BUTTON */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBlockedByMe}
                  className={`p-1.5 rounded-lg transition disabled:opacity-20 ${
                    imagePreview ? "text-white" : "text-zinc-400 hover:text-white"
                  }`}
                  title="Attach Image"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                {/* POLL CREATOR TRIGGER */}
                <button
                  type="button"
                  onClick={() => setIsPollOpen(true)}
                  disabled={isBlockedByMe}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition disabled:opacity-20 disabled:hover:text-zinc-400"
                  title="Create Poll"
                >
                  <BarChart2Icon className="w-4 h-4" />
                </button>

                {/* SCHEDULE DISPATCH TRIGGER */}
                <div ref={schedulePickerRef} className="relative flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowSchedulePicker(!showSchedulePicker)}
                    disabled={isBlockedByMe}
                    className={`p-1.5 rounded-lg transition disabled:opacity-20 ${
                      scheduledAt ? "text-amber-500 animate-pulse" : "text-zinc-400 hover:text-white"
                    }`}
                    title="Schedule Message"
                  >
                    <CalendarIcon className="w-4 h-4" />
                  </button>
                  {showSchedulePicker && (
                    <div className="absolute bottom-full mb-3 left-0 bg-[#0d0d0d] border border-white/10 rounded-2xl p-4 shadow-2xl z-40 min-w-[240px] flex flex-col gap-3 animate-fadeIn">
                      <span className="text-xs font-semibold text-zinc-300 text-left">Schedule Message</span>
                      <div className="flex flex-col gap-2">
                        <input
                          type="date"
                          required
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                        />
                        <input
                          type="time"
                          required
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-white/20"
                        />
                        <div className="flex gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => setShowSchedulePicker(false)}
                            className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-semibold text-white transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSetSchedule}
                            className="flex-1 py-1.5 bg-white text-black hover:bg-zinc-200 rounded-lg text-[10px] font-semibold transition-all"
                          >
                            Set
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* EMOJI PICKER TRIGGER */}
                <div ref={emojiPickerRef} className="relative flex items-center">
                  <button
                    type="button"
                    onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                    disabled={isBlockedByMe}
                    className={`p-1.5 rounded-lg transition disabled:opacity-20 ${
                      isEmojiPickerOpen ? "text-white" : "text-zinc-400 hover:text-white"
                    }`}
                    title="Choose Emoji"
                  >
                    <SmileIcon className="w-4 h-4" />
                  </button>
                  {isEmojiPickerOpen && (
                    <EmojiPicker onSelect={(emoji) => setText((prev) => prev + emoji)} />
                  )}
                </div>
              </div>

              {/* TEXT INPUT */}
              <input
                ref={textInputRef}
                type="text"
                value={text}
                disabled={isBlockedByMe}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="sentences"
                spellCheck="true"
                name="chat-message"
                onChange={(e) => {
                  setText(e.target.value);
                  isSoundEnabled && playRandomKeyStrokeSound();
                  handleTyping();
                }}
                onBlur={handleBlur}
                onPaste={handlePaste}
                placeholder={isBlockedByMe ? "You have blocked this user" : "Message..."}
                className="flex-1 bg-transparent outline-none text-base md:text-sm text-[#e0e0e0] placeholder:text-zinc-500 disabled:opacity-50 px-1 sm:px-2"
              />

              {/* RIGHT ACTIONS GROUP */}
              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                {/* VIEW-ONCE TOGGLE (Desktop only) */}
                <button
                  type="button"
                  onClick={() => setIsViewOnce(!isViewOnce)}
                  disabled={isBlockedByMe}
                  className={`hidden md:inline-flex p-1.5 rounded-lg transition shrink-0 disabled:opacity-20 ${
                    isViewOnce ? "text-amber-500" : "text-zinc-400 hover:text-white"
                  }`}
                  title={isViewOnce ? "View-once enabled" : "Enable view-once"}
                >
                  {isViewOnce ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>

                {/* AUDIO RECORDING TRIGGER */}
                {!text.trim() && !imagePreview && (
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={isBlockedByMe}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition disabled:opacity-20 disabled:hover:text-zinc-400"
                    title="Record Voice Note"
                  >
                    <MicIcon className="w-4 h-4" />
                  </button>
                )}

                {/* SEND BUTTON */}
                {(text.trim() || imagePreview) && (
                  <button
                    type="submit"
                    className="p-1.5 rounded-lg bg-white text-black hover:bg-[#e0e0e0] transition active:scale-95"
                  >
                    <SendIcon className="w-4 h-4 fill-black" />
                  </button>
                )}
              </div>
            </>
          )}

          {/* HIDDEN FILE INPUT */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
          />
        </div>
      </form>

      {/* CAMERA VIEWFINDER MODAL */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(imgData) => {
          sendMessage({ 
            image: imgData, 
            isViewOnce,
            scheduledAt: scheduledAt || undefined
          });
          setIsViewOnce(false);
          setScheduledAt(null);
        }}
      />

      {/* POLL CREATOR MODAL */}
      <PollCreator
        isOpen={isPollOpen}
        onClose={() => setIsPollOpen(false)}
        onSend={handleSendPoll}
      />
    </div>
  );
}

export default MessageInput;