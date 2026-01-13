import React from 'react';

interface StrategyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StrategyGuideModal: React.FC<StrategyGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-[#1e293b] rounded-xl shadow-2xl w-full max-w-3xl border border-[var(--color-primary)] card-glow overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()} 
      >
        <div className="bg-[var(--color-primary)]/10 p-6 border-b border-[var(--color-border)] flex justify-between items-center">
            <div>
                <h2 className="text-3xl font-bold text-white uppercase tracking-wider">Business Strategy</h2>
                <p className="text-[var(--color-primary)] text-lg">Profit Optimization Guide</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-4xl leading-none">&times;</button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8">
            
            {/* Section 1: Virtual Coin Power */}
            <div className="space-y-4">
                <h3 className="text-2xl font-bold text-yellow-400 flex items-center gap-3">
                    <span className="text-3xl">🪙</span>
                    Virtual Coins (Website System)
                </h3>
                <div className="bg-black/30 p-4 rounded-lg border border-yellow-500/20 text-lg text-gray-300 leading-relaxed">
                    <p className="mb-3">
                        <strong className="text-white">Verdict:</strong> The Website (Virtual Coin) system is <span className="text-green-400 font-bold">10x better</span> than manual payments.
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <strong className="text-white">The "Lock-in" Effect:</strong> Users buy 1000 Coins. They play 2 matches (200 coins). The remaining 800 coins stay in YOUR wallet. In a manual system, they would keep that cash.
                        </li>
                        <li>
                            <strong className="text-white">Psychology:</strong> Spending "100 Coins" feels less painful than sending "100 PKR" from EasyPaisa every time. This increases match frequency.
                        </li>
                    </ul>
                </div>
            </div>

            {/* Section 2: Withdrawal Limit Secret */}
            <div className="space-y-4">
                <h3 className="text-2xl font-bold text-red-400 flex items-center gap-3">
                    <span className="text-3xl">🔒</span>
                    The 3x Withdrawal Rule
                </h3>
                <div className="bg-black/30 p-4 rounded-lg border border-red-500/20 text-lg text-gray-300 leading-relaxed">
                    <p className="mb-3">
                        You mentioned a <strong className="text-white">Minimum Withdrawal of 3x Entry</strong>. This is your biggest profit driver.
                    </p>
                    <p className="italic text-gray-400 border-l-4 border-red-500 pl-4 py-1 my-3 bg-red-900/10">
                        "If I win 2x my entry fee, I cannot withdraw. I MUST play again to reach 3x. Chances are, I will lose the next match."
                    </p>
                    <p>
                        This rule recycles the prize money back into your system. It ensures that money enters easily but leaves with difficulty.
                    </p>
                </div>
            </div>

            {/* Section 3: Commission Strategy */}
            <div className="space-y-4">
                <h3 className="text-2xl font-bold text-[var(--color-primary)] flex items-center gap-3">
                    <span className="text-3xl">📊</span>
                    40% Commission: Is it too much?
                </h3>
                <div className="bg-black/30 p-4 rounded-lg border border-[var(--color-primary)]/20 text-lg text-gray-300 leading-relaxed">
                    <p className="mb-3">
                        <strong className="text-white">No, 40% is perfect</strong> if you have a website.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-[#0f172a] p-4 rounded border border-gray-700">
                            <h4 className="font-bold text-white mb-2">Why 40% works:</h4>
                            <p className="text-sm">Server costs, website maintenance, and "Float" (held money) justify the premium. Players pay for the *convenience* of the automated system.</p>
                        </div>
                        <div className="bg-[#0f172a] p-4 rounded border border-gray-700">
                            <h4 className="font-bold text-white mb-2">How to hide it:</h4>
                            <p className="text-sm">Focus on the <strong>Top 1 Prize</strong>. As long as Rank 1 gets 5x-12x, nobody calculates the total pool percentage. The "Addictive" rewards mask the high commission.</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <div className="p-6 border-t border-[var(--color-border)] flex justify-end">
             <button
                onClick={onClose}
                className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold py-3 px-8 text-lg uppercase rounded-lg shadow-lg transition-all"
            >
                Got it!
            </button>
        </div>
      </div>
    </div>
  );
};

export default StrategyGuideModal;