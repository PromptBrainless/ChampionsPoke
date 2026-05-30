import React, { useState, useEffect } from 'react';
import { Button, Card, Select, Input, TypeBadge, Badge, Spinner } from '../ui';
import { damageApi, pokeApi } from '../../lib/api';
import { NATURES, TYPES, EVs, IVs, BaseStats } from '../../types';

interface DamageCalculatorProps {
  preselectedAttacker?: number;
  preselectedDefender?: number;
}

interface PokemonState {
  pokemon: any | null;
  types: string[];
  stats: BaseStats;
  evs: EVs;
  ivs: IVs;
  nature: string;
  level: number;
  item: string;
  ability: string;
}

const defaultEvs: EVs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
const defaultIvs: IVs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };

const PokemonSlot: React.FC<{
  label: string;
  state: PokemonState;
  onChange: (state: Partial<PokemonState>) => void;
  onPokemonSelect: (name: string) => void;
}> = ({ label, state, onChange, onPokemonSelect }) => {
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      await onPokemonSelect(search);
      setSearch('');
    } catch (e) {
      console.error(e);
    }
    setSearching(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">{label}</h3>

      <div className="flex gap-2">
        <Input
          placeholder="Search Pokemon..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} loading={searching} size="md">
          Search
        </Button>
      </div>

      {state.pokemon && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-4">
            <img
              src={state.pokemon.sprites?.other?.['official-artwork']?.front_default || state.pokemon.sprites?.front_default}
              alt={state.pokemon.name}
              className="w-24 h-24 object-contain"
            />
            <div className="space-y-1">
              <h4 className="text-xl font-bold text-white capitalize">{state.pokemon.name}</h4>
              <div className="flex gap-1">
                {state.types.map(t => (
                  <TypeBadge key={t} type={t} />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Level"
              type="number"
              min={1}
              max={100}
              value={state.level}
              onChange={e => onChange({ level: parseInt(e.target.value) || 50 })}
            />
            <Select
              label="Nature"
              options={NATURES.map(n => ({ value: n.name.toLowerCase(), label: n.name }))}
              value={state.nature}
              onChange={e => onChange({ nature: e.target.value })}
            />
            <Input
              label="Item"
              placeholder="None"
              value={state.item}
              onChange={e => onChange({ item: e.target.value })}
            />
            <Input
              label="Ability"
              placeholder="None"
              value={state.ability}
              onChange={e => onChange({ ability: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <h5 className="text-sm font-medium text-slate-300">Effort Values (EVs)</h5>
            <div className="grid grid-cols-2 gap-2">
              {(['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const).map(stat => (
                <Input
                  key={stat}
                  label={stat.toUpperCase()}
                  type="number"
                  min={0}
                  max={252}
                  value={state.evs[stat]}
                  onChange={e => onChange({ evs: { ...state.evs, [stat]: parseInt(e.target.value) || 0 } })}
                />
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-400">Total EVs: {Object.values(state.evs).reduce((a, b) => a + b, 0)} / 510</div>
        </Card>
      )}
    </div>
  );
};

export const DamageCalculator: React.FC<DamageCalculatorProps> = ({
  preselectedAttacker,
  preselectedDefender
}) => {
  const [attacker, setAttacker] = useState<PokemonState>({
    pokemon: null,
    types: [],
    stats: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    evs: { ...defaultEvs },
    ivs: { ...defaultIvs },
    nature: 'hardy',
    level: 50,
    item: '',
    ability: '',
  });

  const [defender, setDefender] = useState<PokemonState>({
    pokemon: null,
    types: [],
    stats: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    evs: { ...defaultEvs },
    ivs: { ...defaultIvs },
    nature: 'hardy',
    level: 50,
    item: '',
    ability: '',
  });

  const [selectedMove, setSelectedMove] = useState<any | null>(null);
  const [availableMoves, setAvailableMoves] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  const handlePokemonSelect = (isAttacker: boolean) => async (name: string) => {
    const setData = isAttacker ? setAttacker : setDefender;
    try {
      const pokemon = await pokeApi.getPokemonByName(name);
      const types = pokemon.types.map((t: any) => t.type.name);
      const stats: BaseStats = {
        hp: pokemon.stats.find((s: any) => s.stat.name === 'hp')?.base_stat || 0,
        atk: pokemon.stats.find((s: any) => s.stat.name === 'attack')?.base_stat || 0,
        def: pokemon.stats.find((s: any) => s.stat.name === 'defense')?.base_stat || 0,
        spa: pokemon.stats.find((s: any) => s.stat.name === 'special-attack')?.base_stat || 0,
        spd: pokemon.stats.find((s: any) => s.stat.name === 'special-defense')?.base_stat || 0,
        spe: pokemon.stats.find((s: any) => s.stat.name === 'speed')?.base_stat || 0,
      };

      setData(prev => ({
        ...prev,
        pokemon,
        types,
        stats,
      }));

      if (isAttacker) {
        const moves = await Promise.all(
          pokemon.moves.slice(0, 30).map(async (m: any) => {
            try {
              const moveData = await pokeApi.getMove(m.move.name);
              return {
                name: moveData.name,
                type: moveData.type.name,
                power: moveData.power || 0,
                category: moveData.damage_class.name,
                accuracy: moveData.accuracy,
                pp: moveData.pp,
              };
            } catch {
              return null;
            }
          })
        );
        setAvailableMoves(moves.filter(Boolean).filter((m: any) => m.power > 0));
      }

      setResult(null);
    } catch (e) {
      console.error('Failed to load Pokemon:', e);
    }
  };

  const calculateDamage = async () => {
    if (!attacker.pokemon || !defender.pokemon || !selectedMove) return;

    setCalculating(true);
    try {
      const attackerData = {
        name: attacker.pokemon.name,
        level: attacker.level,
        types: attacker.types,
        nature: attacker.nature,
        evs: attacker.evs,
        ivs: attacker.ivs,
        item: attacker.item,
        ability: attacker.ability,
      };

      const defenderData = {
        name: defender.pokemon.name,
        level: defender.level,
        types: defender.types,
        stats: defender.stats,
      };

      const response = await damageApi.calculate({
        attacker: attackerData,
        defender: defenderData,
        move: selectedMove,
        attackerBaseStats: attacker.stats,
      });

      setResult(response);
    } catch (e) {
      console.error('Calculation failed:', e);
    }
    setCalculating(false);
  };

  useEffect(() => {
    if (preselectedAttacker) {
      handlePokemonSelect(true)(String(preselectedAttacker));
    }
    if (preselectedDefender) {
      handlePokemonSelect(false)(String(preselectedDefender));
    }
  }, [preselectedAttacker, preselectedDefender]);

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <PokemonSlot
          label="Attacker"
          state={attacker}
          onChange={setAttacker}
          onPokemonSelect={handlePokemonSelect(true)}
        />
        <PokemonSlot
          label="Defender"
          state={defender}
          onChange={setDefender}
          onPokemonSelect={handlePokemonSelect(false)}
        />
      </div>

      {attacker.pokemon && availableMoves.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Select Move</h3>
          <div className="flex flex-wrap gap-2">
            {availableMoves.map((move) => (
              <button
                key={move.name}
                onClick={() => setSelectedMove(move)}
                className={`px-3 py-2 rounded-lg border transition-all ${
                  selectedMove?.name === move.name
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                    : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span className="capitalize">{move.name.replace('-', ' ')}</span>
                <div className="flex gap-1 mt-1">
                  <TypeBadge type={move.type} size="sm" />
                  <span className="text-xs text-slate-400">{move.power}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={calculateDamage}
          disabled={!attacker.pokemon || !defender.pokemon || !selectedMove}
          loading={calculating}
        >
          Calculate Damage
        </Button>
      </div>

      {result && (
        <Card className="p-6">
          <h3 className="text-xl font-bold text-white mb-4">Damage Results</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <span className="text-slate-400 text-sm">Damage Range</span>
                <div className="text-3xl font-bold text-white">
                  {result.damage.min} - {result.damage.max}
                </div>
              </div>
              <div>
                <span className="text-slate-400 text-sm">HP Percentage</span>
                <div className="text-2xl font-bold text-emerald-400">
                  {result.damage.percentage.min}% - {result.damage.percentage.max}%
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-slate-400 text-sm">Effectiveness</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {result.damage.effectiveness === 2 ? (
                      <span className="text-emerald-400">2x Super Effective</span>
                    ) : result.damage.effectiveness === 4 ? (
                      <span className="text-emerald-400">4x Super Effective</span>
                    ) : result.damage.effectiveness === 0.5 ? (
                      <span className="text-yellow-400">Not Very Effective</span>
                    ) : result.damage.effectiveness === 0.25 ? (
                      <span className="text-yellow-400">Very Ineffective</span>
                    ) : result.damage.effectiveness === 0 ? (
                      <span className="text-red-400">No Effect</span>
                    ) : (
                      <span className="text-white">Neutral</span>
                    )}
                  </span>
                </div>
              </div>
              {selectedMove && (
                <div className="flex gap-2">
                  <Badge variant={selectedMove.category === 'physical' ? 'danger' : 'info'}>
                    {selectedMove.category}
                  </Badge>
                  <TypeBadge type={selectedMove.type} />
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
