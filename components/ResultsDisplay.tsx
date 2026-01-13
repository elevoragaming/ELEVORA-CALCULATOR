import React from 'react';
import { RankReward, MatchType } from '../types';

const formatCurrency = (value: number) => `₨ ${Math.round(value).toLocaleString()}`;

interface ResultsDisplayProps {
  totalEntryPool: number;
  perKillReward: number;
  rankRewards: RankReward[];
  organizerProfit: number;
  totalKillRewardPayout: number;
  totalPayouts: number;
  riskLevel: 'Safe' | 'Moderate' | 'High' | 'Critical';
  payoutRatio: number;
  entryFee: number;
  matchType: MatchType;
  onGenerateReport: () => void;
  onSaveMatch: () => void;
  totalPlayers: number;
  perKillRewardPercent: number;
  commissionPercent: number;
  preset: string;
}

const StatCard: React.FC<{ title: string, value: string | number, subtext?: string, colorClass?: string, borderClass?: string }> = ({ title, value, subtext, colorClass = 'text-white', borderClass = 'border-[var(--color-border)]' }) => (
    <div className={`bg-[var(--color-surface-light)] p-4 rounded-xl text-center border ${borderClass} shadow-md`}>
        <p className="text-lg text-[var(--color-text-muted)] uppercase tracking-widest text-sm mb-1">{title}</p>
        <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
        {subtext && <p className="text-sm text-[var(--color-text-muted)] mt-1">{subtext}</p>}
    </div>
);

const riskColorMap = {
    Safe: 'text-[var(--color-success)]',
    Moderate: 'text-yellow-400',
    High: 'text-orange-400',
    Critical: 'text-[var(--color-danger)]',
};

const ResultsDisplay: React.FC<ResultsDisplayProps> = (props) => {
    const {
        totalEntryPool,
        perKillReward,
        rankRewards,
        organizerProfit,
        totalPayouts,
        riskLevel,
        payoutRatio,
        commissionPercent,
        onGenerateReport,
        onSaveMatch,
    } = props;

    return (
        <div className="glass-panel p-6 rounded-xl shadow-xl card-glow animate-slide-in-up" style={{ animationDelay: '300ms' }}>
            <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-4 mb-6">
                 <h2 className="text-3xl font-bold text-[var(--color-primary)] uppercase tracking-wider">Financials</h2>
                 <div className={`px-4 py-1 rounded-full border ${riskLevel === 'Safe' ? 'border-[var(--color-success)] text-[var(--color-success)]' : 'border-[var(--color-danger)] text-[var(--color-danger)]'} text-lg font-bold`}>
                    {riskLevel} Risk
                 </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 text-xl">
                <StatCard 
                    title="Total Collection" 
                    value={formatCurrency(totalEntryPool)} 
                    colorClass="text-white"
                />
                <StatCard 
                    title="Net Profit" 
                    value={formatCurrency(organizerProfit)} 
                    subtext={`${commissionPercent}% Margin`}
                    colorClass="text-[var(--color-success)]"
                    borderClass="border-[var(--color-success)]/30"
                />
                <StatCard 
                    title="Prize Pool" 
                    value={formatCurrency(totalPayouts)} 
                    subtext={`${(payoutRatio * 100).toFixed(1)}% Distributed`}
                    colorClass="text-[var(--color-primary)]"
                />
                <StatCard 
                    title="Per Kill" 
                    value={formatCurrency(perKillReward)} 
                    colorClass="text-[var(--color-primary)]"
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                <div>
                    <h3 className="text-xl font-bold mb-4 text-center text-white border-b border-[var(--color-border)] pb-2 mx-auto w-1/2">Rank Distribution</h3>
                    <div className="bg-[var(--color-surface-light)] rounded-xl overflow-hidden border border-[var(--color-border)]">
                        <table className="w-full text-base">
                            <thead>
                                <tr className="bg-[var(--color-surface-solid)]">
                                    <th className="p-3 text-left font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Rank</th>
                                    <th className="p-3 text-center font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Prize</th>
                                    <th className="p-3 text-right font-medium text-[var(--color-text-muted)] uppercase tracking-wider">ROI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rankRewards.map(({ rank, reward, multiplier }, index) => (
                                    <tr key={rank} className={`border-t border-[var(--color-border)]/50 ${index < 3 ? 'bg-[var(--color-primary)]/10' : ''}`}>
                                        <td className="p-3 font-bold text-white flex items-center gap-2">
                                            {index === 0 && <span className="text-xl">🥇</span>}
                                            {index === 1 && <span className="text-xl">🥈</span>}
                                            {index === 2 && <span className="text-xl">🥉</span>}
                                            <span className={index < 3 ? 'text-[var(--color-primary)]' : ''}>#{rank}</span>
                                        </td>
                                        <td className="p-3 text-center font-bold text-white tracking-wide">{formatCurrency(reward)}</td>
                                        <td className="p-3 text-right text-[var(--color-text-muted)]">{multiplier.toFixed(1)}x</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row justify-end gap-4">
                <button
                    onClick={onSaveMatch}
                    className="w-full sm:w-auto bg-[var(--color-success)] hover:bg-green-600 text-white font-bold py-3 px-8 text-lg uppercase rounded-lg shadow-lg transition-transform transform hover:scale-105 active:scale-95"
                >
                    Save Record
                </button>
                <button
                    onClick={onGenerateReport}
                    className="w-full sm:w-auto bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold py-3 px-8 text-lg uppercase rounded-lg shadow-lg transition-transform transform hover:scale-105 active:scale-95 button-glow-active"
                >
                    Generate Report
                </button>
            </div>
        </div>
    );
};

export default ResultsDisplay;