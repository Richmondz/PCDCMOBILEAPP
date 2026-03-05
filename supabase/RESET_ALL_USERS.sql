-- RESET ALL USERS - Run this in Supabase SQL Editor to delete every user and start fresh
-- WARNING: This permanently deletes all users, profiles, and related data. Cannot be undone.

-- BEFORE RUNNING THIS:
-- Supabase blocks user deletion if they own Storage objects. Clear storage first if needed:
-- Dashboard → Storage → avatars, post_media, clips → delete all files.

-- Delete profiles first (cascades to cohort_memberships, posts, messages, scores, etc.)
DELETE FROM public.profiles;

-- Then delete auth users
DELETE FROM auth.users;

-- Done. All users, profiles, scores, messages, and related data are removed.
-- New signups will create fresh profiles via the handle_new_user trigger.
