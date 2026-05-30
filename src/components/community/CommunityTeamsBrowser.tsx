import React, { useState, useEffect } from 'react';
import { Card, Button, TypeBadge, Badge, Input } from '../ui';
import { supabase } from '../../lib/supabase';
import { exportTo, parseShowdownPaste } from '../../lib/utils';
import { ThumbsUp, Copy, Download, Filter } from 'lucide-react';

interface CommunityTeam {
  id: string;
  name: string;
  description?: string;
  format: string;
  archetype?: string;
  author?: string;
  votes: number;
  created_at: string;
  members: any[];
}

interface Props {
  onSelect?: (team: CommunityTeam) => void;
}

const TEAM_ARCHETYPES = [
  { value: '', label: 'All Archetypes' },
  { value: 'offensive', label: 'Hyper Offense' },
  { value: 'balance', label: 'Balance' },
  { value: 'stall', label: 'Stall' },
  { value: 'weather', label: 'Weather (Sun/Rain/Sand/Snow)' },
  { value: 'trickroom', label: 'Trick Room' },
  { value: 'tailwind', label: 'Tailwind Offense' },
  { value: 'terrain', label: 'Terrain Team' },
  { value: 'pivots', label: 'Pivot Core' },
  { value: 'hyperoffense', label: 'Full Fledged Offense' },
];

const POPULAR_CORES = [
  {
    name: 'Sand Rush Core',
    pokemon: ['tyranitar', 'excadrill'],
    archetype: 'weather',
    description: 'Tyranitar sets up sand, Excadrill sweeps with Sand Rush',
  },
  {
    name: 'Rain Core',
    pokemon: ['pelipper', 'barraskwetha', 'kingdra'],
    archetype: 'weather',
    description: 'Rain setter + swift swim sweepers',
  },
  {
    name: 'Tailwind Support',
    pokemon: ['whimsicott', 'incineroar', 'garchomp'],
    archetype: 'tailwind',
    description: 'Speed control with Tailwind + fake out support',
  },
  {
    name: 'Trick Room',
    pokemon: ['hatterene', 'torkoal', 'orbeetle'],
    archetype: 'trickroom',
    description: 'Slow, bulky attackers under Trick Room',
  },
];

export const CommunityTeamsBrowser: React.FC<Props> = ({ onSelect }) => {
  const [teams, setTeams] = useState<CommunityTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArchetype, setSelectedArchetype] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('vgc2026');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadTeams();
  }, [selectedArchetype, selectedFormat]);

  const loadTeams = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('user_teams')
        .select('id, name, description, format, created_at')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);

      const { data, error } = await query;

      if (!error && data) {
        // Add mock archetype and votes
        const enriched = data.map((team: any) => ({
          ...team,
          archetype: TEAM_ARCHETYPES[Math.floor(Math.random() * 5) + 1].value,
          votes: Math.floor(Math.random() * 100),
          author: 'Community Member',
          members: [],
        }));
        setTeams(enriched as CommunityTeam[]);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleCopy = (team: CommunityTeam) => {
    if (team.members && team.members.length > 0) {
      const paste = exportTo(team.members, team.name);
      navigator.clipboard.writeText(paste);
      setCopiedId(team.id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopiedId(team.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filteredTeams = teams.filter(team => {
    if (selectedArchetype && team.archetype !== selectedArchetype) return false;
    if (searchQuery && !team.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleAddToBuilder = (team: CommunityTeam) => {
    onSelect?.(team);
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Input
          placeholder="Search teams..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <div className="flex gap-2">
          <select
            className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedArchetype}
            onChange={e => setSelectedArchetype(e.target.value)}
          >
            {TEAM_ARCHETYPES.map(a => (
              <option key={a.value} value={a.value} className="bg-slate-800">
                {a.label}
              </option>
            ))}
          </select>
          <select
            className="px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedFormat}
            onChange={e => setSelectedFormat(e.target.value)}
          >
            <option value="vgc2026" className="bg-slate-800">VGC 2026</option>
            <option value="doubles" className="bg-slate-800">Doubles</option>
            <option value="singles" className="bg-slate-800">Singles</option>
          </select>
        </div>
      </div>

      {filteredTeams.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-slate-400">No teams found. Be the first to publish a team!</p>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {filteredTeams.map(team => (
          <Card key={team.id} className="p-5 hover:border-blue-500/30 transition-all">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-white">{team.name}</h3>
                {team.archetype && (
                  <Badge variant="info" size="sm">
                    {TEAM_ARCHETYPES.find(a => a.value === team.archetype)?.label || team.archetype}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <ThumbsUp className="w-4 h-4" />
                <span className="text-sm">{team.votes}</span>
              </div>
            </div>

            {team.members && team.members.length > 0 ? (
              <div className="flex gap-2 mb-3">
                {team.members.slice(0, 6).map((member: any, i: number) => (
                  <div key={i} className="w-12 h-12 bg-slate-700 rounded flex items-center justify-center">
                    <span className="text-xs text-slate-400 capitalize">{member.pokemon_name?.slice(0, 2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-2 mb-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-12 h-12 bg-slate-700/50 rounded flex items-center justify-center">
                    <span className="text-xs text-slate-500">?</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => handleCopy(team)} className="flex-1">
                {copiedId === team.id ? 'Copied!' : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
              <Button size="sm" onClick={() => handleAddToBuilder(team)} className="flex-1">
                Add to Builder
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Popular Team Cores</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {POPULAR_CORES.map(core => (
            <div key={core.name} className="p-4 bg-slate-900/50 rounded-lg hover:bg-slate-700/30 transition-colors cursor-pointer">
              <div className="font-medium text-white mb-2">{core.name}</div>
              <div className="flex gap-1 mb-2">
                {core.pokemon.map(p => (
                  <Badge key={p} variant="default" size="sm">{p}</Badge>
                ))}
              </div>
              <p className="text-xs text-slate-400">{core.description}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
