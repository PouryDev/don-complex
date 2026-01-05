import React from 'react';
import { motion } from 'framer-motion';

export const GradientButton = ({ title, onClick, colors, disabled = false, pulse = false, className = '' }) => {
  const gradientStyle = {
    background: disabled 
      ? 'linear-gradient(135deg, #333333, #222222)' 
      : `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
  };

  return (
    <motion.div
      className={`rounded-xl overflow-hidden shadow-lg ${className}`}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      animate={pulse && !disabled ? {
        scale: [1, 1.05, 1],
      } : {}}
      transition={pulse && !disabled ? {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      } : {}}
    >
      <button
        onClick={onClick}
        disabled={disabled}
        className="w-full py-4 px-8 text-center border border-white/15 rounded-xl transition-all"
        style={gradientStyle}
      >
        <span className={`text-lg font-bold ${disabled ? 'text-gray-600' : 'text-white'}`}>
          {title}
        </span>
      </button>
    </motion.div>
  );
};

