import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedBackground } from './AnimatedBackground';
import { scenarios } from '../../data/scenarios';
import { gradients } from '../../utils/gameTheme';

export const ScenarioScreen = ({ onSelectScenario, onBack }) => {
  const scenarioList = Object.values(scenarios);

  const getGradientForIndex = (index) => {
    const allGradients = [gradients.blue, gradients.purple, gradients.pink, gradients.orange];
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
              textShadow: '0 0 20px rgba(179, 0, 255, 1)'
            }}>
              انتخاب سناریو
            </h1>
            <p className="text-base text-gray-300">یک سناریو را انتخاب کنید</p>
          </div>

          <div className="space-y-4">
            {scenarioList.map((scenario, index) => (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl overflow-hidden shadow-lg"
              >
                <motion.button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Button clicked for scenario:', scenario);
                    if (onSelectScenario) {
                      onSelectScenario(scenario);
                    } else {
                      console.error('onSelectScenario is not defined!');
                    }
                  }}
                  className="w-full text-right p-6 border-2 border-white/15 rounded-2xl transition-all relative z-10"
                  style={{
                    background: `linear-gradient(135deg, ${getGradientForIndex(index)[0]}, ${getGradientForIndex(index)[1]})`
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/50" />
                  <h3 className="text-2xl font-black text-white mb-2">{scenario.name}</h3>
                  <p className="text-base text-white/85 mb-4 leading-relaxed">{scenario.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {scenario.playerCounts.map((count) => (
                      <div
                        key={count}
                        className="bg-white/25 px-4 py-2 rounded-lg border border-white/30"
                      >
                        <span className="text-sm font-bold text-white">{count} نفر</span>
                      </div>
                    ))}
                  </div>
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AnimatedBackground>
  );
};

