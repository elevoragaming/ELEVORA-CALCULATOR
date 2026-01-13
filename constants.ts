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
export const PRESET_CONFIGS = {
  Balanced: {
    // 50% Kill Split means Rank 1 relies on weight.
    // Weight 20 in a pool of ~100 = 20%. 
    perKillRewardPercent: 50, 
    multipliers100: [25, 15, 12, 10, 8, 8, 7, 7, 6, 6], 
    multipliers50: [35, 20, 15, 12, 12, 11],
  },
  TopHeavy: {
    // 20% Kill Split means BIG Rank pool.
    // Weight 30 = 30% of BIG pool -> HUGE Prize.
    perKillRewardPercent: 20,
    multipliers100: [35, 20, 15, 10, 8, 6, 5, 4, 3, 2],
    multipliers50: [45, 25, 15, 10, 5, 2],
  },
  KillFocused: {
    // 70% Kill Split means tiny Rank pool.
    // Rank 1 needs a huge chunk (40%) of the tiny pool to look decent.
    perKillRewardPercent: 70,
    multipliers100: [40, 20, 15, 10, 5, 3, 2, 2, 2, 1],
    multipliers50: [45, 25, 20, 5, 3, 2],
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