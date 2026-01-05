import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedBackground } from './AnimatedBackground';
import { RoleCard } from './RoleCard';
import { GradientButton } from './GradientButton';
import { gradients } from '../../utils/gameTheme';

export const RoleRevealScreen = ({ roles, onRestart, onBackToMenu }) => {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [allRevealed, setAllRevealed] = useState(false);
  const [currentRoleRevealed, setCurrentRoleRevealed] = useState(false);
  const [completedScale, setCompletedScale] = useState(0);

  const handleRoleReveal = () => {
    setCurrentRoleRevealed(true);
  };

  const handleNext = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log('handleNext called:', {
      currentPlayerIndex,
      rolesLength: roles.length,
      currentRoleRevealed,
      allRevealed
    });
    if (currentPlayerIndex < roles.length - 1) {
      console.log('Moving to next player');
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setCurrentRoleRevealed(false);
    } else {
      console.log('All players revealed, showing completion screen');
      setAllRevealed(true);
      setCompletedScale(1);
    }
  };

  const handleRestart = () => {
    setCurrentPlayerIndex(0);
    setAllRevealed(false);
    setCurrentRoleRevealed(false);
    setCompletedScale(0);
    onRestart();
  };

  if (allRevealed) {
    return (
      <AnimatedBackground colors={['#0a0a0a', '#1a0a1a', '#0a0a0a']}>
        <div className="h-full flex flex-col justify-between p-8 pb-40 md:pb-20 overflow-y-auto">
          <motion.div
            className="flex-1 flex flex-col justify-center items-center gap-6"
            initial={{ scale: 0 }}
            animate={{ scale: completedScale }}
            transition={{ type: "spring", tension: 50, friction: 7 }}
          >
            <div className="text-9xl mb-4">🎉</div>
            <h2 className="text-4xl font-black text-white text-center" style={{
              textShadow: '0 0 20px rgba(0, 255, 136, 1)'
            }}>
              بازی شروع شد!
            </h2>
            <p className="text-base text-gray-300 text-center">
              همه بازیکنان نقش خود را دیدند
            </p>
          </motion.div>

          <div className="space-y-4">
            <GradientButton
              title="بازی جدید"
              onClick={handleRestart}
              colors={gradients.blue}
            />
            <GradientButton
              title="بازگشت به منو"
              onClick={onBackToMenu}
              colors={gradients.purple}
            />
          </div>
        </div>
      </AnimatedBackground>
    );
  }

  const progress = ((currentPlayerIndex + 1) / roles.length) * 100;

  return (
    <AnimatedBackground colors={['#0a0a0a', '#1a0a1a', '#0a0a0a']}>
      <div className="h-full overflow-y-auto pb-40 md:pb-20">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="mb-6 text-center">
            <p className="text-xl font-bold text-cyan-400 mb-4">
              {currentPlayerIndex + 1} از {roles.length}
            </p>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-cyan-400 rounded-full"
                style={{
                  boxShadow: '0 0 10px rgba(0, 212, 255, 0.8)'
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <RoleCard
            key={currentPlayerIndex}
            role={roles[currentPlayerIndex]}
            playerNumber={currentPlayerIndex + 1}
            onReveal={handleRoleReveal}
          />

          <div className="mt-8 relative z-20">
            <GradientButton
              title={
                currentPlayerIndex < roles.length - 1
                  ? 'بازیکن بعدی'
                  : 'اتمام توزیع'
              }
              onClick={handleNext}
              colors={gradients.blue}
              disabled={!currentRoleRevealed}
            />
          </div>
        </div>
      </div>
    </AnimatedBackground>
  );
};

