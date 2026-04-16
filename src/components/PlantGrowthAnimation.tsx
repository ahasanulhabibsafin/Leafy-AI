import React from 'react';
import { motion } from 'motion/react';

export const PlantGrowthAnimation: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <svg
        width="100"
        height="120"
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        {/* Pot */}
        <motion.path
          d="M30 100 L70 100 L75 80 L25 80 Z"
          fill="#8B4513"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        />
        
        {/* Stem */}
        <motion.path
          d="M50 80 Q50 60 50 40"
          stroke="#228B22"
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
        />
        
        {/* Glow Effect */}
        <motion.circle
          cx="50"
          cy="40"
          r="15"
          fill="url(#glowGradient)"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 0.4, 0], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, delay: 2 }}
        />

        <defs>
          <radialGradient id="glowGradient">
            <stop offset="0%" stopColor="#32CD32" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#32CD32" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Leaf 1 */}
        <motion.path
          d="M50 65 Q35 55 25 65 Q35 75 50 65"
          fill="#32CD32"
          initial={{ scale: 0, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 1.2, ease: "backOut" }}
          style={{ originX: "50px", originY: "65px" }}
        />

        {/* Leaf 2 */}
        <motion.path
          d="M50 50 Q65 40 75 50 Q65 60 50 50"
          fill="#32CD32"
          initial={{ scale: 0, opacity: 0, rotate: 20 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 1.6, ease: "backOut" }}
          style={{ originX: "50px", originY: "50px" }}
        />

        {/* Leaf 3 (Top) */}
        <motion.path
          d="M50 40 Q50 20 50 10 Q60 20 50 40"
          fill="#32CD32"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 2, ease: "backOut" }}
          style={{ originX: "50px", originY: "40px" }}
        />

        {/* Sparkles */}
        <motion.circle
          cx="20"
          cy="30"
          r="2"
          fill="#FFD700"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 1, delay: 2.5, repeat: Infinity, repeatDelay: 2 }}
        />
        <motion.circle
          cx="80"
          cy="20"
          r="1.5"
          fill="#FFD700"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 1, delay: 2.8, repeat: Infinity, repeatDelay: 2.5 }}
        />
      </svg>
    </div>
  );
};
