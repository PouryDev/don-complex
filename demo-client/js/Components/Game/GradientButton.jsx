import React from 'react';
import { motion } from 'framer-motion';

export const GradientButton = ({ title, onClick, colors, disabled = false, pulse = false, className = '' }) => {
  const gradientStyle = {
    background: disabled 
      ? 'linear-gradient(135deg, #333333, #222222)' 
      : `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('GradientButton clicked:', title, 'disabled:', disabled);
    if (!disabled && onClick) {
      onClick(e);
    } else if (disabled) {
      console.log('Button is disabled, ignoring click');
    } else {
      console.error('onClick handler is not provided!');
    }
  };

  return (
    <motion.div
      className={`rounded-xl overflow-hidden shadow-lg ${className} relative z-10`}
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
        onClick={handleClick}
        disabled={disabled}
        className="w-full py-4 px-8 text-center border border-white/15 rounded-xl transition-all relative z-10"
        style={{
          ...gradientStyle,
          cursor: disabled ? 'not-allowed' : 'pointer',
          pointerEvents: disabled ? 'none' : 'auto',
        }}
      >
        <span className={`text-lg font-bold ${disabled ? 'text-gray-600' : 'text-white'}`}>
          {title}
        </span>
      </button>
    </motion.div>
  );
};

