import React from 'react';
import { motion } from 'framer-motion';

export const AnimatedBackground = ({ colors = ['#0a0a0a', '#1a0a1a', '#0a0a0a'], children }) => {
  const gradientStyle = {
    background: `linear-gradient(135deg, ${colors.join(', ')})`,
  };

  return (
    <div className="relative h-full w-full" style={gradientStyle}>
      {/* Floating orbs for ambient animation */}
      <motion.div
        className="absolute w-96 h-96 rounded-full opacity-15"
        style={{
          top: '-100px',
          left: '-100px',
          backgroundColor: '#00d4ff',
        }}
        animate={{
          x: [-120, 120, -120],
          y: [-80, 80, -80],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute w-80 h-80 rounded-full opacity-15"
        style={{
          bottom: '-100px',
          right: '-100px',
          backgroundColor: '#b300ff',
        }}
        animate={{
          x: [80, -80, 80],
          y: [40, -40, 40],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute w-72 h-72 rounded-full opacity-15"
        style={{
          top: '40%',
          left: '50%',
          marginLeft: '-144px',
          marginTop: '-144px',
          backgroundColor: '#ff00ea',
        }}
        animate={{
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {children}
    </div>
  );
};

