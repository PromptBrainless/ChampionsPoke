import React, { useState, useEffect } from 'react';
import { Card, TypeBadge, Badge, Button, Input } from '../ui';
import { pokeApi } from '../../lib/api';
import { TrendingUp, BarChart3, Users } from 'lucide-react';

interface UsageData {
  rank: number;
  pokemon: string;
  usage: number;
  types: string[];
  change?: number;
  sprite?: string;
}

interface Props {
  onSelect?: (pokemon: UsageData) => void;
}

// Mock usage data based on typical VGC 2026 meta
const MOCK_USAGE_DATA: UsageData[] = [
  { rank: 1, pokemon: 'flutterMane', usage: 43.8, types: ['ghost', 'fairy'], change: -0.5 },
  { rank: 2, pokemon: 'incineroar', usage: 35.8, types: ['fire', 'dark'], change: 2.1 },
  { rank: 3, pokemon: 'garchomp', usage: 40.4, types: ['dragon', 'ground'], change: 0 },
  { rank: 4, pokemon: 'kingambit', usage: 38.2, types: ['dark', 'steel'], change: 1.2 },
  { rank: 5, pokemon: 'basculegion', usage: 38.2, types: ['water', 'ghost'], change: 3.5 },
  { rank: 6, pokemon: 'sneasler', usage: 43.8, types: ['fighting', 'poison'], change: -1.2 },
  { rank: 7, pokemon: 'whimsicott', usage: 36.4, types: ['grass', 'fairy'], change: 0.8 },
  { rank: 8, pokemon: 'pelipper', usage: 15.7, types: ['water', 'flying'], change: 2.3 },
  { rank: 9, pokemon: 'torkoal', usage: 12.5, types: ['fire'], change: -0.3 },
  { rank: 10, pokemon: 'tyranitar', usage: 15.3, types: ['rock', 'dark'], change: 1.8 },
  { rank: 11, pokemon: 'sinistcha', usage: 26.9, types: ['grass', 'ghost'], change: 4.2 },
  { rank: 12, pokemon: 'rotom-wash', usage: 13.5, types: ['electric', 'water'], change: -2.1 },
  { rank: 13, pokemon: 'farigiraf', usage: 13.2, types: ['normal', 'psychic'], change: 1.5 },
  { rank: 14, pokemon: 'ampharos', usage: 8.5, types: ['electric'], change: -0.8 },
  { rank: 15, pokemon: 'charizard', usage: 17.9, types: ['fire', 'flying'], change: 2.7 },
];

const TYPE_USAGE = [
  { type: 'fairy', usage: 18.5, commonPokemon: ['flutterMane', 'sylveon', 'whimsicott'] },
  { type: 'fire', usage: 22.3, commonPokemon: ['incineroar', 'torkoal', 'charizard'] },
  { type: 'water', usage: 25.1, commonPokemon: ['basculegion', 'pelipper', 'rotom-wash'] },
  { type: 'ghost', usage: 19.8, commonPokemon: ['flutterMane', 'basculegion', 'sinistcha'] },
  { type: 'dragon', usage: 15.2, commonPokemon: ['garchomp', 'dragonite', 'dragapult'] },
  { type: 'dark', usage: 16.7, commonPokemon: ['incineroar', 'kingambit', 'tyranitar'] },
  { type: 'steel', usage: 14.3, commonPokemon: ['kingambit', 'corviknight', 'scizor'] },
  { type: 'ground', usage: 12.8, commonPokemon: ['garchomp', 'excadrill', 'landorus'] },
];

const TOP_MOVES = [
  { move: 'Protect', usage: 85.2 },
  { move: 'Fake Out', usage: 32.5 },
  { move: 'Earthquake', usage: 28.7 },
  { move: 'Rock Slide', usage: 24.3 },
  { move: 'Draco Meteor', usage: 18.9 },
  { move: 'Moonblast', usage: 22.1 },
  { move: 'Flare Blitz', usage: 19.5 },
  { move: 'Parting Shot', usage: 15.3 },
  { move: 'Will-O-Wisp', usage: 12.8 },
  { move: 'Icy Wind', usage: 14.2 },
];

const TOP_ITEMS = [
  { item: 'Focus Sash', usage: 18.5 },
  { item: 'Choice Specs', usage: 12.3 },
  { item: 'Choice Band', usage: 10.8 },
  { item: 'Life Orb', usage: 9.7 },
  { item: 'Leftovers', usage: 8.2 },
  { item: 'Rocky Helmet', usage: 7.5 },
  { item: 'Assault Vest', usage: 6.9 },
  { item: 'Heavy-Duty Boots', usage: 5.8 },
];

