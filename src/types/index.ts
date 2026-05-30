export interface BaseStats {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface EVs {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface IVs {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface PokemonBuild {
  pokemon_id: number;
  pokemon_name: string;
  nickname?: string;
  level: number;
  ability?: string;
  item?: string;
  nature: string;
  moves: string[];
  evs: EVs;
  ivs: IVs;
  tera_type?: string;
  position: number;
}

export interface Team {
  id?: string;
  name: string;
  description?: string;
  format: string;
  is_public?: boolean;
  members: PokemonBuild[];
}

export interface Move {
  name: string;
  type: string;
  power: number;
  category: 'physical' | 'special' | 'status';
  accuracy?: number;
  pp?: number;
}

export interface DamageResult {
  min: number;
  max: number;
  percentage: {
    min: number;
    max: number;
  };
  effectiveness: number;
}

export interface TeamAnalysis {
  defensive: {
    weaknesses: Record<string, number>;
    resistances: Record<string, number>;
    immunities: Record<string, number>;
    coverage: number;
  };
  offensive: {
    hitSuperEffective: string[];
    hitNeutral: string[];
    cantHit: string[];
    coverage: number;
  };
  synergy: {
    score: number;
    suggestions: string[];
  };
  balance: {
    physical: number;
    special: number;
    speed: number;
    bulk: number;
  };
}

export interface NewsArticle {
  id: number;
  title: string;
  content?: string;
  url: string;
  source: string;
  published_at?: string;
}

export const NATURES = [
  { name: 'Hardy', increase: null, decrease: null },
  { name: 'Lonely', increase: 'atk', decrease: 'def' },
  { name: 'Brave', increase: 'atk', decrease: 'spe' },
  { name: 'Adamant', increase: 'atk', decrease: 'spa' },
  { name: 'Naughty', increase: 'atk', decrease: 'spd' },
  { name: 'Bold', increase: 'def', decrease: 'atk' },
  { name: 'Docile', increase: null, decrease: null },
  { name: 'Relaxed', increase: 'def', decrease: 'spe' },
  { name: 'Impish', increase: 'def', decrease: 'spa' },
  { name: 'Lax', increase: 'def', decrease: 'spd' },
  { name: 'Timid', increase: 'spe', decrease: 'atk' },
  { name: 'Hasty', increase: 'spe', decrease: 'def' },
  { name: 'Serious', increase: null, decrease: null },
  { name: 'Jolly', increase: 'spe', decrease: 'spa' },
  { name: 'Naive', increase: 'spe', decrease: 'spd' },
  { name: 'Modest', increase: 'spa', decrease: 'atk' },
  { name: 'Mild', increase: 'spa', decrease: 'def' },
  { name: 'Quiet', increase: 'spa', decrease: 'spe' },
  { name: 'Rash', increase: 'spa', decrease: 'spd' },
  { name: 'Calm', increase: 'spd', decrease: 'atk' },
  { name: 'Gentle', increase: 'spd', decrease: 'def' },
  { name: 'Sassy', increase: 'spd', decrease: 'spe' },
  { name: 'Careful', increase: 'spd', decrease: 'spa' },
  { name: 'Quirky', increase: null, decrease: null },
] as const;

export const FORMATS = [
  { id: 'vgc2026', name: 'VGC 2026' },
  { id: 'doubles', name: 'Doubles' },
  { id: 'singles', name: 'Singles' },
] as const;

export const TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
] as const;
