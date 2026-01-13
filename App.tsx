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
import StrategyGuideModal from './components/StrategyGuideModal';
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

    // 2. Calculate Commission (Organizer Profit) - TAKEN FIRST
    const organizerProfit = totalEntryPool * (commissionPercent / 100);

    // 3. Calculate Distributable Prize Pool
    const distributablePool = totalEntryPool - organizerProfit;

    // 4. Split Distributable Pool (Strict Percentage)
    const totalKillPool = distributablePool * (perKillRewardPercent / 100);
    const totalPlacementPool = distributablePool - totalKillPool;

    // --- Kill Calculations (STRICT & EXACT) ---
    const teamSize = matchType === MatchType.SOLO ? 1 : matchType === MatchType.DUO ? 2 : 4;
    const numberOfTeams = Math.ceil(totalPlayers / teamSize);
    // Estimated kills = Total Players - Number of Winning Teams (roughly)
    const estimatedTotalKills = Math.max(1, totalPlayers - (matchType === MatchType.SOLO ? 1 : numberOfTeams));
    
    // Exact calculation, no "bevkufi" rounding that loses money
    let perKillReward = 0;
    if (estimatedTotalKills > 0) {
        // Floor to nearest 5 or 10 to keep it clean, but try to stay close to true value
        const rawPerKill = totalKillPool / estimatedTotalKills;
        if (rawPerKill > 100) {
            perKillReward = Math.floor(rawPerKill / 10) * 10;
        } else {
            perKillReward = Math.floor(rawPerKill / 5) * 5;
        }
    }
    
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

    // Rounding Strategy (Psychological)
    const smartRound = (num: number) => {
        if (num > 2000) return Math.round(num / 100) * 100;
        if (num > 500) return Math.round(num / 50) * 50;
        return Math.round(num / 10) * 10;
    };

    let newRankRewards: RankReward[] = activeMultipliers
      .map((weight, i) => {
        const rank = i + 1;
        if (totalWeight === 0) return { rank, reward: 0, multiplier: 0 };
        
        const shareOfPool = (weight / totalWeight) * totalPlacementPool;
        const roundedReward = smartRound(shareOfPool);
        
        return { rank, reward: roundedReward, multiplier: 0 }; // Multiplier calc later
      })
      .filter(item => item.reward > 0);
    
    // --- HIERARCHY ENFORCEMENT (Rank 1 MUST be King) ---
    // Instead of capping Rank 1, we ensure it maintains a gap above Rank 2.
    // If Rank 2 is too close, we steal from Rank 2 (and others) to feed Rank 1.
    
    if (newRankRewards.length >= 2) {
        const rank1 = newRankRewards[0];
        const rank2 = newRankRewards[1];
        
        // Define minimum gap based on entry fee
        const minGap = entryFee * 1.5; 
        
        if (rank1.reward < rank2.reward + minGap) {
            // Rank 1 is too low or Rank 2 is too high.
            // Move funds from Rank 2 to Rank 1
            const diff = (rank2.reward + minGap) - rank1.reward;
            
            // Take from Rank 2
            newRankRewards[1].reward -= diff; 
            // Give to Rank 1
            newRankRewards[0].reward += diff;
            
            // Re-round
            newRankRewards[0].reward = smartRound(newRankRewards[0].reward);
            newRankRewards[1].reward = smartRound(newRankRewards[1].reward);
        }
        
        // Sanity Check: Ensure Rank 2 didn't drop below Rank 3
        if (newRankRewards.length >= 3) {
             if (newRankRewards[1].reward <= newRankRewards[2].reward) {
                 newRankRewards[1].reward = newRankRewards[2].reward + 50;
             }
        }
    }

    // Recalculate multipliers
    newRankRewards = newRankRewards.map(r => ({
        ...r,
        multiplier: entryFee > 0 ? r.reward / entryFee : 0
    }));

    const actualTotalPlacementPayout = newRankRewards.reduce((sum, item) => sum + item.reward, 0);
    const totalPayouts = actualTotalPlacementPayout + actualTotalKillPayout;

    // Profit might fluctuate slightly due to rounding, but Commission was taken off the top.
    // Any unspent rounding difference adds to profit.
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
const initialCommission = 40; 

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
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false); 
  const [matchHistory, setMatchHistory] = useLocalStorage<MatchRecord[]>('pubgMatchHistory', []);

  // AI State
  const [isAISuggesting, setIsAISuggesting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiError, setAiError] = useState('');

  // Update total players when map changes, UNLESS it was an AI action that might have set it differently (though for now, strict map rules are safer)
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
      
      const systemInstruction = `You are an expert PUBG Mobile Esports Business Consultant.
Your user is a Tournament Organizer who wants to make money while keeping players happy.

Your tasks:
1. **Analyze the User's Input**: They might ask a business question (e.g., "How to increase profit?", "Is 40% commission too high?") or describe a specific match configuration (e.g., "Host a squad match with 100rs entry").
2. **Provide Strategic Advice**: Write a short, punchy, and profitable piece of advice in the 'reasoning' field. Explain *why* you chose the numbers. Speak directly to the organizer.
3. **Configure the Calculator**: Set the parameters (entryFee, commission, map, etc.) to values that BACK UP your advice.
   - Example: If they ask "How to make max profit?", set Commission to 40-50% and explain that they need to provide premium service to justify it.
   - Example: If they ask for a "Solo Match on Livik", update the matchType to 'Solo' and map to 'Livik'.

Constraints:
- Presets: 'Balanced' (standard), 'TopHeavy' (big 1st prize), 'KillFocused' (aggression).
- Commission: 0-50 (Standard is 20-30, Premium is 40).
- Maps: Erangel, Miramar, Sanhok, Vikendi, Livik.
- Match Types: Solo, Duo, Squad.

Always return valid JSON.`;

      const schema = {
        type: Type.OBJECT,
        properties: {
          preset: { type: Type.STRING, enum: ['Balanced', 'TopHeavy', 'KillFocused'] },
          matchType: { type: Type.STRING, enum: ['Solo', 'Duo', 'Squad'] },
          map: { type: Type.STRING, enum: ['Erangel', 'Miramar', 'Sanhok', 'Vikendi', 'Livik'] },
          entryFee: { type: Type.INTEGER },
          commissionPercent: { type: Type.INTEGER },
          perKillRewardPercent: { type: Type.INTEGER },
          reasoning: { type: Type.STRING },
        },
        required: ['preset', 'entryFee', 'commissionPercent', 'perKillRewardPercent', 'reasoning']
      };

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
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
      
      // Update Map and Type if provided by AI
      if (result.matchType) setMatchType(result.matchType as MatchType);
      if (result.map) setSelectedMap(result.map as MapType);

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
                        onOpenStrategy={() => setIsStrategyModalOpen(true)}
                        calculatedPerKill={calculations.perKillReward} // Pass calculated value
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