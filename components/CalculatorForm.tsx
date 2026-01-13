import React from 'react';
import { MatchType, MapType } from '../types';
import { MATCH_TYPES, MAP_OPTIONS, PRESET_CONFIGS } from '../constants';
import AISuggestionBox from './AISuggestionBox';

type Preset = keyof typeof PRESET_CONFIGS;

interface CalculatorFormProps {
  entryFee: number;
  setEntryFee: (value: number) => void;
  perKillRewardPercent: number;
  setPerKillRewardPercent: (value: number) => void;
  commissionPercent: number;
  setCommissionPercent: (value: number) => void;
  matchType: MatchType;
  setMatchType: (type: MatchType) => void;
  selectedMap: MapType;
  setSelectedMap: (map: MapType) => void;
  totalPlayers: number;
  setTotalPlayers: (value: number) => void;
  onReset: () => void;
  preset: Preset;
  onPresetChange: (preset: Preset) => void;
  // AI Props
  onGetAISuggestion: (prompt: string) => void;
  isAISuggesting: boolean;
  aiSuggestion: string;
  aiError: string;
  onOpenStrategy: () => void;
  calculatedPerKill: number; // New prop
}

const NumericInputController: React.FC<{
    propValue: number;
    setPropValue: (value: number) => void;
    id: string;
    options?: { max?: number, disabled?: boolean };
    className?: string;
}> = ({ propValue, setPropValue, id, options, className }) => {
    const { max, disabled } = options ?? {};
    const [displayValue, setDisplayValue] = React.useState(String(propValue));

    React.useEffect(() => {
        const displayAsNumber = parseInt(displayValue, 10);
        if (isNaN(displayAsNumber) && propValue === 0) {
            return;
        }
        if (displayAsNumber !== propValue) {
            setDisplayValue(String(propValue));
        }
    }, [propValue, displayValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/[^0-9]/g, '');
        
        if (max !== undefined) {
            if (parseInt(value, 10) > max) {
                value = String(max);
            }
        }
        
        setDisplayValue(value);
        
        const numericValue = parseInt(value, 10);
        setPropValue(isNaN(numericValue) || numericValue < 0 ? 0 : numericValue);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        if (e.target.value === '0') {
            e.target.select();
        }
    };

    const handleBlur = () => {
        if (displayValue === '') {
            setDisplayValue('0');
        }
    };

    return (
        <input
            id={id}
            type="number"
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            className={className}
            min="0"
            max={max}
        />
    );
};


