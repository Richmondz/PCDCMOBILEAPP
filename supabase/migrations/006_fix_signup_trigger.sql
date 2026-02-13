-- Create the trigger function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, role, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nickname', 'New User'),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'teen'),
    new.email
  );
  RETURN new;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add email column to profiles if it's missing (useful for admin search)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
