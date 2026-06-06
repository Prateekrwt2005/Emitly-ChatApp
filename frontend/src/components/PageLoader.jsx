import { motion } from "framer-motion";
import { MessageCircleIcon } from "lucide-react";

function PageLoader() {
  const letters = "emitly".split("");

  // Staggered letters variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.4,
      },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 180,
        damping: 15,
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] bg-[#070709] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background radial glowing gradients */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-white/[0.02] blur-[150px] pointer-events-none" />
      <div className="absolute w-[250px] h-[250px] rounded-full bg-zinc-300/[0.01] blur-[80px] pointer-events-none translate-y-[-50px]" />

      <div className="relative flex flex-col items-center z-10">
        
        {/* Animated Glowing Logo Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-6"
        >
          {/* Pulsing Back Glow */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 bg-white/20 rounded-2xl blur-xl"
          />

          <div className="relative w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-md">
            <MessageCircleIcon className="w-7 h-7 text-white" />
          </div>
        </motion.div>

        {/* Staggered text "emitly" */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex items-center gap-1.5 mb-8"
        >
          {letters.map((char, index) => (
            <motion.span
              key={index}
              variants={letterVariants}
              className="text-2xl font-bold tracking-tight text-white lowercase select-none"
            >
              {char}
            </motion.span>
          ))}
        </motion.div>

        {/* Loading Progress Bar Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="w-40 h-[3px] bg-white/10 rounded-full overflow-hidden"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{
              duration: 1.8,
              ease: "easeInOut",
              delay: 0.2,
            }}
            className="h-full bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.5)]"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

export default PageLoader;