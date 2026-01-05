import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedBackground } from './AnimatedBackground';
import { gradients } from '../../utils/gameTheme';

export const PlayerCountScreen = ({ scenario, onSelectPlayerCount, onBack }) => {
  const getGradientForIndex = (index) => {
    const allGradients = [gradients.blue, gradients.purple, gradients.pink, gradients.greenBlue];
    return allGradients[index % allGradients.length];
  };

  return (
    <AnimatedBackground colors={['#0a0a0a', '#1a0a1a', '#0a0a0a']}>
      <div className="h-full overflow-y-auto pb-40 md:pb-20">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="mb-8">
            <button
              onClick={onBack}
              className="mb-4 text-base font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              ← بازگشت
            </button>
            <h1 className="text-5xl font-black text-white mb-2" style={{
              textShadow: '0 0 20px rgba(0, 255, 255, 1)'
            }}>
              تعداد بازیکنان
            </h1>
            <p className="text-base text-gray-300">سناریو: {scenario.name}</p>
          </div>

          <div className="space-y-4">
            {scenario.playerCounts.map((count, index) => (
              <motion.div
                key={count}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 200, damping: 15 }}
                className="rounded-2xl overflow-hidden shadow-xl"
              >
                <motion.button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectPlayerCount(count);
                  }}
                  className="w-full p-12 text-center border-2 border-white/15 rounded-2xl transition-all relative z-10"
                  style={{
                    background: `linear-gradient(135deg, ${getGradientForIndex(index)[0]}, ${getGradientForIndex(index)[1]})`
                  }}
                  whileHover={{ scale: 0.95 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="flex flex-col items-center justify-center"
                    whileHover={{ scale: 1.05 }}
                  >
                    <p className="text-8xl font-black text-white mb-2" style={{
                      textShadow: '0 0 8px rgba(0, 0, 0, 0.3)'
                    }}>
                      {count}
                    </p>
                    <p className="text-2xl font-bold text-white">بازیکن</p>
                  </motion.div>
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AnimatedBackground>
  );
};