const CalculatorForm: React.FC<CalculatorFormProps> = ({
  entryFee,
  setEntryFee,
  perKillRewardPercent,
  setPerKillRewardPercent,
  commissionPercent,
  setCommissionPercent,
  matchType,
  setMatchType,
  selectedMap,
  setSelectedMap,
  totalPlayers,
  setTotalPlayers,
  onReset,
  preset,
  onPresetChange,
  onGetAISuggestion,
  isAISuggesting,
  aiSuggestion,
  aiError,
  onOpenStrategy,
  calculatedPerKill
}) => {
  const handleMatchTypeClick = (type: MatchType) => {
    setMatchType(type);
  };
  
  const handleMapChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMap(e.target.value as MapType);
  };

  const handleResetClick = () => {
    onReset();
  };

  return (
    <div className="glass-panel p-6 rounded-xl shadow-xl card-glow animate-slide-in-up" style={{ animationDelay: '200ms' }}>
      <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-4 mb-6">
          <h2 className="text-3xl font-bold text-[var(--color-primary)] uppercase tracking-wider">Configuration</h2>
          <button 
            onClick={onOpenStrategy}
            className="flex items-center gap-2 px-3 py-1 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 rounded-full text-sm border border-yellow-500/30 transition-all cursor-pointer"
          >
            <span>💡 Business Strategy</span>
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Money & Commission */}
          <div className="space-y-6">
                <div className="animate-slide-in-up" style={{ animationDelay: '300ms' }}>
                    <label className="text-xl font-medium text-white flex justify-between items-end mb-2" htmlFor="entryFee">
                        <span>Entry Fee (PKR)</span>
                        <span className="text-sm text-[var(--color-primary)]">Per Player</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-xl">₨</span>
                        <NumericInputController
                            id="entryFee"
                            propValue={entryFee}
                            setPropValue={setEntryFee}
                            className="w-full bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-lg py-4 pl-10 pr-4 text-white text-2xl font-bold focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition outline-none"
                        />
                    </div>
                </div>

                <div className="bg-[var(--color-surface-light)] p-4 rounded-lg border border-[var(--color-border)] animate-slide-in-up" style={{ animationDelay: '400ms' }}>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-lg text-[var(--color-text-base)]">Organizer Commission</label>
                        <span className="text-2xl font-bold text-[var(--color-primary)]">{commissionPercent}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="50" 
                        step="1"
                        value={commissionPercent}
                        onChange={(e) => setCommissionPercent(Number(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs mt-1">
                        <span className="text-gray-500">Low (10%)</span>
                        <span className="text-yellow-500">Rec (40%)</span>
                        <span className="text-red-500">Max (50%)</span>
                    </div>
                </div>

                <div className="bg-[var(--color-surface-light)] p-4 rounded-lg border border-[var(--color-border)] animate-slide-in-up" style={{ animationDelay: '500ms' }}>
                    <div className="flex justify-between items-center mb-3">
                        <label className="text-lg text-[var(--color-text-base)]">Prize Pool Split</label>
                        <div className="px-3 py-1 bg-[var(--color-bg)] rounded border border-[var(--color-border)]">
                             <span className="text-sm text-[var(--color-text-muted)] uppercase mr-2">Per Kill:</span>
                             <span className="text-xl font-bold text-[var(--color-success)]">₨ {calculatedPerKill}</span>
                        </div>
                    </div>
                    
                    <div className="flex justify-between text-sm mb-1 text-[var(--color-text-muted)]">
                        <span>Rank ({100 - perKillRewardPercent}%)</span>
                        <span>Kill ({perKillRewardPercent}%)</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="90" 
                        step="5"
                        value={perKillRewardPercent}
                        onChange={(e) => setPerKillRewardPercent(Number(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
          </div>

          {/* Right Column: Game Settings */}
          <div className="space-y-6">
               <div className="animate-slide-in-up" style={{ animationDelay: '600ms' }}>
                    <label className="block text-lg font-medium text-[var(--color-text-base)] mb-2">Distribution Style</label>
                    <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(PRESET_CONFIGS) as Preset[]).map((p) => (
                        <button
                        key={p}
                        onClick={() => onPresetChange(p)}
                        className={`py-3 text-lg font-bold uppercase rounded-lg transition-all duration-300 ${
                            preset === p
                            ? 'bg-[var(--color-primary)] text-white shadow-lg button-glow-active transform scale-105'
                            : 'bg-[var(--color-surface-light)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-white'
                        }`}
                        >
                        {p}
                        </button>
                    ))}
                    </div>
                </div>

                <div className="animate-slide-in-up" style={{ animationDelay: '700ms' }}>
                    <label className="block text-lg font-medium text-[var(--color-text-base)] mb-2">Match Type</label>
                    <div className="grid grid-cols-3 gap-2">
                    {MATCH_TYPES.map((type) => (
                        <button
                        key={type}
                        onClick={() => handleMatchTypeClick(type)}
                        className={`py-3 text-lg font-bold uppercase rounded-lg transition-all duration-300 ${
                            matchType === type
                            ? 'bg-[var(--color-primary)] text-white shadow-lg'
                            : 'bg-[var(--color-surface-light)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-white'
                        }`}
                        >
                        {type}
                        </button>
                    ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end animate-slide-in-up" style={{ animationDelay: '800ms' }}>
                    <div>
                        <label htmlFor="map" className="block text-lg font-medium text-[var(--color-text-base)] mb-2">Map Selection</label>
                        <select
                        id="map"
                        value={selectedMap}
                        onChange={handleMapChange}
                        className="w-full bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-lg p-3 text-white text-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition outline-none"
                        >
                        {MAP_OPTIONS.map((map) => (
                            <option key={map} value={map}>{map}</option>
                        ))}
                        </select>
                    </div>
                    <div className="sm:w-32">
                        <label htmlFor="totalPlayers" className="block text-lg font-medium text-[var(--color-text-base)] sm:text-center mb-2">Players</label>
                        <NumericInputController
                            id="totalPlayers"
                            propValue={totalPlayers}
                            setPropValue={setTotalPlayers}
                            options={{ max: 100 }}
                            className="w-full bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-lg p-3 text-center text-white text-xl focus:ring-2 focus:ring-[var(--color-primary)] transition outline-none"
                        />
                    </div>
                </div>
          </div>
      </div>
      
      <div className="mt-8 pt-4 border-t border-[var(--color-border)] animate-slide-in-up" style={{ animationDelay: '900ms' }}>
         <AISuggestionBox
            onGetSuggestion={onGetAISuggestion}
            isSuggesting={isAISuggesting}
            suggestion={aiSuggestion}
            error={aiError}
          />
      </div>

      <div className="mt-6">
        <button
          onClick={handleResetClick}
          className="w-full text-[var(--color-text-muted)] hover:text-[var(--color-danger)] py-2 text-lg uppercase transition-colors"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default CalculatorForm;