export const MetaAnalysis: React.FC<Props> = ({ onSelect }) => {
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'usage' | 'rank' | 'change'>('usage');
  const [selectedFormat, setSelectedFormat] = useState('VGC 2026 Reg M-A');

  useEffect(() => {
    loadUsageData();
  }, []);

  const loadUsageData = async () => {
    setLoading(true);
    const data: UsageData[] = MOCK_USAGE_DATA;

    // Load sprites for top 15
    for (let i = 0; i < data.length; i++) {
      try {
        const pokemon = await pokeApi.getPokemonByName(data[i].pokemon);
        data[i].sprite = pokemon.sprites?.other?.['official-artwork']?.front_default || pokemon.sprites?.front_default;
      } catch (e) {
        console.error('Failed to load sprite for:', data[i].pokemon);
      }
    }

    setUsageData(data);
    setLoading(false);
  };

  const sortedData = [...usageData].sort((a, b) => {
    if (sortBy === 'usage') return b.usage - a.usage;
    if (sortBy === 'rank') return a.rank - b.rank;
    if (sortBy === 'change') return (b.change || 0) - (a.change || 0);
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">VGC 2026 Usage Statistics</h2>
          <p className="text-slate-400 text-sm">Based on tournament and ladder data</p>
        </div>
        <select
          className="px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white"
          value={selectedFormat}
          onChange={e => setSelectedFormat(e.target.value)}
        >
          <option value="VGC 2026 Reg M-A" className="bg-slate-800">VGC 2026 Reg M-A</option>
          <option value="VGC 2026 Reg L" className="bg-slate-800">VGC 2026 Reg L</option>
          <option value="VGC 2026 Reg K" className="bg-slate-800">VGC 2026 Reg K</option>
        </select>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/20">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">15,847</div>
            <div className="text-sm text-slate-400">Teams Analyzed</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/20">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">156</div>
            <div className="text-sm text-slate-400">Tournaments</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-yellow-500/20">
            <BarChart3 className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">89.3%</div>
            <div className="text-sm text-slate-400">Top 10 Usage</div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Top Pokemon Usage</h3>
            <select
              className="text-sm px-2 py-1 bg-slate-900/50 border border-slate-700 rounded text-white"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
            >
              <option value="usage" className="bg-slate-800">By Usage %</option>
              <option value="rank" className="bg-slate-800">By Rank</option>
              <option value="change" className="bg-slate-800">By Change</option>
            </select>
          </div>

          <div className="space-y-2">
            {sortedData.slice(0, 10).map(pokemon => (
              <div
                key={pokemon.pokemon}
                className="flex items-center gap-3 p-2 hover:bg-slate-700/30 rounded-lg cursor-pointer transition-colors"
                onClick={() => onSelect?.(pokemon)}
              >
                <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center text-sm font-bold text-slate-400">
                  {pokemon.rank}
                </div>
                {pokemon.sprite ? (
                  <img src={pokemon.sprite} alt={pokemon.pokemon} className="w-10 h-10 object-contain" />
                ) : (
                  <div className="w-10 h-10 bg-slate-700 rounded" />
                )}
                <div className="flex-1">
                  <div className="font-medium text-white capitalize">{pokemon.pokemon}</div>
                  <div className="flex gap-1">
                    {pokemon.types.map(t => (
                      <TypeBadge key={t} type={t} size="sm" />
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white">{pokemon.usage}%</div>
                  {pokemon.change !== undefined && (
                    <div className={`text-xs ${pokemon.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {pokemon.change >= 0 ? '+' : ''}{pokemon.change}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Type Distribution</h3>
            <div className="space-y-2">
              {TYPE_USAGE.slice(0, 8).map(type => (
                <div key={type.type} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <TypeBadge type={type.type} />
                    <span className="text-slate-300">{type.usage}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${type.usage * 2}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Top Moves</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {TOP_MOVES.slice(0, 8).map(move => (
                <div key={move.move} className="flex justify-between items-center p-2 bg-slate-900/50 rounded">
                  <span className="text-slate-300">{move.move}</span>
                  <span className="font-bold text-blue-400">{move.usage}%</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Top Items</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {TOP_ITEMS.slice(0, 8).map(item => (
                <div key={item.item} className="flex justify-between items-center p-2 bg-slate-900/50 rounded">
                  <span className="text-slate-300">{item.item}</span>
                  <span className="font-bold text-emerald-400">{item.item}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
