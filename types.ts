
export enum MatchType {
  SOLO = 'Solo',
  DUO = 'Duo',
  SQUAD = 'Squad',
}

export enum MapType {
  ERANGEL = 'Erangel',
  MIRAMAR = 'Miramar',
  SANHOK = 'Sanhok',
  VIKENDI = 'Vikendi',
  LIVIK = 'Livik',
}

export interface RankReward {
  rank: number;
  reward: number;
  multiplier: number;
}

export interface MatchRecord {
  id: string;
  date: string;
  map: MapType;
  mode: MatchType;
  entryFee: number;
  totalPlayers: number;
  totalPool: number;
  totalPayout: number;
  profit: number;
}
