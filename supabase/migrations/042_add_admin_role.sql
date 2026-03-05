-- Add 'admin' to user_role enum for admin dashboard access
-- Admin has same access as staff; use for primary/super admin accounts
alter type public.user_role add value if not exists 'admin';
