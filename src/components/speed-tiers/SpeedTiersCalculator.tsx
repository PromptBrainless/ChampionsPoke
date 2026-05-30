import React, { useState, useEffect } from 'react';
import { Card, Input, Button, TypeBadge, Badge, Select } from '../ui';
import { pokeApi } from '../../lib/api';
import { calculateSpeed, NATURES_WITH_EFFECTS } from '../../lib/utils';

interface SpeedEntry {
  id: number;
  name: string;
  types: string[];
  baseSpeed: number;
  evs: number;
  nature: string;
  level: number;
  item?: string;
  ability?: string;
  finalSpeed: number;
  sprite?: string;
}

interface Props {
  preselectedTeam?: any[];
}

export const SpeedTiersCalculator: React.FC<Props> = ({ preselectedTeam = [] }) => {
  const [entries, setEntries] = useState<SpeedEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [customPokemon, setCustomPokemon] = useState('');
  const [selectedNature, setSelectedNature] = useState('jolly');
  const [selectedEvs, setSelectedEvs] = useState(252);
  const [selectedLevel, setSelectedLevel] = useState(50);
  const [metaThreshold, setMetaThreshold] = useState(120);
  const [sortBy, setSortBy] = useState<'speed' | 'name'>('speed');

  const metaSpeedPokemon = [
    { name: 'dragapult', baseSpe: 142, evs: 252, nature: 'jolly', item: '' },
    { name: 'greninja', baseSpe: 122, evs: 252, nature: 'jolly', item: '' },
    { name: 'flutterMane', baseSpe: 135, evs: 252, nature: 'timid', item: '' },
    { name: 'ironBundle', baseSpe: 124, evs: 252, nature: 'timid', item: '' },
    { name: 'ninetales-alola', baseSpe: 109, evs: 252, nature: 'timid', item: '' },
    { name: 'whimsicott', baseSpe: 116, evs: 252, nature: 'timid', item: '' },
    { name: 'incineroar', baseSpe: 60, evs: 252, nature: 'jolly', item: '' },
    { name: 'garchomp', baseSpe: 102, evs: 252, nature: 'jolly', item: '' },
    { name: 'kingambit', baseSpe: 50, evs: 252, nature: 'jolly', item: '' },
    { name: 'ampharos', baseSpe: 55, evs: 0, nature: 'quiet', item: '' },
    { name: 'torkoal', baseSpe: 20, evs: 0, nature: 'quiet', item: '' },
    { name: 'ironHands', baseSpe: 43, evs: 252, nature: 'adamant', item: '' },
    { name: 'palafin', baseSpe: 60, evs: 252, nature: 'adamant', item: '' },
    { name: 'charizard', baseSpe: 100, evs: 252, nature: 'timid', item: '' },
    { name: 'tyranitar', baseSpe: 61, evs: 252, nature: 'jolly', item: '' },
    { name: 'basculegion', baseSpe: 60, evs: 252, nature: 'adamant', item: '' },
    { name: 'sneasler', baseSpe: 120, evs: 252, nature: 'jolly', item: '' },
    { name: 'urshifu', baseSpe: 97, evs: 252, nature: 'jolly', item: '' },
    { name: 'rillaboom', baseSpe: 85, evs: 252, nature: 'jolly', item: '' },
    { name: 'farigiraf', baseSpe: 73, evs: 252, nature: 'adamant', item: '' },
  ];

  useEffect(() => {
    loadMetaSpeeds();
  }, []);

  const loadMetaSpeeds = async () => {
    setLoading(true);
    const parsed: SpeedEntry[] = [];

    for (const meta of metaSpeedPokemon) {
      try {
        const pokemon = await pokeApi.getPokemonByName(meta.name);
        const baseSpe = pokemon.stats.find((s: any) => s.stat.name === 'speed')?.base_stat || 0;
        const finalSpeed = calculateSpeed(baseSpe, 31, meta.evs, 50, meta.nature, 0, meta.item);

        parsed.push({
          id: pokemon.id,
          name: meta.name,
          types: pokemon.types.map((t: any) => t.type.name),
          baseSpeed: baseSpe,
          evs: meta.evs,
          nature: meta.nature,
          level: 50,
          finalSpeed,
          sprite: pokemon.sprites?.other?.['official-artwork']?.front_default || pokemon.sprites?.front_default,
        });
      } catch (e) {
        console.error('Failed to load:', meta.name);
      }
    }

    const sorted = parsed.sort((a, b) => b.finalSpeed - a.finalSpeed);
    setEntries(sorted);
    setLoading(false);
  };

  const addCustomPokemon = async () => {
    if (!customPokemon.trim()) return;

    setLoading(true);
    try {
      const pokemon = await pokeApi.getPokemonByName(customPokemon);
      const baseSpe = pokemon.stats.find((s: any) => s.stat.name === 'speed')?.base_stat || 0;
      const finalSpeed = calculateSpeed(baseSpe, 31, selectedEvs, selectedLevel, selectedNature, 0);

      const newEntry: SpeedEntry = {
        id: pokemon.id,
        name: customPokemon.toLowerCase(),
        types: pokemon.types.map((t: any) => t.type.name),
        baseSpeed: baseSpe,
        evs: selectedEvs,
        nature: selectedNature,
        level: selectedLevel,
        finalSpeed,
        sprite: pokemon.sprites?.other?.['official-artwork']?.front_default || pokemon.sprites?.front_default,
      };

      setEntries(prev => [...prev, newEntry].sort((a, b) => b.finalSpeed - a.finalSpeed));
      setCustomPokemon('');
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const removeEntry = (id: number) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const sortedEntries = [...entries].sort((a, b) => {
    if (sortBy === 'speed') return b.finalSpeed - a.finalSpeed;
    return a.name.localeCompare(b.name);
  });

  const speedTiers = [
    { label: 'Outspeeds everything (Tailwind +Max)', min: 300 },
    { label: 'Tailwind', min: 200 },
    { label: 'Choice Scarf', min: 180 },
    { label: 'Base 120+Spe / JollyMax', min: 170 },
    { label: 'Base 110Spe / Jolly', min: 156 },
    { label: 'Base 100Spe / Jolly', min: 150 },
    { label: 'Base 90-95Spe / Jolly', min: 145 },
    { label: 'Base 80-85Spe / Jolly', min: 135 },
    { label: 'Base 70Spe / Jolly', min: 125 },
    { label: 'Trick Room Tier (under 100)', min: 0, max: 100 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 md:col-span-2">
          <div className="flex flex-wrap gap-3 items-end">
            <Input
              placeholder="Add Pokemon to speed tier..."
              value={customPokemon}
              onChange={e => setCustomPokemon(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomPokemon()}
              className="flex-1"
            />
            <Select
              options={Object.keys(NATURES_WITH_EFFECTS).map(n => ({
                value: n,
                label: n.charAt(0).toUpperCase() + n.slice(1),
              }))}
              value={selectedNature}
              onChange={e => setSelectedNature(e.target.value)}
            />
            <Input
              type="number"
              placeholder="EVs"
              min={0}
              max={252}
              value={selectedEvs}
              onChange={e => setSelectedEvs(parseInt(e.target.value) || 0)}
              className="w-20"
            />
            <Input
              type="number"
              placeholder="Lv"
              min={1}
              max={100}
              value={selectedLevel}
              onChange={e => setSelectedLevel(parseInt(e.target.value) || 50)}
              className="w-20"
            />
            <Button onClick={addCustomPokemon} loading={loading}>
              Add
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Select
                options={[
                  { value: 'speed', label: 'Sort by Speed' },
                  { value: 'name', label: 'Sort by Name' },
                ]}
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
              />
              <Button variant="secondary" onClick={() => setEntries([])} size="sm">
                Clear
              </Button>
            </div>
            <div className="text-sm text-slate-400">
              Filter: Speed above
              <Input
                type="number"
                value={metaThreshold}
                onChange={e => setMetaThreshold(parseInt(e.target.value) || 100)}
                className="mt-1"
              />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Speed Tiers</h2>
          <Badge variant="info">{entries.length} Pokemon</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-700">
              <tr className="text-left text-slate-400">
                <th className="pb-2 font-medium">Rank</th>
                <th className="pb-2 font-medium">Pokemon</th>
                <th className="pb-2 font-medium">Types</th>
                <th className="pb-2 font-medium text-center">Base Spe</th>
                <th className="pb-2 font-medium text-center">EVs</th>
                <th className="pb-2 font-medium">Nature</th>
                <th className="pb-2 font-medium text-right">Final Speed</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sortedEntries.filter(e => e.finalSpeed >= metaThreshold).map((entry, index) => (
                <tr
                  key={`${entry.id}-${entry.evs}-${entry.nature}`}
                  className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                >
                  <td className="py-3 text-slate-400">#{index + 1}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      {entry.sprite && (
                        <img src={entry.sprite} alt={entry.name} className="w-10 h-10 object-contain" />
                      )}
                      <span className="font-medium text-white capitalize">{entry.name}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      {entry.types.map(t => <TypeBadge key={t} type={t} size="sm" />)}
                    </div>
                  </td>
                  <td className="py-3 text-center text-slate-300">{entry.baseSpeed}</td>
                  <td className="py-3 text-center text-slate-300">{entry.evs}</td>
                  <td className="py-3 capitalize text-slate-400">{entry.nature}</td>
                  <td className="py-3 text-right">
                    <span className={`text-lg font-bold ${
                      entry.finalSpeed >= 170 ? 'text-emerald-400' :
                      entry.finalSpeed >= 150 ? 'text-blue-400' :
                      entry.finalSpeed >= 130 ? 'text-yellow-400' :
                      'text-slate-300'
                    }`}>
                      {entry.finalSpeed}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => removeEntry(entry.id)} className="text-red-400">
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Speed Tier Reference</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
          {speedTiers.map(tier => (
            <div key={tier.label} className="flex justify-between items-center px-3 py-2 bg-slate-900/50 rounded">
              <span className="text-slate-400">{tier.label}</span>
              <span className="font-bold text-blue-400">{tier.min > 1000 ? '' : `${tier.max || '+' + tier.min}`}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
