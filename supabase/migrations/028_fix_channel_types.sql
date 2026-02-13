-- Fix channel types to match frontend convention
-- The frontend expects 'posts' but the cleanup migration inserted 'board'

UPDATE channels 
SET type = 'posts' 
WHERE type = 'board';