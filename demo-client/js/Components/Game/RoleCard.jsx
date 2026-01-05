import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RoleIcon } from './RoleIcon';
import { gradients } from '../../utils/gameTheme';

export const RoleCard = ({ role, playerNumber, onReveal }) => {
  const [revealed, setRevealed] = useState(false);

  const handleReveal = () => {
    if (!revealed) {
      setRevealed(true);
      onReveal?.();
    }
  };

  const teamColor = role.team === 'مافیا' ? gradients.mafia : gradients.citizen;
  const gradientStyle = revealed
    ? { background: `linear-gradient(135deg, ${teamColor[0]}, ${teamColor[1]})` }
    : { background: 'linear-gradient(135deg, #2a2a2a, #1a1a1a)' };

  return (
    <motion.div
      className="mb-5"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="rounded-2xl overflow-hidden shadow-2xl"
        style={revealed && role.team === 'مافیا' ? {
          boxShadow: '0 0 30px rgba(255, 0, 85, 0.6)'
        } : revealed ? {
          boxShadow: '0 0 30px rgba(0, 212, 255, 0.6)'
        } : {}}
      >
        <div className="relative" style={{ perspective: '1000px' }}>
          {/* Front side */}
          <motion.div
            className="p-8 min-h-[500px] flex flex-col items-center justify-center border-2 border-white/15 rounded-2xl cursor-pointer"
            style={{
              ...gradientStyle,
              transformStyle: 'preserve-3d',
            }}
            animate={{
              rotateY: revealed ? 180 : 0,
              opacity: revealed ? 0 : 1,
            }}
            transition={{ duration: 0.6 }}
            onClick={handleReveal}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {!revealed && (
              <div className="flex flex-col items-center gap-4">
                <p className="text-lg font-bold text-white/90 mb-6">بازیکن {playerNumber}</p>
                <p className="text-base text-gray-400 text-center">ضربه بزنید برای نمایش نقش</p>
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-5xl"
                >
                  👆
                </motion.div>
              </div>
            )}
          </motion.div>

          {/* Back side */}
          <motion.div
            className="absolute inset-0 p-8 min-h-[500px] flex flex-col items-center justify-center border-2 border-white/15 rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${teamColor[0]}, ${teamColor[1]})`,
              transformStyle: 'preserve-3d',
              transform: 'rotateY(180deg)',
            }}
            animate={{
              rotateY: revealed ? 0 : 180,
              opacity: revealed ? 1 : 0,
            }}
            transition={{ duration: 0.6 }}
          >
            {revealed && (
              <div className="flex flex-col items-center gap-5 w-full">
                <p className="text-xl font-bold text-white/90 mb-6">بازیکن {playerNumber}</p>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="w-44 h-44 rounded-2xl bg-black/30 flex items-center justify-center border-3 border-white/30 mb-4"
                  style={{
                    boxShadow: '0 0 15px rgba(255, 255, 255, 0.3)'
                  }}
                >
                  <RoleIcon
                    roleName={role.name}
                    size={160}
                    color={role.team === 'مافیا' ? '#ff3366' : '#00ffff'}
                  />
                </motion.div>
                <h2 className="text-3xl font-black text-white text-center mb-4" style={{
                  textShadow: '0 0 8px rgba(0, 0, 0, 0.5)'
                }}>
                  {role.name}
                </h2>
                <div className="bg-white/25 px-6 py-3 rounded-lg border border-white/30 mt-2">
                  <p className="text-xl font-bold text-white">{role.team}</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

