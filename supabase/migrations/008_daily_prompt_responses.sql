-- Responses to daily prompts
CREATE TABLE IF NOT EXISTS public.daily_prompt_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt_id uuid REFERENCES public.daily_prompts(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, prompt_id)
);

ALTER TABLE public.daily_prompt_responses ENABLE ROW LEVEL SECURITY;

-- Everyone can read responses (community feature)
CREATE POLICY prompt_responses_select ON public.daily_prompt_responses
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can write their own response
CREATE POLICY prompt_responses_insert ON public.daily_prompt_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own response
CREATE POLICY prompt_responses_update ON public.daily_prompt_responses
  FOR UPDATE USING (auth.uid() = user_id);

-- Add delete policy just in case
CREATE POLICY prompt_responses_delete ON public.daily_prompt_responses
  FOR DELETE USING (auth.uid() = user_id);
