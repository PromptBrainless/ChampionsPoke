import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const TYPE_CHART: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

const ALL_TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy"
];

interface TeamMember {
  pokemon_id: number;
  pokemon_name: string;
  types: string[];
  abilities?: string[];
  stats?: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  moves?: Array<{ name: string; type: string; power: number; category: string }>;
}

interface TeamAnalysis {
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

function analyzeDefensiveTyping(team: TeamMember[]): Record<string, number[]> {
  const typeWeaknesses: Record<string, number[]> = {};

  for (const attackType of ALL_TYPES) {
    typeWeaknesses[attackType] = [];
    for (const member of team) {
      let multiplier = 1;
      for (const defenseType of member.types) {
        const chart = TYPE_CHART[attackType];
        if (chart && chart[defenseType] !== undefined) {
          multiplier *= chart[defenseType];
        }
      }
      if (multiplier > 1) {
        typeWeaknesses[attackType].push(multiplier);
      }
    }
  }

  return typeWeaknesses;
}

function analyzeOffensiveCoverage(team: TeamMember[]): {
  hitSuperEffective: Set<string>;
  hitNeutral: Set<string>;
  cantHit: Set<string>;
} {
  const hitSuperEffective = new Set<string>();
  const hitNeutral = new Set<string>();
  const cantHit = new Set<string>(ALL_TYPES);

  for (const member of team) {
    const moves = member.moves || [];
    for (const move of moves) {
      if (!move.type || move.power === 0) continue;
      const moveType = move.type.toLowerCase();

      for (const defenseType of ALL_TYPES) {
        const chart = TYPE_CHART[moveType];
        if (chart && chart[defenseType] !== undefined) {
          const mult = chart[defenseType];
          if (mult > 1) {
            hitSuperEffective.add(defenseType);
          }
          if (mult === 1) {
            hitNeutral.add(defenseType);
          }
          cantHit.delete(defenseType);
        } else {
          hitNeutral.add(moveType);
          cantHit.delete(moveType);
        }
      }
    }
  }

  return { hitSuperEffective, hitNeutral, cantHit };
}

function analyzeTeamBalance(team: TeamMember[]): {
  physical: number;
  special: number;
  speed: number;
  bulk: number;
} {
  let totalAtk = 0, totalSpa = 0, totalSpe = 0, totalBulk = 0;

  for (const member of team) {
    if (member.stats) {
      totalAtk += member.stats.atk;
      totalSpa += member.stats.spa;
      totalSpe += member.stats.spe;
      totalBulk += (member.stats.hp + member.stats.def + member.stats.spd) / 3;
    }
  }

  const count = team.length || 1;
  return {
    physical: Math.round(totalAtk / count),
    special: Math.round(totalSpa / count),
    speed: Math.round(totalSpe / count),
    bulk: Math.round(totalBulk / count),
  };
}

function suggestImprovements(team: TeamMember[]): string[] {
  const suggestions: string[] = [];
  const weaknesses = analyzeDefensiveTyping(team);
  const offensive = analyzeOffensiveCoverage(team);

  // Check for shared weaknesses
  for (const [type, multipliers] of Object.entries(weaknesses)) {
    if (multipliers.length >= 3) {
      suggestions.push(`Team has ${multipliers.length} Pokemon weak to ${type.toUpperCase()}. Consider adding a ${type}-resistant Pokemon.`);
    }
  }

  // Check offensive coverage
  if (offensive.cantHit.size > 0) {
    const types = Array.from(offensive.cantHit).join(", ");
    suggestions.push(`No moves hit ${types.toUpperCase()} effectively. Consider adding coverage moves.`);
  }

  // Balance check
  const balance = analyzeTeamBalance(team);
  if (balance.physical > balance.special * 1.5) {
    suggestions.push("Team is heavily physical. Consider adding special attackers for better balance.");
  } else if (balance.special > balance.physical * 1.5) {
    suggestions.push("Team is heavily special. Consider adding physical attackers for better balance.");
  }

  if (balance.speed < 90) {
    suggestions.push("Team is relatively slow. Consider adding faster Pokemon or priority moves.");
  }

  return suggestions;
}

async function findAlternativePokemon(currentMember: TeamMember, team: TeamMember[]): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from("pokemon_cache")
    .select("pokemon_id, name, data")
    .limit(100);

  if (error || !data) return [];

  const currentTypes = currentMember.types;
  const alternatives: TeamMember[] = [];

