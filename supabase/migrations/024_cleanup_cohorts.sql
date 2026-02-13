-- Delete irrelevant cohorts (like Temple) and keep only year-based ones
DELETE FROM cohorts 
WHERE name NOT LIKE '%-%' AND name != '2025-2026' AND name != '2026-2027';

-- Ensure 2025-2026 cohort exists
INSERT INTO cohorts (name, description, active)
VALUES ('2025-2026', 'Cohort for the 2025-2026 academic year', true)
ON CONFLICT (name) DO NOTHING;

-- Ensure 2026-2027 cohort exists
INSERT INTO cohorts (name, description, active)
VALUES ('2026-2027', 'Cohort for the 2026-2027 academic year', true)
ON CONFLICT (name) DO NOTHING;

-- Create channels for 2025-2026 cohort
DO $$
DECLARE
  cohort_id uuid;
BEGIN
  SELECT id INTO cohort_id FROM cohorts WHERE name = '2025-2026';
  
  IF cohort_id IS NOT NULL THEN
    -- General Chat
    INSERT INTO channels (cohort_id, name, type, visibility, slug)
    VALUES (cohort_id, 'General Chat', 'chat', 'members', 'general-chat')
    ON CONFLICT DO NOTHING;
    
    -- Community Board
    INSERT INTO channels (cohort_id, name, type, visibility, slug)
    VALUES (cohort_id, 'Community Board', 'feed', 'members', 'community-board')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Create channels for 2026-2027 cohort
DO $$
DECLARE
  cohort_id uuid;
BEGIN
  SELECT id INTO cohort_id FROM cohorts WHERE name = '2026-2027';
  
  IF cohort_id IS NOT NULL THEN
    -- General Chat
    INSERT INTO channels (cohort_id, name, type, visibility, slug)
    VALUES (cohort_id, 'General Chat', 'chat', 'members', 'general-chat')
    ON CONFLICT DO NOTHING;
    
    -- Community Board
    INSERT INTO channels (cohort_id, name, type, visibility, slug)
    VALUES (cohort_id, 'Community Board', 'feed', 'members', 'community-board')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
