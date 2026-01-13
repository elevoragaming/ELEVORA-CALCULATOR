import React, { useState, useMemo } from 'react';
import { TOURNAMENT_PRESETS } from '../constants';

const formatCurrency = (value: number) => `₨ ${Math.round(value).toLocaleString()}`;

const TournamentPage: React.FC = () => {
  const [totalTeams, setTotalTeams] = useState(16);
  const [entryFeePerTeam, setEntryFeePerTeam] = useState(2000);
  const [commissionPercent, setCommissionPercent] = useState(30); // Default to 30% as requested
  
  // Complexity Additions
  const [hasMvpPrize, setHasMvpPrize] = useState(true);
  const [hasMostKillsPrize, setHasMostKillsPrize] = useState(false);
  
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof TOURNAMENT_PRESETS>('ProLeague');

  const calculations = useMemo(() => {
    const totalCollected = totalTeams * entryFeePerTeam;
    const organizerFee = totalCollected * (commissionPercent / 100);
    const netPool = totalCollected - organizerFee;
    
    // Addictive Complexity: Automatic Prize Allocations
    // MVP gets ~5% of pool, Top Fragger gets ~5% of pool if enabled
    const mvpAmount = hasMvpPrize ? Math.round((netPool * 0.05) / 50) * 50 : 0;
    const mostKillsAmount = hasMostKillsPrize ? Math.round((netPool * 0.05) / 50) * 50 : 0;
    
    const distributablePool = netPool - mvpAmount - mostKillsAmount;
    const safeDistributablePool = Math.max(0, distributablePool);
    
    const preset = TOURNAMENT_PRESETS[selectedPreset];
    const totalWeight = preset.weights.reduce((a, b) => a + b, 0);

    // Smart Rounding for "Clean" numbers
    const smartRound = (num: number) => {
        if (num > 5000) return Math.round(num / 500) * 500;
        if (num > 1000) return Math.round(num / 100) * 100;
        return Math.round(num / 50) * 50;
    };

    const rewards = preset.weights.map((weight, index) => {
        const rawReward = (weight / totalWeight) * safeDistributablePool;
        return {
            rank: index + 1,
            reward: smartRound(rawReward)
        };
    }).filter(r => r.reward > 0);

    const totalDistributed = rewards.reduce((sum, r) => sum + r.reward, 0) + mvpAmount + mostKillsAmount;
    
    // Adjust Profit for rounding errors (organizer keeps the change)
    const finalProfit = totalCollected - totalDistributed;

    // HYPE CALCULATION: How "Addictive" is this pool?
    // Based on ROI of Rank 1 and Total Prize Pool
    const rank1Reward = rewards[0]?.reward || 0;
    const rank1ROI = entryFeePerTeam > 0 ? rank1Reward / entryFeePerTeam : 0;
    
    let hypeScore = 0;
    if (rank1ROI > 10) hypeScore += 3;
    else if (rank1ROI > 5) hypeScore += 2;
    else hypeScore += 1;
    
    if (commissionPercent <= 20) hypeScore += 1; // Generous pool
    if (hasMvpPrize) hypeScore += 0.5;
    if (hasMostKillsPrize) hypeScore += 0.5;

    let hypeLabel = "Boring";
    let hypeColor = "text-gray-400";
    let hypeWidth = "20%";
    
    if (hypeScore >= 4.5) {
        hypeLabel = "🔥 ADDICTIVE";
        hypeColor = "text-[var(--color-primary)]";
        hypeWidth = "100%";
    } else if (hypeScore >= 3) {
        hypeLabel = "Decent";
        hypeColor = "text-[var(--color-success)]";
        hypeWidth = "60%";
    } else {
        hypeLabel = "Low Stakes";
        hypeColor = "text-yellow-500";
        hypeWidth = "30%";
    }

    return {
        totalCollected,
        organizerFee: finalProfit,
        netPool,
        safeDistributablePool,
        rewards,
        totalDistributed,
        mvpAmount,
        mostKillsAmount,
        rank1ROI,
        hypeLabel,
        hypeColor,
        hypeWidth
    };
  }, [totalTeams, entryFeePerTeam, commissionPercent, hasMvpPrize, hasMostKillsPrize, selectedPreset]);

  return (
    <div className="space-y-8 animate-fade-in">
        <header className="text-center animate-slide-in-up" style={{ animationDelay: '100ms' }}>
            <div className="inline-block border-b-2 border-[var(--color-primary)] pb-2 px-8">
                <h1 className="text-5xl md:text-7xl font-bold text-white uppercase header-glow drop-shadow-lg">
                    Series Calculator
                </h1>
                <p className="text-2xl text-[var(--color-primary)] tracking-[0.5em] uppercase">Tournament Mode</p>
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* INPUTS CARD (Left - 5 Cols) */}
            <div className="lg:col-span-5 glass-panel p-6 rounded-xl shadow-xl card-glow animate-slide-in-up" style={{ animationDelay: '200ms' }}>
                <h2 className="text-3xl font-bold text-[var(--color-primary)] uppercase mb-6 border-b border-[var(--color-border)] pb-2">Configuration</h2>
                
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-lg text-[var(--color-text-muted)] block mb-1">Total Teams</label>
                            <input 
                                type="number" 
                                value={totalTeams}
                                onChange={(e) => setTotalTeams(Number(e.target.value))}
                                className="w-full bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-lg p-3 text-white text-xl font-bold focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                            />
                        </div>
                        <div>
                             <label className="text-lg text-[var(--color-text-muted)] block mb-1">Entry (Per Team)</label>
                             <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-lg">₨</span>
                                <input 
                                    type="number" 
                                    value={entryFeePerTeam}
                                    onChange={(e) => setEntryFeePerTeam(Number(e.target.value))}
                                    className="w-full bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-lg p-3 pl-8 text-white text-xl font-bold focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-[var(--color-surface-light)] p-4 rounded-lg border border-[var(--color-border)]">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-lg text-white">Commission Cut</label>
                            <span className="text-2xl font-bold text-[var(--color-primary)]">{commissionPercent}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="50" 
                            value={commissionPercent}
                            onChange={(e) => setCommissionPercent(Number(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs mt-1">
                            <span className="text-gray-500">Generous (10%)</span>
                            <span className="text-yellow-500">Standard (30%)</span>
                            <span className="text-red-500">Greedy (50%)</span>
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-lg text-[var(--color-text-muted)] block mb-2">Special Prizes (Auto-Deduct)</label>
                        <div className="flex flex-col gap-3">
                            <label className="flex items-center gap-3 bg-[var(--color-surface-light)] p-3 rounded-lg border border-[var(--color-border)] cursor-pointer hover:border-[var(--color-primary)] transition">
                                <input 
                                    type="checkbox" 
                                    checked={hasMvpPrize} 
                                    onChange={(e) => setHasMvpPrize(e.target.checked)}
                                    className="w-5 h-5 accent-[var(--color-primary)]"
                                />
                                <div>
                                    <span className="text-white font-bold block">MVP Prize</span>
                                    <span className="text-xs text-[var(--color-text-muted)]">Allocates ~5% for Best Player</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 bg-[var(--color-surface-light)] p-3 rounded-lg border border-[var(--color-border)] cursor-pointer hover:border-[var(--color-primary)] transition">
                                <input 
                                    type="checkbox" 
                                    checked={hasMostKillsPrize} 
                                    onChange={(e) => setHasMostKillsPrize(e.target.checked)}
                                    className="w-5 h-5 accent-[var(--color-primary)]"
                                />
                                <div>
                                    <span className="text-white font-bold block">Top Fragger</span>
                                    <span className="text-xs text-[var(--color-text-muted)]">Allocates ~5% for Most Kills</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="text-lg text-[var(--color-text-muted)] block mb-2">Structure Model</label>
                        <div className="grid grid-cols-1 gap-2">
                            {Object.entries(TOURNAMENT_PRESETS).map(([key, config]) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedPreset(key as keyof typeof TOURNAMENT_PRESETS)}
                                    className={`p-3 rounded-lg border text-left transition-all ${selectedPreset === key ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-lg scale-105' : 'bg-[var(--color-surface-light)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'}`}
                                >
                                    <div className="font-bold uppercase text-lg flex justify-between">
                                        {config.label}
                                        {key === 'PodiumFocus' && <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded ml-2">HIGH STAKES</span>}
                                    </div>
                                    <div className={`text-sm ${selectedPreset === key ? 'text-white/80' : 'text-gray-500'}`}>{config.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* RESULTS CARD (Right - 7 Cols) */}
            <div className="lg:col-span-7 glass-panel p-6 rounded-xl shadow-xl card-glow animate-slide-in-up" style={{ animationDelay: '300ms' }}>
                <div className="flex justify-between items-start border-b border-[var(--color-border)] pb-4 mb-6">
                    <h2 className="text-3xl font-bold text-[var(--color-primary)] uppercase">Prize Pool</h2>
                    <div className="text-right">
                         <div className={`text-2xl font-bold uppercase ${calculations.hypeColor} animate-pulse`}>
                            {calculations.hypeLabel}
                         </div>
                         <div className="w-32 h-2 bg-gray-700 rounded-full mt-1 overflow-hidden ml-auto">
                            <div 
                                className="h-full bg-gradient-to-r from-yellow-500 to-[var(--color-primary)] transition-all duration-500" 
                                style={{ width: calculations.hypeWidth }}
                            ></div>
                         </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-[var(--color-surface-light)] p-3 rounded-lg text-center border border-[var(--color-border)]">
                        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Total Collected</p>
                        <p className="text-xl font-bold text-white">{formatCurrency(calculations.totalCollected)}</p>
                    </div>
                    <div className="bg-[var(--color-surface-light)] p-3 rounded-lg text-center border border-[var(--color-success)]/30">
                        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Your Profit</p>
                        <p className="text-xl font-bold text-[var(--color-success)]">{formatCurrency(calculations.organizerFee)}</p>
                    </div>
                    <div className="bg-[var(--color-surface-light)] p-3 rounded-lg text-center border border-[var(--color-primary)]/30">
                        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Distributed</p>
                        <p className="text-xl font-bold text-[var(--color-primary)]">{formatCurrency(calculations.totalDistributed)}</p>
                    </div>
                    <div className="bg-[var(--color-surface-light)] p-3 rounded-lg text-center border border-yellow-500/30">
                        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Rank 1 ROI</p>
                        <p className="text-xl font-bold text-yellow-400">{calculations.rank1ROI.toFixed(1)}x</p>
                    </div>
                </div>

                {/* SPECIAL PRIZES SECTION */}
                {(calculations.mvpAmount > 0 || calculations.mostKillsAmount > 0) && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {calculations.mvpAmount > 0 && (
                            <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-900/20 border border-yellow-500/50 p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <span className="text-2xl mr-2">🌟</span>
                                    <span className="font-bold text-yellow-500 uppercase">MVP Prize</span>
                                </div>
                                <span className="text-2xl font-bold text-white">{formatCurrency(calculations.mvpAmount)}</span>
                            </div>
                        )}
                        {calculations.mostKillsAmount > 0 && (
                            <div className="bg-gradient-to-r from-red-600/20 to-red-900/20 border border-red-500/50 p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <span className="text-2xl mr-2">💀</span>
                                    <span className="font-bold text-red-500 uppercase">Top Fragger</span>
                                </div>
                                <span className="text-2xl font-bold text-white">{formatCurrency(calculations.mostKillsAmount)}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="bg-[var(--color-surface-light)] rounded-xl overflow-hidden border border-[var(--color-border)]">
                    <table className="w-full text-lg">
                        <thead className="bg-[var(--color-surface-solid)]">
                            <tr>
                                <th className="p-4 text-left font-medium text-[var(--color-text-muted)]">RANK</th>
                                <th className="p-4 text-right font-medium text-[var(--color-text-muted)]">PRIZE</th>
                                <th className="p-4 text-right font-medium text-[var(--color-text-muted)] hidden sm:table-cell">RETURN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {calculations.rewards.map((r, i) => {
                                const isTop3 = i < 3;
                                const returnVal = entryFeePerTeam > 0 ? (r.reward / entryFeePerTeam).toFixed(1) : '0';
                                return (
                                    <tr key={r.rank} className={`border-t border-[var(--color-border)]/50 ${isTop3 ? 'bg-[var(--color-primary)]/10' : ''}`}>
                                        <td className="p-4 font-bold text-white flex items-center gap-3">
                                            {i === 0 && <span className="text-3xl filter drop-shadow-[0_0_5px_rgba(255,215,0,0.8)]">🥇</span>}
                                            {i === 1 && <span className="text-2xl text-gray-300">🥈</span>}
                                            {i === 2 && <span className="text-2xl text-yellow-700">🥉</span>}
                                            <span className={`${isTop3 ? 'text-[var(--color-primary)] text-xl' : 'text-gray-400'}`}>#{r.rank}</span>
                                        </td>
                                        <td className={`p-4 text-right font-bold tracking-wide ${i===0 ? 'text-3xl text-[var(--color-primary)] text-shadow-glow' : 'text-white text-xl'}`}>
                                            {formatCurrency(r.reward)}
                                        </td>
                                        <td className="p-4 text-right font-medium text-[var(--color-text-muted)] hidden sm:table-cell">
                                            {isTop3 ? <span className="text-[var(--color-success)]">{returnVal}x</span> : `${returnVal}x`}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                 <div className="mt-6 text-center text-[var(--color-text-muted)] text-sm">
                    This structure uses a <span className="text-[var(--color-primary)]">{commissionPercent}% Commission</span>. The prizes are rounded for psychological impact.
                </div>
            </div>
        </div>
    </div>
  );
};

export default TournamentPage;