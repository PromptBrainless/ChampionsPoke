import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const POKEAPI_BASE = "https://pokeapi.co/api/v2";
const CACHE_DURATION_HOURS = 24;

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchFromApi(endpoint: string): Promise<any> {
  const response = await fetch(`${POKEAPI_BASE}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json();
}

async function getCachedPokemon(id: number): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from("pokemon_cache")
      .select("data, updated_at")
      .eq("pokemon_id", id)
      .maybeSingle();

    if (error || !data) return null;

    const updatedAt = new Date(data.updated_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > CACHE_DURATION_HOURS) return null;

    return data.data;
  } catch {
    return null;
  }
}

async function cachePokemon(id: number, data: any): Promise<void> {
  try {
    await supabase
      .from("pokemon_cache")
      .upsert(
        {
          pokemon_id: id,
          name: data.name,
          data: data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "pokemon_id" }
      );
  } catch (e) {
    console.error("Cache error:", e);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const url = new URL(req.url);
  const searchParams = url.searchParams;

  // Get parameters
  const pokemonId = searchParams.get("id");
  const pokemonName = searchParams.get("name");
  const moveName = searchParams.get("move");
  const typeName = searchParams.get("type");
  const abilityName = searchParams.get("ability");
  const itemName = searchParams.get("item");
  const searchQuery = searchParams.get("q");
  const typesFlag = searchParams.get("types");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    // Pokemon by ID
    if (pokemonId && !moveName && !abilityName && !itemName) {
      const id = parseInt(pokemonId);
      if (!isNaN(id)) {
        let pokemonData = await getCachedPokemon(id);
        if (!pokemonData) {
          pokemonData = await fetchFromApi(`/pokemon/${id}`);
          await cachePokemon(id, pokemonData);
        }
        return new Response(JSON.stringify(pokemonData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Pokemon by name
    if (pokemonName && !moveName && !abilityName && !itemName) {
      try {
        const pokemonData = await fetchFromApi(`/pokemon/${pokemonName.toLowerCase()}`);
        await cachePokemon(pokemonData.id, pokemonData);
        return new Response(JSON.stringify(pokemonData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ error: "Pokemon not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Pokemon list
    if (!pokemonId && !pokemonName && !moveName && !abilityName && !itemName && !searchQuery && !typesFlag) {
      const listData = await fetchFromApi(`/pokemon?limit=${limit}&offset=${offset}`);

      // Fetch details for first few
      const detailed = await Promise.all(
        listData.results.slice(0, Math.min(10, limit)).map(async (p: any) => {
          const match = p.url.match(/\/pokemon\/(\d+)\//);
          if (match) {
            const id = parseInt(match[1]);
            let data = await getCachedPokemon(id);
            if (!data) {
              try {
                data = await fetchFromApi(`/pokemon/${id}`);
                await cachePokemon(id, data);
              } catch {
                return null;
              }
            }
            return data;
          }
          return null;
        })
      );

      return new Response(
        JSON.stringify({
          count: listData.count,
          next: listData.next,
          previous: listData.previous,
          results: detailed.filter(Boolean),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Move
    if (moveName) {
      const moveData = await fetchFromApi(`/move/${moveName.toLowerCase()}`);
      return new Response(JSON.stringify(moveData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Types
    if (typesFlag) {
      const typesData = await fetchFromApi("/type?limit=20");
      const types = await Promise.all(
        typesData.results.map(async (t: any) => {
          const detail = await fetchFromApi(`/type/${t.name}`);
          return {
            name: t.name,
            damage_relations: detail.damage_relations,
          };
        })
      );
      return new Response(JSON.stringify(types), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ability
    if (abilityName) {
      const abilityData = await fetchFromApi(`/ability/${abilityName.toLowerCase()}`);
      return new Response(JSON.stringify(abilityData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Item
    if (itemName) {
      const itemData = await fetchFromApi(`/item/${itemName.toLowerCase()}`);
      return new Response(JSON.stringify(itemData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Search
    if (searchQuery) {
      const listData = await fetchFromApi("/pokemon?limit=1025");
      const filtered = listData.results.filter((p: any) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      const detailed = await Promise.all(
        filtered.slice(0, 20).map(async (p: any) => {
          const match = p.url.match(/\/pokemon\/(\d+)\//);
          if (match) {
            const id = parseInt(match[1]);
            let data = await getCachedPokemon(id);
            if (!data) {
              try {
                data = await fetchFromApi(`/pokemon/${id}`);
                await cachePokemon(id, data);
              } catch {
                return null;
              }
            }
            return { id, name: p.name, ...data };
          }
          return null;
        })
      );

      return new Response(
        JSON.stringify({ results: detailed.filter(Boolean) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default - show endpoints
    return new Response(
      JSON.stringify({
        endpoints: [
          "?id=25 - Get Pokemon by ID",
          "?name=pikachu - Get Pokemon by name",
          "?limit=20&offset=0 - List Pokemon",
          "?move=earthquake - Get move data",
          "?types - Get all types",
          "?ability=intimidate - Get ability data",
          "?item=leftovers - Get item data",
          "?q=char - Search Pokemon by name",
        ],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