  for (const cached of data) {
    const pkmn = cached.data;
    const pkmnTypes = pkmn.types.map((t: any) => t.type.name);

    // Find Pokemon that complement the team
    if (pkmn.id !== currentMember.pokemon_id) {
      // Calculate how well this Pokemon would fit
      const hasDifferentTyping = !pkmnTypes.some((t: string) => currentTypes.includes(t));
      if (hasDifferentTyping || alternatives.length < 5) {
        alternatives.push({
          pokemon_id: pkmn.id,
          pokemon_name: pkmn.name,
          types: pkmnTypes,
          stats: {
            hp: pkmn.stats.find((s: any) => s.stat.name === "hp")?.base_stat || 0,
            atk: pkmn.stats.find((s: any) => s.stat.name === "attack")?.base_stat || 0,
            def: pkmn.stats.find((s: any) => s.stat.name === "defense")?.base_stat || 0,
            spa: pkmn.stats.find((s: any) => s.stat.name === "special-attack")?.base_stat || 0,
            spd: pkmn.stats.find((s: any) => s.stat.name === "special-defense")?.base_stat || 0,
            spe: pkmn.stats.find((s: any) => s.stat.name === "speed")?.base_stat || 0,
          },
        });
      }
    }

    if (alternatives.length >= 10) break;
  }

  return alternatives;
}

function calculateTeamRating(team: TeamMember[]): number {
  const offensive = analyzeOffensiveCoverage(team);
  const weaknesses = analyzeDefensiveTyping(team);
  const balance = analyzeTeamBalance(team);

  let rating = 50;

  // Offensive coverage bonus
  const offensiveScore = (offensive.hitSuperEffective.size / ALL_TYPES.length) * 20;
  rating += offensiveScore;

  // Defensive penalty
  let defensivePenalty = 0;
  for (const [, multipliers] of Object.entries(weaknesses)) {
    if (multipliers.length >= 3) defensivePenalty += 5;
    if (multipliers.some(m => m >= 4)) defensivePenalty += 3;
  }
  rating -= Math.min(defensivePenalty, 20);

  // Balance bonus
  const physicalSpecialDiff = Math.abs(balance.physical - balance.special);
  if (physicalSpecialDiff < 20) rating += 5;

  return Math.max(0, Math.min(100, Math.round(rating)));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body = req.method === "POST" ? await req.json() : {};
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || body.action;

    switch (action) {
      case "analyze": {
        const { team } = body;

        if (!team || team.length === 0) {
          return new Response(
            JSON.stringify({ error: "Team data required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const defensiveWeaknesses = analyzeDefensiveTyping(team);
        const offensive = analyzeOffensiveCoverage(team);
        const balance = analyzeTeamBalance(team);
        const suggestions = suggestImprovements(team);
        const rating = calculateTeamRating(team);

        // Calculate defensive summary
        const weaknesses: Record<string, number> = {};
        const resistances: Record<string, number> = {};

        for (const [type, mults] of Object.entries(defensiveWeaknesses)) {
          weaknesses[type] = mults.length;
        }

        for (const type of ALL_TYPES) {
          if (!defensiveWeaknesses[type] || defensiveWeaknesses[type].length === 0) {
            resistances[type] = team.length;
          }
        }

        const analysis: TeamAnalysis = {
          defensive: {
            weaknesses,
            resistances,
            immunities: {},
            coverage: 100 - (Object.values(weaknesses).reduce((a, b) => a + b, 0) / (team.length * ALL_TYPES.length)) * 100,
          },
          offensive: {
            hitSuperEffective: Array.from(offensive.hitSuperEffective),
            hitNeutral: Array.from(offensive.hitNeutral),
            cantHit: Array.from(offensive.cantHit),
            coverage: (offensive.hitSuperEffective.size / ALL_TYPES.length) * 100,
          },
          synergy: {
            score: rating,
            suggestions,
          },
          balance,
        };

        return new Response(
          JSON.stringify({ analysis, rating }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "suggest": {
        const { team, pokemonIndex } = body;

        if (!team || pokemonIndex === undefined) {
          return new Response(
            JSON.stringify({ error: "Team and pokemonIndex required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const currentMember = team[pokemonIndex];
        const alternatives = await findAlternativePokemon(currentMember, team);

        return new Response(
          JSON.stringify({ alternatives }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "rate": {
        const { team } = body;

        if (!team) {
          return new Response(
            JSON.stringify({ error: "Team data required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const rating = calculateTeamRating(team);
        const suggestions = suggestImprovements(team);

        return new Response(
          JSON.stringify({ rating, suggestions }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "type-chart": {
        return new Response(
          JSON.stringify(TYPE_CHART),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default: {
        return new Response(
          JSON.stringify({
            endpoints: [
              "?action=analyze - Full team analysis",
              "?action=suggest - Suggest alternative Pokemon",
              "?action=rate - Rate team composition",
              "?action=type-chart - Get full type chart",
            ],
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
