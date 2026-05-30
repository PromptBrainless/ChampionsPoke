import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Input, Select, NativeSelect, TypeBadge, Badge, Spinner, Modal, ProgressBar, LoadingOverlay } from '../ui';
import { pokeApi } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { NATURES, EVs, IVs, PokemonBuild } from '../../types';
import { exportTo, parseShowdownPaste, ITEMS } from '../../lib/utils';
import { Search, ChevronDown, Copy, Download, Upload, X, Plus, Settings } from 'lucide-react';

interface TeamMemberProps {
  member?: PokemonBuild;
  position: number;
  onUpdate: (member: Partial<PokemonBuild>) => void;
  onRemove: () => void;
  onSelect: () => void;
}

const TeamMemberSlot: React.FC<TeamMemberProps> = ({
  member,
  position,
  onUpdate,
  onRemove,
  onSelect
}) => {
  const [search, setSearch] = useState(member?.pokemon_name || '');
  const [pokemonData, setPokemonData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showMovePicker, setShowMovePicker] = useState(false);
  const [moveSearch, setMoveSearch] = useState('');

  useEffect(() => {
    if (member?.pokemon_id && !pokemonData) {
      loadPokemon(member.pokemon_id);
    }
  }, [member?.pokemon_id]);

  const loadPokemon = async (id: number | string) => {
    setLoading(true);
    try {
      const data = typeof id === 'string' ? await pokeApi.getPokemonByName(id) : await pokeApi.getPokemon(id);
      setPokemonData(data);
      setSearch(data.name);
      if (!member?.pokemon_id) {
        onUpdate({
          pokemon_id: data.id,
          pokemon_name: data.name,
        });
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSearch = () => {
    if (search.trim()) {
      loadPokemon(search.toLowerCase().trim());
    }
  };

  const isEmpty = !pokemonData;

  const natureOptions = NATURES.map(n => ({
    value: n.name.toLowerCase(),
    label: n.name + (n.increase ? ` (+${n.increase.toUpperCase()}` : '') + (n.decrease ? ` / -${n.decrease.toUpperCase()})` : n.increase ? ')' : ''),
  }));

  return (
    <Card className={`p-4 h-full ${isEmpty ? 'border-dashed border-2 border-slate-600' : 'border-slate-700'} relative`}>
      {loading && <LoadingOverlay />}

      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
            {position + 1}
          </div>
          {!isEmpty && <span className="text-xs text-slate-500 capitalize">{member?.pokemon_name}</span>}
        </div>
        {pokemonData && (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={onSelect} title="Suggest alternatives">
              <Search className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onRemove} className="text-red-400 hover:text-red-300" title="Remove">
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {isEmpty ? (
        <div className="py-4">
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-700/50 flex items-center justify-center mb-2">
              <Plus className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-sm text-slate-500">Add Pokemon</p>
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Search Pokemon..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              icon={<Search className="w-4 h-4" />}
            />
            <Button onClick={handleSearch} loading={loading} className="w-full" size="sm">
              Add Pokemon
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-3 items-start">
            <img
              src={pokemonData.sprites?.other?.['official-artwork']?.front_default || pokemonData.sprites?.front_default}
              alt={member?.pokemon_name}
              className="w-20 h-20 object-contain drop-shadow-lg"
            />
            <div className="flex-1 min-w-0 space-y-2">
              <Input
                placeholder="Nickname"
                value={member?.nickname || ''}
                onChange={e => onUpdate({ nickname: e.target.value })}
                className="text-sm"
              />
              <div className="flex flex-wrap gap-1">
                {pokemonData.types.map((t: any) => (
                  <TypeBadge key={t.type.name} type={t.type.name} size="sm" />
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-1 py-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <Settings className="w-3 h-3" />
            {expanded ? 'Hide Details' : 'Edit EVs, Moves, Nature'}
            <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>

          {expanded && (
            <div className="space-y-3 pt-3 border-t border-slate-700/50">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Level"
                  type="number"
                  min={1}
                  max={100}
                  value={member?.level || 50}
                  onChange={e => onUpdate({ level: parseInt(e.target.value) || 50 })}
                />
                <Select
                  label="Nature"
                  options={natureOptions}
                  value={member?.nature || 'hardy'}
                  onChange={val => onUpdate({ nature: val })}
                  searchable
                />
              </div>

              <Select
                label="Ability"
                options={pokemonData.abilities?.map((a: any) => ({
                  value: a.ability.name,
                  label: a.ability.name.replace('-', ' '),
                })) || []}
                value={member?.ability || ''}
                onChange={val => onUpdate({ ability: val })}
                placeholder="Select ability..."
                searchable
              />

              <Input
                label="Held Item"
                placeholder="None"
                value={member?.item || ''}
                onChange={e => onUpdate({ item: e.target.value })}
              />

              <Select
                label="Tera Type"
                options={[
                  { value: '', label: 'None' },
                  ...['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'].map(t => ({ value: t.toLowerCase(), label: t }))
                ]}
                value={member?.tera_type || ''}
                onChange={val => onUpdate({ tera_type: val })}
                placeholder="Select Tera Type..."
              />

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-slate-300">
                    EVs ({Object.values(member?.evs || {}).reduce((a, b) => a + b, 0)}/510)
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdate({
                      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }
                    })}
                    className="text-xs"
                  >
                    Reset
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {(['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const).map(stat => (
                    <div key={stat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 uppercase">{stat}</span>
                        <span className="text-white font-mono">{member?.evs?.[stat] || 0}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={252}
                        step={4}
                        value={member?.evs?.[stat] || 0}
                        onChange={e => onUpdate({
                          evs: { ...member?.evs, [stat]: parseInt(e.target.value) || 0 } as EVs
                        })}
                        className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Moves</label>
                <div className="grid grid-cols-2 gap-2">
                  {[0, 1, 2, 3].map(i => (
                    <Input
                      key={i}
                      placeholder={`Move ${i + 1}`}
                      value={member?.moves?.[i] || ''}
                      onChange={e => {
                        const newMoves = [...(member?.moves || [])];
                        newMoves[i] = e.target.value;
                        onUpdate({ moves: newMoves });
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export const TeamBuilder: React.FC = () => {
  const [team, setTeam] = useState<PokemonBuild[]>([]);
  const [teamName, setTeamName] = useState('My Team');
  const [format, setFormat] = useState('vgc2026');
  const [description, setDescription] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [alternatives, setAlternatives] = useState<{ position: number; suggestions: any[] }>({ position: -1, suggestions: [] });
  const [saving, setSaving] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [exportModal, setExportModal] = useState(false);

  const addMember = () => {
    if (team.length < 6) {
      setTeam([...team, {
        pokemon_id: 0,
        pokemon_name: '',
        level: 50,
        nature: 'hardy',
        moves: [],
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        position: team.length,
      }]);
    }
  };

  const updateMember = (index: number) => (updates: Partial<PokemonBuild>) => {
    const newTeam = [...team];
    newTeam[index] = { ...newTeam[index], ...updates };
    setTeam(newTeam);
  };

  const removeMember = (index: number) => () => {
    setTeam(team.filter((_, i) => i !== index).map((m, i) => ({ ...m, position: i })));
    setAnalysis(null);
  };

  const selectForMember = (index: number) => () => {
    if (team.length < index + 1) return;
    suggestAlternatives(index);
  };

  const analyzeTeamHandler = async () => {
    const validMembers = team.filter(m => m.pokemon_id > 0);
    if (validMembers.length === 0) return;

    setAnalyzing(true);
    try {
      const preparedTeam = await Promise.all(
        validMembers.map(async m => {
          try {
            const data = await pokeApi.getPokemon(m.pokemon_id);
            return {
              ...m,
              types: data.types.map((t: any) => t.type.name),
              stats: {
                hp: data.stats.find((s: any) => s.stat.name === 'hp')?.base_stat || 0,
                atk: data.stats.find((s: any) => s.stat.name === 'attack')?.base_stat || 0,
                def: data.stats.find((s: any) => s.stat.name === 'defense')?.base_stat || 0,
                spa: data.stats.find((s: any) => s.stat.name === 'special-attack')?.base_stat || 0,
                spd: data.stats.find((s: any) => s.stat.name === 'special-defense')?.base_stat || 0,
                spe: data.stats.find((s: any) => s.stat.name === 'speed')?.base_stat || 0,
              },
            };
          } catch {
            return null;
          }
        })
      );

      const resolved = preparedTeam.filter(Boolean);
      if (resolved.length === 0) return;

      const result = await fetch('https://srpvhptgobcbzzhmxbkj.supabase.co/functions/v1/team-analyzer?action=analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycHZocHRnb2JjYnp6aG14YmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODQ5ODcsImV4cCI6MjA5NTY2MDk4N30.CDb6OACfbjpj8PxwJ_6wf3AQygvIj5LyVYwB3ylvHaQ`,
        },
        body: JSON.stringify({ action: 'analyze', team: resolved }),
      }).then(r => r.json());

      setAnalysis(result.analysis);
    } catch (e) {
      console.error(e);
    }
    setAnalyzing(false);
  };

  const suggestAlternatives = async (index: number) => {
    const validMembers = team.filter(m => m.pokemon_id > 0);
    if (validMembers.length === 0) return;

    try {
      const result = await fetch('https://srpvhptgobcbzzhmxbkj.supabase.co/functions/v1/team-analyzer?action=suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycHZocHRnb2JjYnp6aG14YmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODQ5ODcsImV4cCI6MjA5NTY2MDk4N30.CDb6OACfbjpj8PxwJ_6wf3AQygvIj5LyVYwB3ylvHaQ`,
        },
        body: JSON.stringify({ action: 'suggest', team: validMembers, pokemonIndex: index }),
      }).then(r => r.json());

      setAlternatives({ position: index, suggestions: result.alternatives || [] });
    } catch (e) {
      console.error(e);
    }
  };

  const replaceWith = (suggestion: any) => {
    const newTeam = [...team];
    newTeam[alternatives.position] = {
      ...newTeam[alternatives.position],
      pokemon_id: suggestion.pokemon_id,
      pokemon_name: suggestion.pokemon_name,
    };
    setTeam(newTeam);
    setAlternatives({ position: -1, suggestions: [] });
    setAnalysis(null);
  };

  const handleImport = () => {
    try {
      const parsed = parseShowdownPaste(importText);
      if (parsed.length > 0) {
        setTeam(parsed);
        setImportModal(false);
        setImportText('');
        setAnalysis(null);
      }
    } catch (e) {
      console.error('Import failed:', e);
    }
  };

  const handleExport = () => {
    const validMembers = team.filter(m => m.pokemon_id > 0);
    if (validMembers.length === 0) return;

    const paste = exportTo(validMembers, teamName);
    navigator.clipboard.writeText(paste);
    setExportModal(true);
  };

  const saveTeam = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please sign in to save teams');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('user_teams').insert({
        user_id: user.id,
        name: teamName,
        description,
        format,
      });

      if (!error) {
        alert('Team saved!');
      }
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="grid md:grid-cols-4 gap-4">
          <Input
            label="Team Name"
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
          />
          <NativeSelect
            label="Format"
            value={format}
            onChange={e => setFormat(e.target.value)}
            options={[
              { value: 'vgc2026', label: 'VGC 2026' },
              { value: 'doubles', label: 'Doubles' },
              { value: 'singles', label: 'Singles' },
            ]}
          />
          <Input
            label="Description"
            placeholder="Optional notes..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <div className="flex items-end gap-2">
            <Button variant="secondary" onClick={() => setImportModal(true)} className="flex-1">
              <Upload className="w-4 h-4" />
              Import
            </Button>
            <Button variant="secondary" onClick={handleExport} className="flex-1" disabled={team.filter(m => m.pokemon_id > 0).length === 0}>
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map((member, index) => (
          <TeamMemberSlot
            key={index}
            member={member}
            position={index}
            onUpdate={updateMember(index)}
            onRemove={removeMember(index)}
            onSelect={selectForMember(index)}
          />
        ))}
        {team.length < 6 && (
          <Card className="p-4 border-dashed border-2 border-slate-600 flex items-center justify-center min-h-[200px] hover:border-blue-500/50 transition-colors cursor-pointer" onClick={addMember}>
            <div className="text-center">
              <Plus className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <span className="text-sm text-slate-500">Add Pokemon ({team.length}/6)</span>
            </div>
          </Card>
        )}
      </div>

      <div className="flex gap-3 justify-center flex-wrap">
        <Button onClick={analyzeTeamHandler} disabled={team.filter(m => m.pokemon_id > 0).length === 0} loading={analyzing} size="lg">
          Analyze Team
        </Button>
        <Button variant="secondary" onClick={saveTeam} disabled={team.filter(m => m.pokemon_id > 0).length === 0} loading={saving} size="lg">
          Save Team
        </Button>
      </div>

      {analysis && (
        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-white">Team Analysis</h3>
            {analysis.synergy?.score !== undefined && (
              <div className="text-right">
                <div className="text-3xl font-bold">
                  <span className={analysis.synergy.score >= 70 ? 'text-emerald-400' : analysis.synergy.score >= 50 ? 'text-yellow-400' : 'text-red-400'}>
                    {analysis.synergy.score}
                  </span>
                  <span className="text-slate-500 text-lg">/100</span>
                </div>
                <div className="text-xs text-slate-500">Team Score</div>
              </div>
            )}
          </div>

          {analysis.synergy?.suggestions?.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <h4 className="text-sm font-semibold text-yellow-400 mb-2">Suggestions</h4>
              <ul className="space-y-1">
                {analysis.synergy.suggestions.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-yellow-200/80 flex items-start gap-2">
                    <span className="text-yellow-500">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-white mb-3">Defensive Weaknesses</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(analysis.defensive?.weaknesses || {}).filter(([_, count]) => (count as number) > 0).map(([type, count]) => (
                  <Badge key={type} variant={(count as number) >= 3 ? 'danger' : 'warning'}>
                    {type} x{count as number}
                  </Badge>
                ))}
                {Object.values(analysis.defensive?.weaknesses || {}).filter(c => c > 0).length === 0 && (
                  <span className="text-emerald-400 text-sm">No shared weaknesses</span>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-white mb-3">Offensive Coverage</h4>
              <div className="flex flex-wrap gap-1 mb-2">
                {analysis.offensive?.hitSuperEffective?.map((type: string) => (
                  <TypeBadge key={type} type={type} />
                ))}
              </div>
              {analysis.offensive?.cantHit?.length > 0 && (
                <div>
                  <span className="text-xs text-slate-400">Can't hit effectively: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {analysis.offensive.cantHit.map((type: string) => (
                      <Badge key={type} variant="danger" size="sm">{type}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {alternatives.suggestions.length > 0 && (
        <Card className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-white">Suggested Alternatives</h3>
            <Button variant="ghost" size="sm" onClick={() => setAlternatives({ position: -1, suggestions: [] })}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {alternatives.suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => replaceWith(s)}
                className="p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-all text-center group"
              >
                <div className="capitalize text-sm text-white group-hover:text-blue-400 transition-colors">{s.pokemon_name}</div>
                <div className="flex gap-1 justify-center mt-2">
                  {s.types?.map((t: string) => (
                    <TypeBadge key={t} type={t} size="sm" />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Import Modal */}
      <Modal isOpen={importModal} onClose={() => setImportModal(false)} title="Import Team" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Paste your team in Showdown format:</p>
          <textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            placeholder={`Example:
Charizard @ Choice Specs
Ability: Blaze
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Flamethrower
- Air Slash
- Dragon Pulse
- Focus Blast`}
            className="w-full h-64 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setImportModal(false)}>Cancel</Button>
            <Button onClick={handleImport} disabled={!importText.trim()}>Import Team</Button>
          </div>
        </div>
      </Modal>

      {/* Export Modal */}
      <Modal isOpen={exportModal} onClose={() => setExportModal(false)} title="Team Exported!" size="md">
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
            <Copy className="w-8 h-8 text-emerald-400" />
          </div>
          <p className="text-white mb-2">Team copied to clipboard!</p>
          <p className="text-sm text-slate-400">Paste it anywhere in Showdown format</p>
        </div>
        <Button onClick={() => setExportModal(false)} className="w-full">Done</Button>
      </Modal>
    </div>
  );
};
