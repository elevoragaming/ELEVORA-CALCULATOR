import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { MatchType, MapType, RankReward, MatchRecord } from './types';
import { MAP_PLAYER_COUNTS, PRESET_CONFIGS } from './constants';
import SplashScreen from './components/SplashScreen';
import CalculatorForm from './components/CalculatorForm';
import ResultsDisplay from './components/ResultsDisplay';
import ShareReportModal from './components/ShareReportModal';
import Dashboard from './components/Dashboard';
import BottomNav from './components/BottomNav';
import TournamentPage from './components/TournamentPage';
import StrategyGuideModal from './components/StrategyGuideModal'; // New Import
import { GoogleGenAI, Type } from "@google/genai";


// Custom hook for persisting state to localStorage
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}


type Preset = keyof typeof PRESET_CONFIGS;
type Page = 'calculator' | 'dashboard' | 'tournament';

interface CalculationInputs {
  entryFee: number;
  perKillRewardPercent: number; 
  commissionPercent: number;
  selectedMap: MapType;
  matchType: MatchType;
  preset: Preset;
  totalPlayers: number;
}

const calculateAll = (inputs: CalculationInputs) => {
    const { entryFee, perKillRewardPercent, commissionPercent, selectedMap, matchType, preset, totalPlayers } = inputs;

    // 1. Calculate Total Pool
    const totalEntryPool = entryFee * totalPlayers;

    // 2. Calculate Commission (Organizer Profit)
    const organizerProfit = totalEntryPool * (commissionPercent / 100);

    // 3. Calculate Distributable Prize Pool
    const distributablePool = totalEntryPool - organizerProfit;

    // 4. Split Distributable Pool
    const totalKillPool = distributablePool * (perKillRewardPercent / 100);
    const totalPlacementPool = distributablePool - totalKillPool;

    // --- Kill Calculations (FIXED: Purely based on percentage, no tampering) ---
    const teamSize = matchType === MatchType.SOLO ? 1 : matchType === MatchType.DUO ? 2 : 4;
    const numberOfTeams = Math.ceil(totalPlayers / teamSize);
    const estimatedTotalKills = Math.max(1, totalPlayers - (matchType === MatchType.SOLO ? 1 : numberOfTeams));
    
    let rawPerKill = totalKillPool / estimatedTotalKills;
    // Simple cosmetic rounding only, no value shifting
    const perKillReward = rawPerKill > 100 ? Math.floor(rawPerKill / 10) * 10 : Math.floor(rawPerKill / 5) * 5; 
    const actualTotalKillPayout = perKillReward * estimatedTotalKills;

    // --- Placement Calculations ---
    let rewardedRanksCount = 10;
    const is50PlayerMap = MAP_PLAYER_COUNTS[selectedMap] === 50;
    if (is50PlayerMap) {
      rewardedRanksCount = 6;
    }
    
    const baseRankMultipliers = is50PlayerMap 
        ? PRESET_CONFIGS[preset].multipliers50 
        : PRESET_CONFIGS[preset].multipliers100;

    const activeMultipliers = baseRankMultipliers.slice(0, rewardedRanksCount);
    const totalWeight = activeMultipliers.reduce((sum, val) => sum + val, 0);

    // Rounding Strategy
    const smartRound = (num: number) => {
        if (num > 1000) return Math.round(num / 100) * 100;
        if (num > 500) return Math.round(num / 50) * 50;
        return Math.round(num / 10) * 10;
    };

    let newRankRewards: RankReward[] = activeMultipliers
      .map((weight, i) => {
        const rank = i + 1;
        if (totalWeight === 0) return { rank, reward: 0, multiplier: 0 };
        
        const shareOfPool = (weight / totalWeight) * totalPlacementPool;
        const roundedReward = smartRound(shareOfPool);
        
        const effectiveMultiplier = entryFee > 0 ? roundedReward / entryFee : 0;

        return { rank, reward: roundedReward, multiplier: effectiveMultiplier };
      })
      .filter(item => item.reward > 0);
    
    // --- CONFLICT RESOLUTION (Rank 1 > Rank 2) ---
    // We do NOT steal from kills. We only rearrange the placement pot if needed.
    if (newRankRewards.length >= 2) {
        if (newRankRewards[0].reward <= newRankRewards[1].reward) {
             newRankRewards[0].reward = newRankRewards[1].reward + (entryFee > 100 ? 50 : 10);
        }
    }

    // --- LIMIT ENFORCEMENT (User Requirement: Max Limits) ---
    // Balanced: Max ~5x
    // Top Heavy: Max ~12x
    // Kill Focused: Max ~3x
    const rank1 = newRankRewards[0];
    if (rank1) {
        let maxMultiplier = 100; // default high
        if (preset === 'Balanced') maxMultiplier = 5.5;
        if (preset === 'TopHeavy') maxMultiplier = 12.5;
        if (preset === 'KillFocused') maxMultiplier = 3.5;

        // If Rank 1 exceeds limit, cap it and redistribute surplus to organizer (or lower ranks)
        // Here we just cap it to keep the structure "Addictive" but compliant.
        if (rank1.multiplier > maxMultiplier) {
            const cappedReward = Math.floor(entryFee * maxMultiplier / 10) * 10;
            const diff = rank1.reward - cappedReward;
            rank1.reward = cappedReward;
            // Diff goes to profit implicitly as it's not in the array
        }
    }
    
    // Recalculate multipliers
    newRankRewards = newRankRewards.map(r => ({
        ...r,
        multiplier: entryFee > 0 ? r.reward / entryFee : 0
    }));

    const actualTotalPlacementPayout = newRankRewards.reduce((sum, item) => sum + item.reward, 0);
    const totalPayouts = actualTotalPlacementPayout + actualTotalKillPayout;

    const finalProfit = totalEntryPool - totalPayouts;
    const finalPayoutRatio = totalEntryPool > 0 ? totalPayouts / totalEntryPool : 0;

    let riskLevel: 'Safe' | 'Moderate' | 'High' | 'Critical' = 'Safe';
    if (finalPayoutRatio > 0.90) riskLevel = 'Critical';
    else if (finalPayoutRatio > 0.80) riskLevel = 'High';
    else if (finalPayoutRatio > 0.60) riskLevel = 'Moderate';

    return {
      totalEntryPool: Math.round(totalEntryPool),
      perKillReward: perKillReward,
      rankRewards: newRankRewards,
      organizerProfit: Math.round(finalProfit),
      totalKillRewardPayout: actualTotalKillPayout,
      totalPayouts: Math.round(totalPayouts),
      riskLevel,
      payoutRatio: finalPayoutRatio,
      preset,
      totalPlayers,
      perKillRewardPercent,
      commissionPercent
    };
}

