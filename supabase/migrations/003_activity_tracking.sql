-- Automated Activity Tracking
CREATE TABLE IF NOT EXISTS daily_activity (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date DEFAULT CURRENT_DATE,
  minutes_active int DEFAULT 0,
  last_active_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE daily_activity ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own activity" ON daily_activity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all activity" ON daily_activity FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
);
-- Only the system (or RPC) updates this, but we'll allow users to update their own row via RPC primarily
CREATE POLICY "Users can update own activity" ON daily_activity FOR UPDATE USING (auth.uid() = user_id);

-- RPC Function to atomically increment minutes
CREATE OR REPLACE FUNCTION increment_activity(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO daily_activity (user_id, date, minutes_active, last_active_at)
  VALUES (p_user_id, CURRENT_DATE, 1, now())
  ON CONFLICT (user_id, date)
  DO UPDATE SET 
    minutes_active = daily_activity.minutes_active + 1,
    last_active_at = now();
END;
$$;
