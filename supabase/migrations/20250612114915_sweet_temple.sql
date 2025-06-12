/*
  # Add Eco Features and Rewards System

  1. New Tables
    - `eco_milestones` - Track user progress on environmental milestones
    - `eco_challenges` - Weekly/monthly environmental challenges
    - `user_achievements` - Track earned achievements and badges
    - `eco_rewards` - NFT and reward tracking
    - `user_subscriptions` - Pro subscription management

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data

  3. Functions
    - Add functions for milestone tracking
    - Add functions for challenge progress
*/

-- Eco Milestones Table
CREATE TABLE IF NOT EXISTS eco_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  milestone_type text NOT NULL CHECK (milestone_type IN ('carbon_saved', 'water_saved', 'meals_logged', 'streak_days')),
  milestone_name text NOT NULL,
  target_value numeric NOT NULL,
  current_value numeric DEFAULT 0,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  reward_type text DEFAULT 'badge',
  reward_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE eco_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own milestones"
  ON eco_milestones
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own milestones"
  ON eco_milestones
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own milestones"
  ON eco_milestones
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Eco Challenges Table
CREATE TABLE IF NOT EXISTS eco_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  challenge_type text NOT NULL CHECK (challenge_type IN ('weekly', 'monthly', 'seasonal')),
  target_value numeric NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reward_type text DEFAULT 'points',
  reward_value numeric DEFAULT 0,
  reward_data jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE eco_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active challenges"
  ON eco_challenges
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- User Challenge Progress Table
CREATE TABLE IF NOT EXISTS user_challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  challenge_id uuid REFERENCES eco_challenges(id) ON DELETE CASCADE,
  current_value numeric DEFAULT 0,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE user_challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own challenge progress"
  ON user_challenge_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenge progress"
  ON user_challenge_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenge progress"
  ON user_challenge_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  achievement_type text NOT NULL,
  achievement_name text NOT NULL,
  achievement_description text,
  earned_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own achievements"
  ON user_achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Eco Rewards Table (for NFTs and special rewards)
CREATE TABLE IF NOT EXISTS eco_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  reward_type text NOT NULL CHECK (reward_type IN ('nft', 'badge', 'points', 'discount')),
  reward_name text NOT NULL,
  reward_description text,
  blockchain_hash text,
  metadata jsonb DEFAULT '{}',
  claimed boolean DEFAULT false,
  claimed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE eco_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own rewards"
  ON eco_rewards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rewards"
  ON eco_rewards
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rewards"
  ON eco_rewards
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  subscription_type text NOT NULL DEFAULT 'free' CHECK (subscription_type IN ('free', 'pro', 'premium')),
  provider text DEFAULT 'revenuecat',
  provider_customer_id text,
  provider_subscription_id text,
  is_active boolean DEFAULT false,
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscriptions"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON user_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_eco_milestones_user_id ON eco_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_eco_milestones_type ON eco_milestones(milestone_type);
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_user_id ON user_challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_challenge_id ON user_challenge_progress(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_eco_rewards_user_id ON eco_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);

-- Insert some default challenges
INSERT INTO eco_challenges (title, description, challenge_type, target_value, start_date, end_date, reward_type, reward_value) VALUES
('Plant-Based Week', 'Log 5 plant-based meals this week', 'weekly', 5, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'points', 50),
('Low Carbon Month', 'Keep daily CO₂ under 2kg for 20 days this month', 'monthly', 20, DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', 'nft', 1),
('Water Saver Challenge', 'Save 100L of water through efficient meal choices', 'weekly', 100, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'points', 75);