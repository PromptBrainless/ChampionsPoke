import { PokemonBuild, EVs, IVs } from '../types';

export interface ShowdownSet {
  name: string;
  species: string;
  item: string;
  ability: string;
  level: number;
  nature: string;
  evs: Partial<EVs>;
  ivs?: Partial<IVs>;
  moves: string[];
  teraType?: string;
}

export const parseShowdownPaste = (paste: string): PokemonBuild[] => {
  const sets: PokemonBuild[] = [];
  const lines = paste.trim().split('\n');
  let currentSet: Partial<PokemonBuild> = {};
  let position = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      if (currentSet.pokemon_name) {
        sets.push({
          pokemon_id: 0,
          pokemon_name: currentSet.pokemon_name || '',
          nickname: currentSet.nickname || '',
          level: currentSet.level || 50,
          ability: currentSet.ability || '',
          item: currentSet.item || '',
          nature: currentSet.nature || 'hardy',
          moves: currentSet.moves || [],
          evs: currentSet.evs || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
          ivs: currentSet.ivs || { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
          tera_type: currentSet.tera_type || '',
          position: position++,
        });
      }
      currentSet = {};
      continue;
    }

    // First line: Name (Species) @ Item or just Species @ Item
    if (!currentSet.pokemon_name && !line.includes(':')) {
      const atIndex = line.lastIndexOf('@');
      let namePart = line;
      let item = '';

      if (atIndex > 0) {
        namePart = line.substring(0, atIndex).trim();
        item = line.substring(atIndex + 1).trim();
      }

      // Check for nickname: "Nickname (Species)" or just "Species"
      const parenMatch = namePart.match(/(.+?)?\s*\((.+?)\)/);
      if (parenMatch) {
        currentSet.nickname = parenMatch[1]?.trim() || '';
        currentSet.pokemon_name = parenMatch[2].toLowerCase();
      } else {
        currentSet.pokemon_name = namePart.toLowerCase();
      }

      currentSet.item = item;
      currentSet.moves = [];
      currentSet.evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
      currentSet.ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
      continue;
    }

    // Ability: line
    if (line.startsWith('Ability:')) {
      currentSet.ability = line.replace('Ability:', '').trim();
      continue;
    }

    // Level: line
    if (line.startsWith('Level:')) {
      currentSet.level = parseInt(line.replace('Level:', '').trim()) || 50;
      continue;
    }

    // EVs: line
    if (line.startsWith('EVs:')) {
      const evString = line.replace('EVs:', '').trim();
      const evs = evString.split('/').map(e => e.trim());

      for (const ev of evs) {
        const match = ev.match(/(\d+)\s+(\w+)/);
        if (match) {
          const value = parseInt(match[1]);
          const stat = match[2].toLowerCase();
          if (['hp', 'atk', 'def', 'spa', 'spd', 'spe'].includes(stat)) {
            (currentSet.evs as any)[stat] = value;
          }
        }
      }
      continue;
    }

    // IVs: line
    if (line.startsWith('IVs:')) {
      const ivString = line.replace('IVs:', '').trim();
      const ivs = ivString.split('/').map(i => i.trim());

      for (const iv of ivs) {
        const match = iv.match(/(\d+)\s+(\w+)/);
        if (match) {
          const value = parseInt(match[1]);
          const stat = match[2].toLowerCase();
          if (['hp', 'atk', 'def', 'spa', 'spd', 'spe'].includes(stat)) {
            (currentSet.ivs as any)[stat] = value;
          }
        }
      }
      continue;
    }

    // Tera Type: line
    if (line.startsWith('Tera Type:')) {
      currentSet.tera_type = line.replace('Tera Type:', '').trim().toLowerCase();
      continue;
    }

    // Nature line (ends with "Nature")
    if (line.endsWith('Nature')) {
      const nature = line.replace('Nature', '').trim().toLowerCase();
      currentSet.nature = nature;
      continue;
    }

    // Move lines (start with -)
    if (line.startsWith('-')) {
      const move = line.substring(1).trim();
      if (currentSet.moves) {
        currentSet.moves.push(move);
      } else {
        currentSet.moves = [move];
      }
    }
  }

  // Don't forget the last set
  if (currentSet.pokemon_name) {
    sets.push({
      pokemon_id: 0,
      pokemon_name: currentSet.pokemon_name || '',
      nickname: currentSet.nickname || '',
      level: currentSet.level || 50,
      ability: currentSet.ability || '',
      item: currentSet.item || '',
      nature: currentSet.nature || 'hardy',
      moves: currentSet.moves || [],
      evs: currentSet.evs || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      ivs: currentSet.ivs || { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      tera_type: currentSet.tera_type || '',
      position: position++,
    });
  }

  return sets;
};

