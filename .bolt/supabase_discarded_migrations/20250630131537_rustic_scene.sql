/*
  # Add User Stats Table

  1. New Tables
    - `user_stats` - Track user statistics for quick access
      - `user_id` (uuid, primary key)
      - `totalco2e` (double precision)
      - `totalwater` (double precision)
      - `mealscount` (integer)
      - `workoutscount` (integer)
      - `caloriesburned` (integer)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on the new table
    - Add policies for authenticated users to access their own data

  3. Functions
    - Add function to update the updated_at column
*/

-- User Stats Table
CREATE TABLE IF NOT EXISTS user_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  totalco2e double precision DEFAULT 0,
  totalwater double precision DEFAULT 0,
  mealscount integer DEFAULT 0,
  workoutscount integer DEFAULT 0,
  caloriesburned integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at column
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON user_stats
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
CREATE POLICY "Enable users to view their own data only" ON user_stats
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own stats" ON user_stats
  FOR DELETE
  TO public
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own stats" ON user_stats
  FOR INSERT
  TO public
  WITH CHECK (user_id = auth.uid());

-- Add detailed_ingredients column to meals table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meals' AND column_name = 'detailed_ingredients'
  ) THEN
    ALTER TABLE meals ADD COLUMN detailed_ingredients jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;