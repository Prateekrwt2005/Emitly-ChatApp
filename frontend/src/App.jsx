import { Navigate, Route, Routes } from "react-router";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import {
  motion,
  useMotionValue,
  AnimatePresence,
} from "framer-motion";

import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import PageLoader from "./components/PageLoader";
import { useAuthStore } from "./store/useAuthStore";
import { useChatStore } from "./store/useChatStore";
import FullScreenReactionCanvas from "./components/FullScreenReactionCanvas";

function App() {
  const { checkAuth, isCheckingAuth, authUser } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e) => {
    mouseX.set(e.clientX - 200);
    mouseY.set(e.clientY - 200);
  };

  useEffect(() => {
    checkAuth();
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, [checkAuth]);

  useEffect(() => {
    const handleOnline = () => {
      useChatStore.getState().processOfflineQueue();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen relative overflow-hidden bg-[#0b0d10]"
    >
      <AnimatePresence mode="wait">
        {isCheckingAuth || showSplash ? (
          <PageLoader key="loader" />
        ) : (
          <motion.div
            key="app-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="relative w-full min-h-screen flex flex-col"
          >
            {/* Base */}
            <div className="absolute inset-0 bg-[#0b0d10]" />

            {/* Mouse Spotlight */}
            <motion.div
              style={{
                x: mouseX,
                y: mouseY,
              }}
              className="
                fixed
                w-[400px]
                h-[400px]
                rounded-full
                bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.035)_0%,transparent_70%)]
                pointer-events-none
                z-0
              "
            />

            {/* Top Glow */}
            <motion.div
              animate={{
                x: [0, 30, 0],
                y: [0, -20, 0],
                scale: [1, 1.15, 1],
                opacity: [0.08, 0.16, 0.08],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="
                absolute
                -top-60
                -left-60
                w-[900px]
                h-[900px]
                rounded-full
                bg-[radial-gradient(circle_at_center,rgba(212,212,216,0.12)_0%,transparent_70%)]
              "
            />

            {/* Bottom Glow */}
            <motion.div
              animate={{
                x: [0, -40, 0],
                y: [0, 20, 0],
                scale: [1, 1.12, 1],
                opacity: [0.05, 0.12, 0.05],
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="
                absolute
                -bottom-60
                -right-60
                w-[900px]
                h-[900px]
                rounded-full
                bg-[radial-gradient(circle_at_center,rgba(228,228,231,0.09)_0%,transparent_70%)]
              "
            />

            {/* Center Ambient Glow */}
            <motion.div
              animate={{
                scale: [1, 1.12, 1],
                opacity: [0.03, 0.08, 0.03],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="
                absolute
                top-1/2
                left-1/2
                -translate-x-1/2
                -translate-y-1/2
                w-[1400px]
                h-[700px]
                rounded-full
                bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06)_0%,transparent_70%)]
              "
            />

            {/* Grid */}
            <div
              className="
                absolute
                inset-0
                bg-[linear-gradient(to_right,rgba(255,255,255,0.012)_1px,transparent_1px),
                linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)]
                bg-[size:40px_40px]
                pointer-events-none
              "
            />

            {/* Noise */}
            <div
              className="
                absolute
                inset-0
                opacity-[0.015]
                bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)]
                bg-[size:24px_24px]
                pointer-events-none
              "
            />

            {/* Vignette */}
            <div
              className="
                absolute
                inset-0
                bg-[radial-gradient(circle_at_center,transparent_25%,rgba(0,0,0,0.7)_100%)]
                pointer-events-none
              "
            />

            {/* Content */}
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                duration: 0.8,
              }}
              className="relative z-10 min-h-screen flex items-center justify-center p-0 md:p-6"
            >
              <Routes>
                <Route
                  path="/"
                  element={authUser ? <ChatPage /> : <Navigate to="/login" />}
                />

                <Route
                  path="/login"
                  element={!authUser ? <LoginPage /> : <Navigate to="/" />}
                />

                <Route
                  path="/signup"
                  element={!authUser ? <SignUpPage /> : <Navigate to="/" />}
                />
              </Routes>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <FullScreenReactionCanvas />

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#16181d",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px",
            backdropFilter: "blur(10px)",
          },
        }}
      />
    </div>
  );
}

export default App;