export const exportTo = (team: PokemonBuild[], teamName: string = 'Team'): string => {
  const lines: string[] = [];

  for (const member of team) {
    const name = member.nickname
      ? `${member.nickname} (${member.pokemon_name})`
      : member.pokemon_name;

    const header = member.item
      ? `${name} @ ${member.item}`
      : name;

    lines.push(header);

    if (member.ability) {
      lines.push(`Ability: ${member.ability}`);
    }

    if (member.level && member.level !== 50) {
      lines.push(`Level: ${member.level}`);
    }

    const evPairs: string[] = [];
    for (const stat of ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const) {
      if (member.evs[stat] > 0) {
        evPairs.push(`${member.evs[stat]} ${stat.toUpperCase()}`);
      }
    }
    if (evPairs.length > 0) {
      lines.push(`EVs: ${evPairs.join(' / ')}`);
    }

    const ivPairs: string[] = [];
    for (const stat of ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const) {
      if (member.ivs[stat] !== 31) {
        ivPairs.push(`${member.ivs[stat]} ${stat.toUpperCase()}`);
      }
    }
    if (ivPairs.length > 0) {
      lines.push(`IVs: ${ivPairs.join(' / ')}`);
    }

    if (member.tera_type) {
      lines.push(`Tera Type: ${member.tera_type}`);
    }

    lines.push(`${member.nature.charAt(0).toUpperCase() + member.nature.slice(1)} Nature`);

    for (const move of member.moves) {
      lines.push(`- ${move}`);
    }

    lines.push('');
  }

  return lines.join('\n');
};

export const NATURES_WITH_EFFECTS: Record<string, { increase: string | null; decrease: string | null }> = {
  hardy: { increase: null, decrease: null },
  lonely: { increase: 'atk', decrease: 'def' },
  brave: { increase: 'atk', decrease: 'spe' },
  adamant: { increase: 'atk', decrease: 'spa' },
  naughty: { increase: 'atk', decrease: 'spd' },
  bold: { increase: 'def', decrease: 'atk' },
  docile: { increase: null, decrease: null },
  relaxed: { increase: 'def', decrease: 'spe' },
  impish: { increase: 'def', decrease: 'spa' },
  lax: { increase: 'def', decrease: 'spd' },
  timid: { increase: 'spe', decrease: 'atk' },
  hasty: { increase: 'spe', decrease: 'def' },
  serious: { increase: null, decrease: null },
  jolly: { increase: 'spe', decrease: 'spa' },
  naive: { increase: 'spe', decrease: 'spd' },
  modest: { increase: 'spa', decrease: 'atk' },
  mild: { increase: 'spa', decrease: 'def' },
  quiet: { increase: 'spa', decrease: 'spe' },
  rash: { increase: 'spa', decrease: 'spd' },
  calm: { increase: 'spd', decrease: 'atk' },
  gentle: { increase: 'spd', decrease: 'def' },
  sassy: { increase: 'spd', decrease: 'spe' },
  careful: { increase: 'spd', decrease: 'spa' },
  quirky: { increase: null, decrease: null },
};

export const calculateStat = (
  baseStat: number,
  iv: number,
  ev: number,
  level: number,
  natureMod: number,
  isHP: boolean = false
): number => {
  if (isHP) {
    if (baseStat === 1) return 1; // Shedinja
    return Math.floor(((2 * baseStat + iv + Math.floor(ev / 4)) * level) / 100 + level + 10);
  }
  return Math.floor((Math.floor(((2 * baseStat + iv + Math.floor(ev / 4)) * level) / 100 + 5) * natureMod));
};

export const calculateSpeed = (
  baseSpe: number,
  iv: number,
  ev: number,
  level: number,
  nature: string,
  stage: number = 0,
  item?: string,
  ability?: string
): number => {
  const natureEffect = NATURES_WITH_EFFECTS[nature.toLowerCase()] || { increase: null, decrease: null };
  let natureMod = 1;
  if (natureEffect.increase === 'spe') natureMod = 1.1;
  if (natureEffect.decrease === 'spe') natureMod = 0.9;

  let speed = calculateStat(baseSpe, iv, ev, level, natureMod);

  // Apply stat stages
  if (stage > 0) {
    speed = Math.floor(speed * (2 + stage) / 2);
  } else if (stage < 0) {
    speed = Math.floor(speed * 2 / (2 - stage));
  }

  // Item modifiers
  if (item?.toLowerCase() === 'choicescarf') {
    speed = Math.floor(speed * 1.5);
  }
  if (item?.toLowerCase() === 'ironball') {
    speed = Math.floor(speed * 0.5);
  }

  // Ability modifiers
  if (ability?.toLowerCase() === 'swiftswim' || ability?.toLowerCase() === 'chlorophyll') {
    speed *= 2; // In weather
  }
  if (ability?.toLowerCase() === 'surgesurfer' || ability?.toLowerCase() === 'slushrush') {
    speed *= 1.5;
  }
  if (ability?.toLowerCase() === 'unburden') {
    speed *= 2; // After item consumption
  }

  // Tailwind
  // speed *= 2;

  return speed;
};

export const ITEMS = {
  offensive: [
    'Choice Band', 'Choice Specs', 'Choice Scarf', 'Life Orb', 'Expert Belt',
    'Focus Sash', 'White Herb', 'Weakness Policy', 'Scope Lens', 'King\'s Rock',
  ],
  defensive: [
    'Leftovers', 'Rocky Helmet', 'Heavy-Duty Boots', 'Assault Vest', 'Eviolite',
    'Air Balloon', 'Safety Goggles', 'Covert Cloak', 'Clear Amulet',
  ],
  berries: [
    'Sitrus Berry', 'Lum Berry', 'Aguav Berry', 'Figy Berry', 'Iapapa Berry',
    'Occa Berry', 'Yache Berry', 'Wacan Berry', 'Rindo Berry', 'Tanga Berry',
    'Babiri Berry', 'Shuca Berry', 'Chilan Berry', 'Roseli Berry',
  ],
  support: [
    'Light Clay', 'Rocky Helmet', 'Red Card', 'Eject Button', 'Mental Herb',
    'Binding Band', 'Grip Claw', 'Destiny Knot', 'Bright Powder', 'Lax Incense',
  ],
};
