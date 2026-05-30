import { getApiUrl, getHeaders } from './supabase';

export interface PokemonData {
  id: number;
  name: string;
  stats: Array<{
    base_stat: number;
    stat: { name: string };
  }>;
  types: Array<{
    type: { name: string };
  }>;
  abilities: Array<{
    ability: { name: string; url: string };
    is_hidden: boolean;
  }>;
  moves: Array<{
    move: { name: string; url: string };
  }>;
  sprites: {
    front_default: string;
    other: {
      'official-artwork'?: {
        front_default: string;
      };
    };
  };
  height: number;
  weight: number;
}

export interface MoveData {
  id: number;
  name: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  type: { name: string };
  damage_class: { name: string };
  effect_entries: Array<{ short_effect: string }>;
  meta?: {
    crit_rate?: number;
    drain?: number;
    healing?: number;
  };
}

export interface TypeData {
  name: string;
  damage_relations: {
    double_damage_from: Array<{ name: string }>;
    double_damage_to: Array<{ name: string }>;
    half_damage_from: Array<{ name: string }>;
    half_damage_to: Array<{ name: string }>;
    no_damage_from: Array<{ name: string }>;
    no_damage_to: Array<{ name: string }>;
  };
}

export const pokeApi = {
  async getPokemon(id: number): Promise<PokemonData> {
    const response = await fetch(`${getApiUrl('pokeapi')}?id=${id}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async getPokemonByName(name: string): Promise<PokemonData> {
    const response = await fetch(`${getApiUrl('pokeapi')}?name=${encodeURIComponent(name)}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async getPokemonList(limit = 20, offset = 0): Promise<{
    count: number;
    results: PokemonData[];
  }> {
    const response = await fetch(`${getApiUrl('pokeapi')}?limit=${limit}&offset=${offset}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async searchPokemon(query: string): Promise<{ results: PokemonData[] }> {
    const response = await fetch(`${getApiUrl('pokeapi')}?q=${encodeURIComponent(query)}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async getMove(name: string): Promise<MoveData> {
    const response = await fetch(`${getApiUrl('pokeapi')}?move=${encodeURIComponent(name)}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async getTypes(): Promise<TypeData[]> {
    const response = await fetch(`${getApiUrl('pokeapi')}?types`, {
      headers: getHeaders(),
    });
    return response.json();
  },
};

export const damageApi = {
  async calculate(data: {
    attacker: any;
    defender: any;
    move: any;
    conditions?: any;
    attackerBaseStats: any;
  }) {
    const response = await fetch(`${getApiUrl('damage-calc')}?action=calculate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'calculate', ...data }),
    });
    return response.json();
  },

  async calculateStats(pokemon: any, baseStats: any) {
    const response = await fetch(`${getApiUrl('damage-calc')}?action=calculate-stats`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'calculate-stats', pokemon, baseStats }),
    });
    return response.json();
  },

  async getTypeEffectiveness(moveType: string, defenderTypes: string[]) {
    const response = await fetch(`${getApiUrl('damage-calc')}?action=type-effectiveness`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'type-effectiveness', moveType, defenderTypes }),
    });
    return response.json();
  },

  async getNatures() {
    const response = await fetch(`${getApiUrl('damage-calc')}?action=natures`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  async getTypeChart() {
    const response = await fetch(`${getApiUrl('damage-calc')}?action=type-chart`, {
      headers: getHeaders(),
    });
    return response.json();
  },
};

export const teamAnalyzerApi = {
  async analyze(team: any[]) {
    const response = await fetch(`${getApiUrl('team-analyzer')}?action=analyze`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'analyze', team }),
    });
    return response.json();
  },

  async suggestAlternatives(team: any[], pokemonIndex: number) {
    const response = await fetch(`${getApiUrl('team-analyzer')}?action=suggest`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'suggest', team, pokemonIndex }),
    });
    return response.json();
  },

  async rateTeam(team: any[]) {
    const response = await fetch(`${getApiUrl('team-analyzer')}?action=rate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'rate', team }),
    });
    return response.json();
  },

  async getTypeChart() {
    const response = await fetch(`${getApiUrl('team-analyzer')}?action=type-chart`, {
      headers: getHeaders(),
    });
    return response.json();
  },
};