const initialMatchType = MatchType.SQUAD;
const initialEntryFee = 100;
const initialMap = MapType.ERANGEL;
const initialPreset: Preset = 'Balanced';
const initialTotalPlayers = MAP_PLAYER_COUNTS[initialMap];
const initialCommission = 40; // Default to 40% as requested

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('calculator');

  const [entryFee, setEntryFee] = useState<number>(initialEntryFee);
  const [perKillRewardPercent, setPerKillRewardPercent] = useState<number>(PRESET_CONFIGS[initialPreset].perKillRewardPercent);
  const [commissionPercent, setCommissionPercent] = useState<number>(initialCommission);
  
  const [matchType, setMatchType] = useState<MatchType>(initialMatchType);
  const [selectedMap, setSelectedMap] = useState<MapType>(initialMap);
  const [totalPlayers, setTotalPlayers] = useState<number>(initialTotalPlayers);
  const [preset, setPreset] = useState<Preset>(initialPreset);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false); // Strategy Modal State
  const [matchHistory, setMatchHistory] = useLocalStorage<MatchRecord[]>('pubgMatchHistory', []);

  // AI State
  const [isAISuggesting, setIsAISuggesting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    setTotalPlayers(MAP_PLAYER_COUNTS[selectedMap]);
  }, [selectedMap]);

  const calculations = useMemo(() => {
    return calculateAll({
      entryFee, perKillRewardPercent, commissionPercent, selectedMap, matchType, preset, totalPlayers,
    });
  }, [entryFee, perKillRewardPercent, commissionPercent, selectedMap, matchType, preset, totalPlayers]);

  const handleReset = useCallback(() => {
    setPreset(initialPreset);
    setEntryFee(initialEntryFee);
    setPerKillRewardPercent(PRESET_CONFIGS[initialPreset].perKillRewardPercent);
    setCommissionPercent(initialCommission);
    setMatchType(initialMatchType);
    setSelectedMap(initialMap);
    setTotalPlayers(initialTotalPlayers);
    setAiSuggestion('');
    setAiError('');
  }, []);
  
  const handleSaveMatch = useCallback(() => {
    const newRecord: MatchRecord = {
        id: new Date().toISOString(),
        date: new Date().toISOString(),
        map: selectedMap,
        mode: matchType,
        entryFee,
        totalPlayers,
        totalPool: calculations.totalEntryPool,
        totalPayout: calculations.totalPayouts,
        profit: calculations.organizerProfit,
    };
    setMatchHistory(prev => [newRecord, ...prev]);
  }, [calculations, selectedMap, matchType, entryFee, totalPlayers, setMatchHistory]);

  const handleRemoveMatch = useCallback((matchId: string) => {
    setMatchHistory(prev => prev.filter(match => match.id !== matchId));
  }, [setMatchHistory]);
  
  const handleAddMatch = useCallback((match: MatchRecord) => {
      setMatchHistory(prev => [match, ...prev]);
  }, [setMatchHistory]);

  const handlePresetChange = useCallback((newPreset: Preset) => {
    setPreset(newPreset);
    setPerKillRewardPercent(PRESET_CONFIGS[newPreset].perKillRewardPercent);
  }, []);

  const handleGetAISuggestion = useCallback(async (userPrompt: string) => {
    if (!userPrompt) {
      setAiError("Please describe the type of match you want to create.");
      return;
    }
    setIsAISuggesting(true);
    setAiSuggestion('');
    setAiError('');

    try {
      const ai = new GoogleGenAI({apiKey: process.env.API_KEY as string});
      
      const systemInstruction = `You are an expert assistant for a Battle Royale tournament organizer.
Based on the user's description, suggest the best settings.
- 'Balanced': 50% kill / 50% rank split.
- 'TopHeavy': Mostly rank reward, low kill reward.
- 'KillFocused': High kill reward.
- Suggest a Commission % (30-40% is standard for premium) based on how greedy or generous the organizer sounds.
- Suggest Entry Fee.
`;

      const schema = {
        type: Type.OBJECT,
        properties: {
          preset: { type: Type.STRING, enum: ['Balanced', 'TopHeavy', 'KillFocused'] },
          entryFee: { type: Type.INTEGER },
          commissionPercent: { type: Type.INTEGER },
          perKillRewardPercent: { type: Type.INTEGER },
          reasoning: { type: Type.STRING },
        },
        required: ['preset', 'entryFee', 'commissionPercent', 'perKillRewardPercent', 'reasoning']
      };

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: schema,
        }
      });
      
      const result = JSON.parse(response.text);
      
      const newPreset = result.preset as Preset;
      setPreset(newPreset);
      setEntryFee(result.entryFee);
      setPerKillRewardPercent(result.perKillRewardPercent);
      setCommissionPercent(result.commissionPercent || 30);
      setAiSuggestion(result.reasoning);

    } catch (error) {
      console.error("AI Suggestion Error:", error);
      setAiError("Sorry, I couldn't get a suggestion. Please try again.");
    } finally {
      setIsAISuggesting(false);
    }
  }, []);
  
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <div className="bg-[var(--color-bg)] text-[var(--color-text-base)] font-['Teko'] tracking-wider min-h-screen pb-24 relative overflow-x-hidden">
      
      <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 relative z-10">
        
        {currentPage === 'calculator' && (
            <div className="animate-fade-in">
                 <header className="text-center mb-8 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
                    <div className="inline-block border-b-2 border-[var(--color-primary)] pb-2 px-8">
                        <h1 className="text-5xl md:text-7xl font-bold text-white uppercase header-glow drop-shadow-lg">
                            Battle Royale
                        </h1>
                        <p className="text-2xl text-[var(--color-primary)] tracking-[0.5em] uppercase">Reward Calculator</p>
                    </div>
                </header>
                <div className="space-y-8">
                    <CalculatorForm
                        entryFee={entryFee} setEntryFee={setEntryFee}
                        perKillRewardPercent={perKillRewardPercent} setPerKillRewardPercent={setPerKillRewardPercent}
                        commissionPercent={commissionPercent} setCommissionPercent={setCommissionPercent}
                        matchType={matchType} setMatchType={setMatchType}
                        selectedMap={selectedMap} setSelectedMap={setSelectedMap}
                        totalPlayers={totalPlayers} setTotalPlayers={setTotalPlayers}
                        onReset={handleReset}
                        preset={preset} onPresetChange={handlePresetChange}
                        onGetAISuggestion={handleGetAISuggestion}
                        isAISuggesting={isAISuggesting}
                        aiSuggestion={aiSuggestion}
                        aiError={aiError}
                        onOpenStrategy={() => setIsStrategyModalOpen(true)} // Open Strategy
                    />
                    <ResultsDisplay 
                        {...calculations} 
                        entryFee={entryFee} matchType={matchType} 
                        onGenerateReport={() => setIsReportModalOpen(true)}
                        onSaveMatch={handleSaveMatch}
                    />
                </div>
            </div>
        )}

        {currentPage === 'tournament' && (
            <div className="animate-fade-in">
                <TournamentPage />
            </div>
        )}

        {currentPage === 'dashboard' && (
            <div className="animate-fade-in">
                <Dashboard 
                  matchHistory={matchHistory} 
                  onRemoveMatch={handleRemoveMatch} 
                  onAddMatch={handleAddMatch}
                />
            </div>
        )}

      </div>
      <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <ShareReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        data={calculations}
        selectedMap={selectedMap}
        matchType={matchType}
        entryFee={entryFee}
      />
      <StrategyGuideModal 
        isOpen={isStrategyModalOpen}
        onClose={() => setIsStrategyModalOpen(false)}
      />
    </div>
  );
};

export default App;