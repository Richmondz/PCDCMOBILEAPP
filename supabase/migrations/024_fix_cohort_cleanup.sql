-- Fix cohort cleanup by handling foreign key constraints properly
-- First, update profiles to remove references to irrelevant cohorts

-- Step 1: Create the year-based cohorts if they don't exist
INSERT INTO cohorts (name, description, active) VALUES 
('2025-2026', 'High School Students 2025-2026', true),
('2026-2027', 'High School Students 2026-2027', true)
ON CONFLICT (name) DO NOTHING;

-- Step 2: Update profiles to set cohort_id to NULL for irrelevant cohorts
UPDATE profiles 
SET cohort_id = NULL 
WHERE cohort_id IN (
  SELECT id FROM cohorts 
  WHERE name NOT LIKE '%-%' 
  AND name != '2025-2026' 
  AND name != '2026-2027'
);

-- Step 3: Delete all channels for irrelevant cohorts
DELETE FROM channels 
WHERE cohort_id IN (
  SELECT id FROM cohorts 
  WHERE name NOT LIKE '%-%' 
  AND name != '2025-2026' 
  AND name != '2026-2027'
);

-- Step 4: Delete all cohort memberships for irrelevant cohorts
DELETE FROM cohort_memberships 
WHERE cohort_id IN (
  SELECT id FROM cohorts 
  WHERE name NOT LIKE '%-%' 
  AND name != '2025-2026' 
  AND name != '2026-2027'
);

-- Step 5: Delete all cohort challenges for irrelevant cohorts
DELETE FROM cohort_challenges 
WHERE cohort_id IN (
  SELECT id FROM cohorts 
  WHERE name NOT LIKE '%-%' 
  AND name != '2025-2026' 
  AND name != '2026-2027'
);

-- Step 6: Delete all cohort mutes for irrelevant cohorts
DELETE FROM cohort_mutes 
WHERE cohort_id IN (
  SELECT id FROM cohorts 
  WHERE name NOT LIKE '%-%' 
  AND name != '2025-2026' 
  AND name != '2026-2027'
);

-- Step 7: Delete all membership requests for irrelevant cohorts
DELETE FROM membership_requests 
WHERE cohort_id IN (
  SELECT id FROM cohorts 
  WHERE name NOT LIKE '%-%' 
  AND name != '2025-2026' 
  AND name != '2026-2027'
);

-- Step 8: Now safely delete the irrelevant cohorts
DELETE FROM cohorts 
WHERE name NOT LIKE '%-%' 
AND name != '2025-2026' 
AND name != '2026-2027';

-- Step 9: Ensure year-based cohorts have their required channels
INSERT INTO channels (cohort_id, name, type, visibility) 
SELECT c.id, 'General Chat', 'chat', 'members'
FROM cohorts c 
WHERE c.name IN ('2025-2026', '2026-2027')
AND NOT EXISTS (
  SELECT 1 FROM channels ch 
  WHERE ch.cohort_id = c.id AND ch.name = 'General Chat'
);

INSERT INTO channels (cohort_id, name, type, visibility) 
SELECT c.id, 'Community Board', 'board', 'members'
FROM cohorts c 
WHERE c.name IN ('2025-2026', '2026-2027')
AND NOT EXISTS (
  SELECT 1 FROM channels ch 
  WHERE ch.cohort_id = c.id AND ch.name = 'Community Board'
);