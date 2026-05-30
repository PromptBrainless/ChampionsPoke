import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Type Effectiveness Chart
const TYPE_CHART: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: {
    fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2,
  },
  water: {
    fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5,
  },
  electric: {
    water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5,
  },
  grass: {
    fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5,
    rock: 2, dragon: 0.5, steel: 0.5,
  },
  ice: {
    fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5,
  },
  fighting: {
    normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2,
    ghost: 0, dark: 2, steel: 2, fairy: 0.5,
  },
  poison: {
    grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2,
  },
  ground: {
    fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2,
    steel: 2,
  },
  flying: {
    electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5,
  },
  psychic: {
    fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5,
  },
  bug: {
    fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2,
    ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5,
  },
  rock: {
    fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5,
  },
  ghost: {
    normal: 0, psychic: 2, ghost: 2, dark: 0.5,
  },
  dragon: {
    dragon: 2, steel: 0.5, fairy: 0,
  },
  dark: {
    fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5,
  },
  steel: {
    fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2,
  },
  fairy: {
    fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5,
  },
};

interface Stats {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

interface Pokemon {
  name: string;
  level: number;
  types: string[];
  stats: Stats;
  ability?: string;
  item?: string;
  nature?: string;
  evs?: Partial<Stats>;
  ivs?: Partial<Stats>;
}

interface Move {
  name: string;
  type: string;
  power: number;
  category: "physical" | "special" | "status";
  accuracy?: number;
  pp?: number;
  priority?: number;
}

interface BattleConditions {
  weather?: "sun" | "rain" | "sand" | "hail" | "snow";
  terrain?: "electric" | "grassy" | "misty" | "psychic";
  isCritical?: boolean;
  isStab?: boolean;
  helpingHand?: boolean;
  protect?: boolean;
  reflect?: boolean;
  lightScreen?: boolean;
  auroraVeil?: boolean;
  friendGuard?: boolean;
}

// Natures that affect stats
const NATURE_EFFECTS: Record<string, { increase: keyof Stats; decrease: keyof Stats } | null> = {
  hardy: null, lonely: { increase: "atk", decrease: "def" }, brave: { increase: "atk", decrease: "spe" },
  adamant: { increase: "atk", decrease: "spa" }, naughty: { increase: "atk", decrease: "spd" },
  bold: { increase: "def", decrease: "atk" }, docile: null, relaxed: { increase: "def", decrease: "spe" },
  impish: { increase: "def", decrease: "spa" }, lax: { increase: "def", decrease: "spd" },
  timid: { increase: "spe", decrease: "atk" }, hasty: { increase: "spe", decrease: "def" },
  serious: null, jolly: { increase: "spe", decrease: "spa" }, naive: { increase: "spe", decrease: "spd" },
  modest: { increase: "spa", decrease: "atk" }, mild: { increase: "spa", decrease: "def" },
  quiet: { increase: "spa", decrease: "spe" }, rash: { increase: "spa", decrease: "spd" },
  calm: { increase: "spd", decrease: "atk" }, gentle: { increase: "spd", decrease: "def" },
  sassy: { increase: "spd", decrease: "spe" }, careful: { increase: "spd", decrease: "spa" },
  quirky: null,
};

function calculateStat(
  baseStat: number,
  iv: number,
  ev: number,
  level: number,
  natureMod: number,
  isHP: boolean = false
): number {
  if (isHP) {
    return Math.floor(((2 * baseStat + iv + Math.floor(ev / 4)) * level) / 100 + level + 10);
  }
  return Math.floor((Math.floor(((2 * baseStat + iv + Math.floor(ev / 4)) * level) / 100 + 5) * natureMod));
}

function getNatureModifier(nature: string, stat: keyof Stats): number {
  const effect = NATURE_EFFECTS[nature.toLowerCase()];
  if (!effect) return 1;
  if (effect.increase === stat) return 1.1;
  if (effect.decrease === stat) return 0.9;
  return 1;
}

function calculateActualStats(pokemon: Pokemon, baseStats: Stats): Stats {
  const evs = pokemon.evs || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  const ivs = pokemon.ivs || { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
  const nature = pokemon.nature || "hardy";

  return {
    hp: calculateStat(baseStats.hp, ivs.hp || 31, evs.hp || 0, pokemon.level, 1, true),
    atk: calculateStat(baseStats.atk, ivs.atk || 31, evs.atk || 0, pokemon.level, getNatureModifier(nature, "atk")),
    def: calculateStat(baseStats.def, ivs.def || 31, evs.def || 0, pokemon.level, getNatureModifier(nature, "def")),
    spa: calculateStat(baseStats.spa, ivs.spa || 31, evs.spa || 0, pokemon.level, getNatureModifier(nature, "spa")),
    spd: calculateStat(baseStats.spd, ivs.spd || 31, evs.spd || 0, pokemon.level, getNatureModifier(nature, "spd")),
    spe: calculateStat(baseStats.spe, ivs.spe || 31, evs.spe || 0, pokemon.level, getNatureModifier(nature, "spe")),
  };
}

function getTypeEffectiveness(moveType: string, defenderTypes: string[]): number {
  let effectiveness = 1;
  for (const defType of defenderTypes) {
    const chart = TYPE_CHART[moveType.toLowerCase()];
    if (chart && chart[defType.toLowerCase()] !== undefined) {
      effectiveness *= chart[defType.toLowerCase()];
    }
  }
  return effectiveness;
}

function calculateDamage(
  attacker: Pokemon,
  defender: Pokemon,
  move: Move,
  attackerStats: Stats,
  defenderStats: Stats,
  conditions: BattleConditions = {}
): { min: number; max: number; percentage: { min: number; max: number }; effectiveness: number } {
  if (move.category === "status" || move.power === 0) {
    return { min: 0, max: 0, percentage: { min: 0, max: 0 }, effectiveness: 0 };
  }

  const level = attacker.level;
  const power = move.power;

  // Determine which stats to use
  const isPhysical = move.category === "physical";
  const attackStat = isPhysical ? attackerStats.atk : attackerStats.spa;
  const defenseStat = isPhysical ? defenderStats.def : defenderStats.spd;

  // Base damage formula
  let damage = Math.floor(((2 * level) / 5 + 2) * power * (attackStat / defenseStat));
  damage = Math.floor(damage / 50) + 2;

  // STAB
  const stab = attacker.types.some(t => t.toLowerCase() === move.type.toLowerCase()) ? 1.5 : 1;
  damage = Math.floor(damage * stab);

  // Type effectiveness
  const effectiveness = getTypeEffectiveness(move.type, defender.types);
  damage = Math.floor(damage * effectiveness);

  // Critical hit
  const critMultiplier = conditions.isCritical ? 1.5 : 1;
  damage = Math.floor(damage * critMultiplier);

  // Weather modifiers
  if (conditions.weather === "rain" && move.type.toLowerCase() === "water") {
    damage = Math.floor(damage * 1.5);
  } else if (conditions.weather === "rain" && move.type.toLowerCase() === "fire") {
    damage = Math.floor(damage * 0.5);
  } else if (conditions.weather === "sun" && move.type.toLowerCase() === "fire") {
    damage = Math.floor(damage * 1.5);
  } else if (conditions.weather === "sun" && move.type.toLowerCase() === "water") {
    damage = Math.floor(damage * 0.5);
  }

  // Terrain modifiers
  if (conditions.terrain === "electric" && move.type.toLowerCase() === "electric") {
    damage = Math.floor(damage * 1.3);
  } else if (conditions.terrain === "grassy" && move.type.toLowerCase() === "grass") {
    damage = Math.floor(damage * 1.3);
  } else if (conditions.terrain === "psychic" && move.type.toLowerCase() === "psychic") {
    damage = Math.floor(damage * 1.3);
  } else if (conditions.terrain === "misty" && move.type.toLowerCase() === "dragon") {
    damage = Math.floor(damage * 0.5);
  }

  // Screens
  if (!conditions.isCritical) {
    if (conditions.reflect && isPhysical) {
      damage = Math.floor(damage * (conditions.auroraVeil ? 0.667 : 0.5));
    }
    if (conditions.lightScreen && !isPhysical) {
      damage = Math.floor(damage * (conditions.auroraVeil ? 0.667 : 0.5));
    }
  }

  // Helping Hand
  if (conditions.helpingHand) {
    damage = Math.floor(damage * 1.5);
  }

  // Friend Guard
  if (conditions.friendGuard) {
    damage = Math.floor(damage * 0.75);
  }

  // Random factor (85% to 100%)
  const minDamage = Math.floor(damage * 0.85);
  const maxDamage = damage;

  // Calculate percentage of defender's HP
  const defenderHP = defenderStats.hp;
  const minPercentage = (minDamage / defenderHP) * 100;
  const maxPercentage = (maxDamage / defenderHP) * 100;

  return {
    min: minDamage,
    max: maxDamage,
    percentage: {
      min: Math.round(minPercentage * 10) / 10,
      max: Math.round(maxPercentage * 10) / 10,
    },
    effectiveness,
  };
}

function analyzeMatchup(
  attacker: Pokemon,
  defender: Pokemon,
  move: Move,
  attackerBaseStats: Stats
): any {
  const attackerStats = calculateActualStats(attacker, attackerBaseStats);
  // Note: We'd need defender's base stats too for full calc, but we return what we can

  return {
    move: move.name,
    type: move.type,
    power: move.power,
    category: move.category,
    effectiveness: getTypeEffectiveness(move.type, defender.types),
    stab: attacker.types.some(t => t.toLowerCase() === move.type.toLowerCase()),
  };
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
      case "calculate": {
        const { attacker, defender, move, conditions, attackerBaseStats } = body;

        if (!attacker || !defender || !move) {
          return new Response(
            JSON.stringify({ error: "Missing attacker, defender, or move data" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const attackerStats = calculateActualStats(attacker, attackerBaseStats);
        const defenderStats = defender.stats;

        const result = calculateDamage(
          attacker,
          defender,
          move,
          attackerStats,
          defenderStats,
          conditions || {}
        );

        return new Response(
          JSON.stringify({
            damage: result,
            attackerStats,
            defenderStats,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "calculate-stats": {
        const { pokemon, baseStats } = body;

        if (!pokemon || !baseStats) {
          return new Response(
            JSON.stringify({ error: "Missing pokemon or baseStats data" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const stats = calculateActualStats(pokemon, baseStats);

        return new Response(
          JSON.stringify({ stats }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "type-effectiveness": {
        const { moveType, defenderTypes } = body;

        if (!moveType || !defenderTypes) {
          return new Response(
            JSON.stringify({ error: "Missing moveType or defenderTypes" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const effectiveness = getTypeEffectiveness(moveType, defenderTypes);

        return new Response(
          JSON.stringify({ effectiveness, multiplier: effectiveness }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "type-chart": {
        return new Response(
          JSON.stringify(TYPE_CHART),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "natures": {
        return new Response(
          JSON.stringify(Object.entries(NATURE_EFFECTS).map(([name, effect]) => ({
            name,
            increase: effect?.increase || null,
            decrease: effect?.decrease || null,
            neutral: effect === null,
          }))),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default: {
        return new Response(
          JSON.stringify({
            endpoints: [
              "?action=calculate - Calculate damage",
              "?action=calculate-stats - Calculate actual stats from IV/EV",
              "?action=type-effectiveness - Get type multiplier",
              "?action=type-chart - Get full type chart",
              "?action=natures - Get all natures and their effects",
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
