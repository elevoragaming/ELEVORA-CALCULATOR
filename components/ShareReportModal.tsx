import React, { useState, useEffect } from 'react';
import { MatchType, MapType, RankReward } from '../types';

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    totalEntryPool: number;
    perKillReward: number;
    rankRewards: RankReward[];
    preset: string;
    totalPlayers: number;
    perKillRewardPercent: number;
  };
  selectedMap: MapType;
  matchType: MatchType;
  entryFee: number;
}

const formatCurrency = (value: number) => `PKR ${Math.round(value).toLocaleString()}`;

const ShareReportModal: React.FC<ShareReportModalProps> = ({ isOpen, onClose, data, selectedMap, matchType, entryFee }) => {
  const [copyButtonText, setCopyButtonText] = useState('Copy to Clipboard');

  useEffect(() => {
    if (isOpen) {
      // Reset button text when modal opens
      setCopyButtonText('Copy to Clipboard');
    }
  }, [isOpen]);
  
  if (!isOpen) return null;

  const {
    totalEntryPool,
    perKillReward,
    rankRewards,
    preset,
    totalPlayers,
  } = data;

  const reportString = `
✨ **CUSTOM MATCH: PRIZE POOL ANNOUNCEMENT** ✨
--------------------------------------------------

**MATCH INFO:**
🗺️  **Map:** ${selectedMap}
👥  **Mode:** ${matchType}
🧑‍🤝‍🧑  **Players:** ${totalPlayers}
🎟️  **Entry Fee:** ${formatCurrency(entryFee)}

**REWARD STRUCTURE (Style: ${preset})**
🎯  **Per Kill Reward:** ${formatCurrency(perKillReward)}
🏆  **Total Prize Pool:** ${formatCurrency(totalEntryPool)}

**TOP PLACEMENT REWARDS:**
${rankRewards.map(r => `🏅 **Rank #${r.rank}:** ${formatCurrency(r.reward)}`).join('\n')}

--------------------------------------------------
Get ready for an epic battle! See you on the battlegrounds.
#BattleRoyale #CustomMatch #LastOneStanding
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(reportString);
    setCopyButtonText('Copied!');
    setTimeout(() => setCopyButtonText('Copy to Clipboard'), 2000);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--color-surface)] rounded-lg shadow-2xl p-6 w-full max-w-2xl border border-[var(--color-border)] card-glow animate-scale-in"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="flex justify-between items-center border-b-2 border-[var(--color-primary)] pb-3 mb-4">
          <h2 className="text-3xl font-bold text-[var(--color-primary)] uppercase">Match Report Summary</h2>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-white transition-colors text-3xl">&times;</button>
        </div>

        <textarea
          readOnly
          value={reportString}
          className="w-full h-96 bg-gray-900/50 p-4 rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleCopy}
            className="bg-[var(--color-primary)] text-white font-bold py-3 px-6 text-lg uppercase rounded-md transition-transform transform hover:scale-105 active:scale-95"
          >
            {copyButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareReportModal;
