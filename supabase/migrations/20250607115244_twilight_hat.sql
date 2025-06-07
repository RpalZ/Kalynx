/*
  # Foodprint+Fit Initial Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `created_at` (timestamp)
    - `meals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `name` (text)
      - `calories` (numeric)
      - `protein` (numeric)
      - `carbon_impact` (numeric)
      - `water_impact` (numeric)
      - `created_at` (timestamp)
    - `workouts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `type` (text)
      - `duration` (integer, minutes)
      - `calories_burned` (numeric)
      - `created_at` (timestamp)
    - `daily_scores`
      - `user_id` (uuid, foreign key)
      - `date` (date)
      - `fitness_score` (numeric)
      - `eco_score` (numeric)
      - `combined_score` (numeric)
    - `recipes_generated`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `source` (text: manual, scan, fridge)
      - `title` (text)
      - `ingredients` (text array)
      - `estimated_cost` (numeric)
      - `carbon_impact` (numeric)
      - `water_impact` (numeric)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Meals table
CREATE TABLE IF NOT EXISTS meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  calories numeric DEFAULT 0,
  protein numeric DEFAULT 0,
  carbon_impact numeric DEFAULT 0,
  water_impact numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  duration integer NOT NULL DEFAULT 0,
  calories_burned numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Daily scores table
CREATE TABLE IF NOT EXISTS daily_scores (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  fitness_score numeric DEFAULT 0,
  eco_score numeric DEFAULT 0,
  combined_score numeric DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

-- Recipes generated table
CREATE TABLE IF NOT EXISTS recipes_generated (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  source text NOT NULL CHECK (source IN ('manual', 'scan', 'fridge')),
  title text NOT NULL,
  ingredients text[] DEFAULT '{}',
  estimated_cost numeric DEFAULT 0,
  carbon_impact numeric DEFAULT 0,
  water_impact numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes_generated ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own meals" ON meals
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals" ON meals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals" ON meals
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals" ON meals
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own workouts" ON workouts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts" ON workouts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts" ON workouts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts" ON workouts
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own daily scores" ON daily_scores
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily scores" ON daily_scores
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily scores" ON daily_scores
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read leaderboard" ON daily_scores
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can read own recipes" ON recipes_generated
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipes" ON recipes_generated
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes" ON recipes_generated
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes" ON recipes_generated
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_created_at ON meals(created_at);
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_created_at ON workouts(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_scores_date ON daily_scores(date);
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes_generated(user_id);