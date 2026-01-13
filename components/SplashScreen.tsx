import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fadeout, setFadeout] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  // Show the "Click to Enter" prompt after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);
  
  const handleEnter = () => {
    // Prevent clicking before the prompt is shown
    if (!showPrompt) return;

    setFadeout(true);
    
    // Wait for the fade-out animation to complete before finishing
    setTimeout(() => {
      onFinish();
    }, 500);
  };

  return (
    <div 
      className={`fixed inset-0 bg-[#0f172a] flex flex-col items-center justify-center transition-opacity duration-700 cursor-pointer z-50 ${fadeout ? 'opacity-0' : 'opacity-100'}`}
      onClick={handleEnter}
    >
        <div className="relative w-32 h-32 mb-6">
            <div className="absolute inset-0 border-4 border-t-[var(--color-primary)] border-gray-800 rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-4 border-b-[var(--color-primary)] border-gray-800 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        
        <div className="overflow-hidden">
            <h1 className="text-5xl text-center text-[var(--color-primary)] font-bold tracking-widest uppercase font-['Teko'] animate-slide-in-up drop-shadow-[0_0_10px_rgba(14,165,233,0.5)]" style={{ animationDelay: '200ms' }}>Battle Royale</h1>
        </div>
        <div className="overflow-hidden">
            <h2 className="text-2xl text-center text-white tracking-[0.5em] uppercase font-['Teko'] animate-slide-in-up" style={{ animationDelay: '300ms' }}>Reward Calculator</h2>
        </div>
        
        <div className="overflow-hidden mt-8">
            <p className="text-lg text-center text-[var(--color-text-muted)] font-['Teko'] animate-slide-in-up" style={{ animationDelay: '450ms' }}>Developed for: <span className="font-bold text-white">Muneeb</span></p>
        </div>

        <div className={`mt-16 transition-opacity duration-700 ${showPrompt ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-xl text-white/70 animate-pulse uppercase text-center tracking-widest border border-white/20 px-6 py-2 rounded-full backdrop-blur-sm">Tap to Initialize</p>
        </div>
    </div>
  );
};

export default SplashScreen;