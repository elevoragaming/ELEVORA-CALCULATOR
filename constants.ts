import { MapType, MatchType } from './types';

export const MAP_PLAYER_COUNTS = {
  [MapType.ERANGEL]: 100,
  [MapType.MIRAMAR]: 100,
  [MapType.SANHOK]: 100,
  [MapType.VIKENDI]: 100,
  [MapType.LIVIK]: 50,
};

export const MATCH_TYPES = [MatchType.SOLO, MatchType.DUO, MatchType.SQUAD];

export const MAP_OPTIONS = [
  MapType.ERANGEL,
  MapType.MIRAMAR,
  MapType.SANHOK,
  MapType.VIKENDI,
  MapType.LIVIK,
];

// Weights for distribution logic.
// Calibrated for ~40% Commission scenarios to hit specific Multipliers.
export const PRESET_CONFIGS = {
  Balanced: {
    // Target: Rank 1 = 5x Entry Fee
    // Logic: With 40% comm & 50% kill split, Placement Pot is small. 
    // We need a moderate slice for Rank 1 to hit 5x.
    perKillRewardPercent: 50, 
    // Rank 1 gets ~20% of Placement Pot
    multipliers100: [20, 15, 12, 10, 8, 8, 7, 7, 6, 6], 
    multipliers50: [30, 20, 15, 12, 12, 11],
  },
  TopHeavy: {
    // Target: Rank 1 = 12x Entry Fee
    // Logic: Lower kill reward allows massive placement pool.
    perKillRewardPercent: 20,
    // Rank 1 gets ~25% of Placement Pot. 
    // (Total Pool * 0.6 * 0.8 * 0.25) ≈ 12% of Total = 12x Entry
    multipliers100: [25, 18, 12, 10, 8, 7, 6, 5, 5, 4],
    multipliers50: [40, 25, 15, 10, 5, 5],
  },
  KillFocused: {
    // Target: Rank 1 = 3x Entry Fee
    // Logic: Huge kill split (70%) leaves tiny placement pot.
    perKillRewardPercent: 70,
    // Rank 1 needs a huge chunk of the TINY placement pot to even reach 3x.
    multipliers100: [25, 20, 15, 10, 8, 6, 4, 4, 4, 4],
    multipliers50: [30, 25, 20, 15, 5, 5],
  },
};

export const TOURNAMENT_PRESETS = {
  ProLeague: {
    label: "Pro League (Top 16)",
    description: "Standard competitive distribution. Wide payout.",
    weights: [20, 12, 9, 8, 7, 6, 5, 4, 3.5, 3.5, 3, 3, 2.5, 2.5, 2, 2] // Sum ~93
  },
  PodiumFocus: {
    label: "Podium Only (Top 3)",
    description: "High stakes for the winners.",
    weights: [50, 30, 20] // Sum 100
  },
  TopFive: {
    label: "Top 5 Split",
    description: "Balanced for smaller tournaments.",
    weights: [40, 25, 15, 10, 10] // Sum 100
  }
};