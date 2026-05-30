/*
  # Pokemon Champions Database Schema

  1. New Tables
    - `pokemon_cache`
      - `id` (serial, primary key)
      - `pokemon_id` (integer, unique)
      - `name` (text)
      - `data` (jsonb) - Full Pokemon data from PokeAPI
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `moves_cache`
      - `id` (serial, primary key)
      - `move_id` (integer, unique)
      - `name` (text)
      - `data` (jsonb) - Full move data
      - `created_at` (timestamptz)
    
    - `types_cache`
      - `id` (serial, primary key)
      - `type_id` (integer, unique)
      - `name` (text)
      - `damage_relations` (jsonb)
      - `created_at` (timestamptz)
    
    - `abilities_cache`
      - `id` (serial, primary key)
      - `ability_id` (integer, unique)
      - `name` (text)
      - `data` (jsonb)
      - `created_at` (timestamptz)
    
    - `items_cache`
      - `id` (serial, primary key)
      - `item_id` (integer, unique)
      - `name` (text)
      - `data` (jsonb)
      - `created_at` (timestamptz)
    
    - `user_teams`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `description` (text)
      - `format` (text) - e.g., "vgc2026", "doubles", "singles"
      - `is_public` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `team_members`
      - `id` (uuid, primary key)
      - `team_id` (uuid, references user_teams)
      - `pokemon_id` (integer)
      - `pokemon_name` (text)
      - `nickname` (text)
      - `level` (integer, default 50)
      - `ability` (text)
      - `item` (text)
      - `nature` (text)
      - `moves` (jsonb array)
      - `evs` (jsonb) - {hp, atk, def, spa, spd, spe}
      - `ivs` (jsonb) - {hp, atk, def, spa, spd, spe}
      - `tera_type` (text)
      - `position` (integer) - Team slot 1-6
      - `created_at` (timestamptz)
    
    - `saved_calculations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `attacker` (jsonb)
      - `defender` (jsonb)
      - `move` (jsonb)
      - `result` (jsonb)
      - `created_at` (timestamptz)
    
    - `news_cache`
      - `id` (serial, primary key)
      - `title` (text)
      - `content` (text)
      - `url` (text, unique)
      - `source` (text)
      - `published_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all user-related tables
    - Public read access for cache tables
    - User-specific access for teams and calculations
*/

-- Pokemon Cache Table
CREATE TABLE IF NOT EXISTS pokemon_cache (
  id SERIAL PRIMARY KEY,
  pokemon_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moves Cache Table
CREATE TABLE IF NOT EXISTS moves_cache (
  id SERIAL PRIMARY KEY,
  move_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Types Cache Table
CREATE TABLE IF NOT EXISTS types_cache (
  id SERIAL PRIMARY KEY,
  type_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  damage_relations JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Abilities Cache Table
CREATE TABLE IF NOT EXISTS abilities_cache (
  id SERIAL PRIMARY KEY,
  ability_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items Cache Table
CREATE TABLE IF NOT EXISTS items_cache (
  id SERIAL PRIMARY KEY,
  item_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Teams Table
CREATE TABLE IF NOT EXISTS user_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  format TEXT DEFAULT 'vgc2026',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES user_teams(id) ON DELETE CASCADE,
  pokemon_id INTEGER NOT NULL,
  pokemon_name TEXT NOT NULL,
  nickname TEXT DEFAULT '',
  level INTEGER DEFAULT 50,
  ability TEXT DEFAULT '',
  item TEXT DEFAULT '',
  nature TEXT DEFAULT 'hardy',
  moves JSONB DEFAULT '[]'::jsonb,
  evs JSONB DEFAULT '{"hp": 0, "atk": 0, "def": 0, "spa": 0, "spd": 0, "spe": 0}'::jsonb,
  ivs JSONB DEFAULT '{"hp": 31, "atk": 31, "def": 31, "spa": 31, "spd": 31, "spe": 31}'::jsonb,
  tera_type TEXT DEFAULT '',
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved Calculations Table
CREATE TABLE IF NOT EXISTS saved_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  attacker JSONB NOT NULL,
  defender JSONB NOT NULL,
  move JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- News Cache Table
CREATE TABLE IF NOT EXISTS news_cache (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  url TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'pokemon.com',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_calculations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_teams
CREATE POLICY "Users can view own teams"
  ON user_teams FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public teams"
  ON user_teams FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can insert own teams"
  ON user_teams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own teams"
  ON user_teams FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own teams"
  ON user_teams FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for team_members
CREATE POLICY "Users can view team members of own teams"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_teams
      WHERE user_teams.id = team_members.team_id
      AND (user_teams.user_id = auth.uid() OR user_teams.is_public = true)
    )
  );

CREATE POLICY "Users can insert team members to own teams"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_teams
      WHERE user_teams.id = team_members.team_id
      AND user_teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update team members of own teams"
  ON team_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_teams
      WHERE user_teams.id = team_members.team_id
      AND user_teams.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_teams
      WHERE user_teams.id = team_members.team_id
      AND user_teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete team members of own teams"
  ON team_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_teams
      WHERE user_teams.id = team_members.team_id
      AND user_teams.user_id = auth.uid()
    )
  );

-- RLS Policies for saved_calculations
CREATE POLICY "Users can view own calculations"
  ON saved_calculations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calculations"
  ON saved_calculations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own calculations"
  ON saved_calculations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pokemon_cache_name ON pokemon_cache(name);
CREATE INDEX IF NOT EXISTS idx_moves_cache_name ON moves_cache(name);
CREATE INDEX IF NOT EXISTS idx_types_cache_name ON types_cache(name);
CREATE INDEX IF NOT EXISTS idx_user_teams_user_id ON user_teams(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_news_cache_published ON news_cache(published_at DESC);
