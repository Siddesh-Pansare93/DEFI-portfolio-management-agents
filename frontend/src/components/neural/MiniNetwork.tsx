import React from 'react';
import { motion } from 'framer-motion';

const AGENT_COLORS = [
  '#06B6D4', // Cyan (Collector)
  '#6366F1', // Indigo (Analyzer)
  '#F59E0B', // Amber (Strategy)
  '#EF4444', // Red (Risk)
  '#8B5CF6'  // Violet (Nash)
];

export function MiniNetwork() {
  return (
    <div className="flex items-center justify-center space-x-6 py-6">
      {AGENT_COLORS.map((color, i) => (
        <React.Fragment key={`node-${i}`}>
          <motion.div
            className="relative flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: i * 0.08 + 0.2, // Staggered entrance
              ease: "easeOut"
            }}
          >
            {/* Pulsing sequence animation */}
            <motion.div
              className="absolute w-3 h-3 rounded-full"
              style={{
                backgroundColor: color,
                boxShadow: `0 0 8px 2px ${color}`,
                opacity: 0.2,
                filter: 'blur(4px)'
              }}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.6, // Sequence 1->2->3->4->5
                ease: "easeInOut"
              }}
            />
            {/* Core dot */}
            <div
              className="w-3 h-3 rounded-full z-10"
              style={{ backgroundColor: color }}
            />
          </motion.div>

          {/* Connection line between nodes */}
          {i < AGENT_COLORS.length - 1 && (
            <motion.div
              className="h-[1px] w-6 bg-white/10"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{
                duration: 0.3,
                delay: i * 0.08 + 0.25, // Appears slightly after the dot
              }}
            >
              {/* Line pulse matching the source dot's pulse */}
              <motion.div
                className="h-full w-full origin-left"
                style={{ backgroundColor: color, opacity: 0 }}
                animate={{
                  opacity: [0, 0.4, 0],
                  scaleX: [0, 1, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: "easeInOut",
                  repeatDelay: 1.5
                }}
              />
            </motion.div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}