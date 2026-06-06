import { useEffect, useRef, useState } from "react";
import { CameraIcon, XIcon, RefreshCwIcon, SendIcon } from "lucide-react";
import toast from "react-hot-toast";

function CameraModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState("user"); // "user" or "environment"
  const [capturedImg, setCapturedImg] = useState(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Check if multiple camera devices exist
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      if (videoDevices.length > 1) {
        setHasMultipleCameras(true);
      }
    });
  }, []);

  // Initialize camera stream
  useEffect(() => {
    if (!isOpen) return;

    let activeStream = null;

    async function startCamera() {
      // Clear existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      setCapturedImg(null);

      try {
        const constraints = {
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false, // video message only, no mic capture for photos
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        activeStream = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
        toast.error("Could not access camera. Please check permissions.");
        onClose();
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, facingMode, onClose]);

  if (!isOpen) return null;

  // Toggle camera direction
  const switchCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  // Capture frame to canvas
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    // Create offscreen canvas matching video stream dimensions
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flip horizontal if it's the front camera (user facing) for selfie mirror effect
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImg(dataUrl);

    // Stop stream tracks since picture is taken
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImg(null);
    setFacingMode("user"); // reset facingMode
  };

  // Send photo
  const handleSend = () => {
    if (!capturedImg) return;
    onCapture(capturedImg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg bg-[#0d0d0f] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold tracking-tight text-white">Capture Photo</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* VIEWFINDER / PREVIEW */}
        <div className="relative aspect-video bg-[#050505] flex items-center justify-center overflow-hidden">
          {!capturedImg ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
            />
          ) : (
            <img src={capturedImg} alt="Captured" className="w-full h-full object-cover" />
          )}

          {/* Facing Camera Switch Indicator */}
          {!capturedImg && hasMultipleCameras && (
            <button
              onClick={switchCamera}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 border border-white/10 text-white hover:bg-black/80 transition"
              title="Switch Camera"
            >
              <RefreshCwIcon className="w-4 h-4 animate-spin-slow" />
            </button>
          )}
        </div>

        {/* CONTROLS */}
        <div className="flex items-center justify-center p-6 border-t border-white/[0.06] bg-[#09090b]">
          {!capturedImg ? (
            /* CAPTURE BUTTON */
            <button
              onClick={takeSnapshot}
              className="w-16 h-16 rounded-full border-4 border-white bg-transparent hover:bg-white/10 active:scale-90 transition-all flex items-center justify-center shadow-lg"
            >
              <div className="w-12 h-12 rounded-full bg-white hover:bg-zinc-200 transition" />
            </button>
          ) : (
            /* RETAKE / SEND ACTIONS */
            <div className="flex items-center gap-4 w-full">
              <button
                onClick={handleRetake}
                className="flex-1 py-3 text-xs font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition active:scale-95"
              >
                Retake
              </button>
              <button
                onClick={handleSend}
                className="flex-1 py-3 text-xs font-semibold text-black bg-white hover:bg-zinc-200 rounded-xl transition active:scale-95 flex items-center justify-center gap-2"
              >
                <SendIcon className="w-3.5 h-3.5" />
                Send Photo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CameraModal;
