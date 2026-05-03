"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, BrainCircuit } from "lucide-react";

interface JarvisButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function JarvisButton({ onClick, isLoading = false, disabled = false }: JarvisButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full group overflow-hidden rounded-2xl disabled:opacity-50 cursor-pointer"
      whileTap={{ scale: 0.97 }}
    >
      {/* Animated gradient border */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        animate={{
          background: isHovered
            ? "linear-gradient(135deg, rgba(139,92,246,0.6), rgba(99,102,241,0.4), rgba(6,182,212,0.3))"
            : "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(99,102,241,0.15), rgba(139,92,246,0.3))",
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Inner button */}
      <div className="relative m-[1px] rounded-2xl bg-[#0A0A0F]/95 backdrop-blur-xl px-6 py-5 flex items-center justify-center gap-4 overflow-hidden">

        {/* Scanning particles on hover */}
        <AnimatePresence>
          {isHovered && !isLoading && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-violet-400"
                  initial={{ opacity: 0, x: i % 2 === 0 ? -100 : 100, y: Math.random() * 40 - 20 }}
                  animate={{
                    opacity: [0, 1, 0],
                    x: i % 2 === 0 ? [- 100, 100] : [100, -100],
                  }}
                  transition={{
                    duration: 1.2,
                    delay: i * 0.3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{ top: `${30 + i * 15}%`, filter: "blur(1px)" }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="flex items-center gap-3 relative z-10">
            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
            <span className="text-white font-semibold text-sm tracking-wide">Deploying Agents...</span>
          </div>
        ) : (
          <div className="flex items-center gap-4 relative z-10">

            {/* Brain icon — splits and assembles */}
            <div className="relative w-10 h-10 flex items-center justify-center">
              {/* Left half (clipped) */}
              <motion.div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: "inset(0 50% 0 0)" }}
                animate={{ x: isHovered ? 0 : -8, opacity: isHovered ? 1 : 0.3 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <BrainCircuit className="w-10 h-10 text-violet-400" />
              </motion.div>

              {/* Right half (clipped) */}
              <motion.div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: "inset(0 0 0 50%)" }}
                animate={{ x: isHovered ? 0 : 8, opacity: isHovered ? 1 : 0.3 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <BrainCircuit className="w-10 h-10 text-violet-400" />
              </motion.div>

              {/* Center glow on assembly */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                animate={{
                  opacity: isHovered ? 1 : 0,
                  scale: isHovered ? 1 : 0.5,
                }}
                transition={{ duration: 0.25, delay: isHovered ? 0.15 : 0 }}
              >
                <div className="w-4 h-4 rounded-full bg-violet-500/50 blur-[8px]" />
              </motion.div>

              {/* Orbiting ring on hover */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    className="absolute inset-[-6px] rounded-full border border-violet-500/30 pointer-events-none"
                    initial={{ opacity: 0, scale: 0.6, rotate: 0 }}
                    animate={{ opacity: 1, scale: 1, rotate: 360 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{
                      opacity: { duration: 0.2 },
                      scale: { duration: 0.3, type: "spring", stiffness: 300 },
                      rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                    }}
                    style={{
                      background: "conic-gradient(from 0deg, transparent 60%, rgba(139,92,246,0.4) 80%, transparent 100%)",
                    }}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Text */}
            <div className="flex flex-col items-start">
              <motion.span
                className="text-white font-semibold text-sm tracking-wide"
                animate={{ letterSpacing: isHovered ? "0.06em" : "0.02em" }}
                transition={{ duration: 0.3 }}
              >
                Start AI Analysis
              </motion.span>
              <motion.span
                className="text-white/30 text-[10px] tracking-wider uppercase"
                animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 4 }}
                transition={{ duration: 0.2, delay: isHovered ? 0.1 : 0 }}
              >
                Deploy 5 Neural Agents
              </motion.span>
            </div>

            {/* Arrow */}
            <motion.div
              animate={{ x: isHovered ? 4 : 0, opacity: isHovered ? 1 : 0.4 }}
              transition={{ duration: 0.2 }}
            >
              <ArrowRight className="w-4 h-4 text-violet-400" />
            </motion.div>
          </div>
        )}
      </div>

      {/* Bottom glow line */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] rounded-full pointer-events-none"
        animate={{
          background: isHovered
            ? "linear-gradient(90deg, transparent, #8B5CF6, transparent)"
            : "linear-gradient(90deg, transparent, rgba(139,92,246,0.15), transparent)",
          boxShadow: isHovered ? "0 0 20px 2px rgba(139,92,246,0.4)" : "none",
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
}
