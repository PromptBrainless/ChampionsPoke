import React, { useState, useEffect, useCallback } from 'react';
import { Card, Input, Button, TypeBadge, StatBar, Badge, Select } from '../ui';
import { pokeApi } from '../../lib/api';

interface PokedexBrowserProps {
  onSelect?: (pokemon: any) => void;
}

interface PokemonSummary {
  id: number;
  name: string;
  types: string[];
  stats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  sprites: { front_default: string; other?: any };
}

export const PokedexBrowser: React.FC<PokedexBrowserProps> = ({ onSelect }) => {
  const [pokemon, setPokemon] = useState<PokemonSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid');
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonSummary | null>(null);

  const LIMIT = 20;

  const fetchPokemon = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pokeApi.getPokemonList(LIMIT, offset);
      if (data.results && data.results.length > 0) {
        const formatted = data.results.map((p: any) => ({
          id: p.id,
          name: p.name,
          types: p.types?.map((t: any) => t.type?.name || t) || [],
          stats: {
            hp: p.stats?.find((s: any) => s.stat?.name === 'hp')?.base_stat || 0,
            atk: p.stats?.find((s: any) => s.stat?.name === 'attack')?.base_stat || 0,
            def: p.stats?.find((s: any) => s.stat?.name === 'defense')?.base_stat || 0,
            spa: p.stats?.find((s: any) => s.stat?.name === 'special-attack')?.base_stat || 0,
            spd: p.stats?.find((s: any) => s.stat?.name === 'special-defense')?.base_stat || 0,
            spe: p.stats?.find((s: any) => s.stat?.name === 'speed')?.base_stat || 0,
          },
          sprites: p.sprites || {},
        }));
        const filtered = formatted.filter((p: PokemonSummary) => {
          if (typeFilter && !p.types.includes(typeFilter)) return false;
          return true;
        });

        if (offset === 0) {
          setPokemon(filtered);
        } else {
          setPokemon(prev => [...prev, ...formatted]);
        }

        setHasMore(data.results.length === LIMIT && offset + LIMIT < data.count);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [offset, typeFilter]);

  useEffect(() => {
    fetchPokemon();
  }, [fetchPokemon]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setOffset(0);
      return;
    }
    setLoading(true);
    try {
      const data = await pokeApi.searchPokemon(searchQuery);
      const formatted = data.results.map((p: any) => ({
        id: p.id,
        name: p.name,
        types: p.types?.map((t: any) => t.type?.name || t) || [],
        stats: {
          hp: p.stats?.find((s: any) => s.stat?.name === 'hp')?.base_stat || 0,
          atk: p.stats?.find((s: any) => s.stat?.name === 'attack')?.base_stat || 0,
          def: p.stats?.find((s: any) => s.stat?.name === 'defense')?.base_stat || 0,
          spa: p.stats?.find((s: any) => s.stat?.name === 'special-attack')?.base_stat || 0,
          spd: p.stats?.find((s: any) => s.stat?.name === 'special-defense')?.base_stat || 0,
          spe: p.stats?.find((s: any) => s.stat?.name === 'speed')?.base_stat || 0,
        },
        sprites: p.sprites || {},
      }));
      setPokemon(formatted);
      setHasMore(false);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const loadMore = () => {
    setOffset(prev => prev + LIMIT);
  };

  const sortedPokemon = [...pokemon].sort((a, b) => {
    if (sortBy === 'id') return a.id - b.id;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'spe') return b.stats.spe - a.stats.spe;
    if (sortBy === 'atk') return b.stats.atk - a.stats.atk;
    if (sortBy === 'spa') return b.stats.spa - a.stats.spa;
    if (sortBy === 'bst') {
      const bstA = Object.values(a.stats).reduce((s, v) => s + v, 0);
      const bstB = Object.values(b.stats).reduce((s, v) => s + v, 0);
      return bstB - bstA;
    }
    return 0;
  });

  const PokemonCard: React.FC<{ p: PokemonSummary }> = ({ p }) => (
    <Card hover className="p-4 group" onClick={() => viewMode === 'grid' && setSelectedPokemon(p)}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="text-xs text-slate-500">#{p.id.toString().padStart(4, '0')}</div>
          <div className="font-semibold text-white capitalize">{p.name}</div>
        </div>
        <img
          src={p.sprites?.other?.['official-artwork']?.front_default || p.sprites?.front_default}
          alt={p.name}
          className="w-20 h-20 object-contain transition-transform group-hover:scale-110"
        />
      </div>
      <div className="flex gap-1 mb-2">
        {p.types.map(t => (
          <TypeBadge key={t} type={t} />
        ))}
      </div>
      {viewMode === 'detail' ? (
        <Button size="sm" onClick={(e) => { e.stopPropagation(); onSelect?.(p); }}>
          Select
        </Button>
      ) : (
        <div className="text-xs text-slate-400">
          BST: {Object.values(p.stats).reduce((s, v) => s + v, 0)}
        </div>
      )}
    </Card>
  );

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <Input
            placeholder="Search Pokemon..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="flex-1 min-w-[200px]"
          />
          <Button onClick={handleSearch} loading={loading} disabled={loading}>
            Search
          </Button>
          <Select
            options={[{ value: '', label: 'All Types' }, ...[
              'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
              'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
              'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
            ].map(t => ({ value: t.toLowerCase(), label: t }))]}
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setOffset(0); }}
          />
          <Select
            options={[
              { value: 'id', label: 'Pokedex #' },
              { value: 'name', label: 'Name' },
              { value: 'spe', label: 'Speed' },
              { value: 'atk', label: 'Attack' },
              { value: 'spa', label: 'Sp. Atk' },
              { value: 'bst', label: 'BST' },
            ]}
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          />
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'detail' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('detail')}
            >
              Detail
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedPokemon.map(p => <PokemonCard key={p.id} p={p} />)}
      </div>

      {hasMore && viewMode === 'grid' && (
        <div className="text-center">
          <Button variant="secondary" onClick={loadMore} disabled={loading} loading={loading}>
            Load More
          </Button>
        </div>
      )}

      {selectedPokemon && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedPokemon(null)}>
          <Card className="p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-sm text-slate-500">#{selectedPokemon.id.toString().padStart(4, '0')}</div>
                <h2 className="text-2xl font-bold text-white capitalize">{selectedPokemon.name}</h2>
              </div>
              <Button variant="ghost" onClick={() => setSelectedPokemon(null)} className="text-slate-400">
                Close
              </Button>
            </div>

            <div className="flex justify-center mb-4">
              <img
                src={selectedPokemon.sprites?.other?.['official-artwork']?.front_default || selectedPokemon.sprites?.front_default}
                alt={selectedPokemon.name}
                className="w-40 h-40 object-contain"
              />
            </div>

            <div className="flex gap-2 justify-center mb-4">
              {selectedPokemon.types.map(t => (
                <TypeBadge key={t} type={t} size="md" />
              ))}
            </div>

            <h3 className="font-semibold text-white mb-2">Base Stats</h3>
            <div className="space-y-2">
              {Object.entries(selectedPokemon.stats).map(([stat, value]) => (
                <div key={stat} className="flex items-center gap-2">
                  <div className="w-14 text-xs text-slate-400 uppercase">{stat}</div>
                  <div className="flex-1">
                    <StatBar stat={value as number} />
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
                <div className="w-14 text-xs text-slate-400 uppercase">BST</div>
                <div className="flex-1 text-right font-bold text-white">
                  {Object.values(selectedPokemon.stats).reduce((s, v) => s + v, 0)}
                </div>
              </div>
            </div>

            {onSelect && (
              <div className="mt-6">
                <Button className="w-full" onClick={() => { onSelect(selectedPokemon); setSelectedPokemon(null); }}>
                  Select Pokemon
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
