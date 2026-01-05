import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScenarioScreen } from '../Components/Game/ScenarioScreen';
import { PlayerCountScreen } from '../Components/Game/PlayerCountScreen';
import { RoleRevealScreen } from '../Components/Game/RoleRevealScreen';
import { scenarios } from '../data/scenarios';
import { shuffleRoles } from '../utils/roleShuffler';

export default function RoleDistribution() {
    const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState('scenario');
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [selectedPlayerCount, setSelectedPlayerCount] = useState(null);
  const [shuffledRoles, setShuffledRoles] = useState([]);

  const handleSelectScenario = (scenario) => {
    setSelectedScenario(scenario);
    setCurrentScreen('playerCount');
  };

  const handleSelectPlayerCount = (count) => {
    setSelectedPlayerCount(count);
    if (selectedScenario && selectedScenario.roles[count]) {
      const roles = selectedScenario.roles[count];
      const shuffled = shuffleRoles(roles);
      setShuffledRoles(shuffled);
      setCurrentScreen('roleReveal');
    }
  };

  const handleRestart = () => {
    // Re-shuffle the same scenario and player count
    if (selectedScenario && selectedPlayerCount && selectedScenario.roles[selectedPlayerCount]) {
      const roles = selectedScenario.roles[selectedPlayerCount];
      const shuffled = shuffleRoles(roles);
      setShuffledRoles(shuffled);
      setCurrentScreen('roleReveal');
    }
  };

  const handleBackToMenu = () => {
    navigate('/');
  };

  const handleBackFromScenario = () => {
    navigate('/');
  };
  
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        navigate('/');
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [navigate]);

  const handleBackFromPlayerCount = () => {
    setCurrentScreen('scenario');
    setSelectedPlayerCount(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {currentScreen === 'scenario' && (
        <ScenarioScreen
          onSelectScenario={handleSelectScenario}
          onBack={handleBackFromScenario}
        />
      )}

      {currentScreen === 'playerCount' && selectedScenario && (
        <PlayerCountScreen
          scenario={selectedScenario}
          onSelectPlayerCount={handleSelectPlayerCount}
          onBack={handleBackFromPlayerCount}
        />
      )}

      {currentScreen === 'roleReveal' && shuffledRoles.length > 0 && (
        <RoleRevealScreen
          roles={shuffledRoles}
          onRestart={handleRestart}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  );
}

