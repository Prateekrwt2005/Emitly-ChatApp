import { motion } from "framer-motion";
import { useEffect, useState } from "react";

function BorderAnimatedContainer({ children }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    setIsMobile(mediaQuery.matches);
    const handler = (e) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return (
    <div className="relative w-full h-full rounded-none md:rounded-[32px] overflow-hidden p-0 md:p-[1.5px] transition-all duration-300">

      {/* Rotating Conic Glowing Border */}
      {!isMobile && (
        <div
          style={{
            background: "conic-gradient(from var(--border-angle), transparent 20%, rgba(255, 255, 255, 0.45) 50%, transparent 80%)",
          }}
          className="
          absolute
          inset-0
          rounded-none
          md:rounded-[32px]
          animate-border
          "
        />
      )}

      {/* Metallic Outer Border Base */}
      {!isMobile && (
        <div
          className="
          absolute
          inset-0
          rounded-none
          md:rounded-[32px]
          bg-gradient-to-b
          from-white/10
          via-white/2
          to-white/5
          -z-10
          "
        />
      )}

      {/* Moving Shine */}
      {!isMobile && (
        <motion.div
          animate={{
            x: ["-150%", "250%"],
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="
          absolute
          top-0
          left-0
          h-full
          w-[300px]
          bg-[linear-gradient(to_right,transparent,rgba(255,255,255,0.015)_20%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.015)_80%,transparent)]
          pointer-events-none
          "
        />
      )}

      {/* Main Card */}
      <div
        className="
        relative
        h-full
        w-full
        rounded-none
        md:rounded-[32px]
        overflow-hidden

        bg-[#070708]/95

        border
        border-white/[0.08]

        backdrop-blur-2xl

        shadow-[0_50px_120px_rgba(0,0,0,0.95)]
        "
      >
        {children}
      </div>
    </div>
  );
}

export default BorderAnimatedContainer;