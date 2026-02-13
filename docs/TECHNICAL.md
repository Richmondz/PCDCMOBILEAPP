# Technical Architecture

## Stack
- Mobile: React Native (Expo) + TypeScript
- Backend: Supabase (Auth, Postgres, Storage, Realtime)
- State: Zustand
- Navigation: React Navigation
- UI: shared components using tokens; dark/light themes
- Media: expo-image-picker, expo-av

## Architecture Overview
- App talks to Supabase via `@supabase/supabase-js`
- RLS policies enforce role-/membership-based access
- Storage buckets: `clips`, `post_media` with policies
- Edge function or simple server-side rate-limit checks later (MVP client throttling)

## Database Schema Summary
- profiles(id, role, nickname, grade, tags, language_pref, created_at)
- cohorts(id, name, active)
- cohort_memberships(cohort_id, user_id, status, joined_at)
- channels(id, cohort_id, name, visibility)
- channel_posts(id, channel_id, author_id, content, media_url, created_at, anonymous)
- reactions(post_id, user_id, reaction_type)
- mentor_assignments(teen_id, mentor_id, created_at)
- check_ins(id, user_id, mood, tags, note, created_at)
- journal_entries(id, user_id, content, share_to_mentor, created_at)
- clips(id, author_id, title, description, video_url, created_at, active_date)
- clip_bookmarks(clip_id, user_id)
- resources(id, title, category, description, url, created_by, created_at)
- conversations(id, created_at)
- conversation_members(conversation_id, user_id, role_in_thread, last_read_at)
- messages(id, conversation_id, sender_id, content, created_at)
- blocks(blocker_id, blocked_id, created_at)
- reports(id, reporter_id, target_type, target_id, reason, details, status, created_at)
- staff_notes(id, staff_id, report_id, note, created_at)

## RLS Strategy
- Authenticated-only baseline
- Role checks via `profiles.role`
- Cohort/channel policies: teens read/write only in cohorts where they are members; mentors/staff in assigned cohorts; staff read/write all
- Clips: write mentors/staff; read all authenticated
- Resources: write staff; read all authenticated
- DMs: only conversation members; teen can only create conversations with assigned mentors/staff
- Block enforcement via helper `is_blocked(a,b)` predicate applied to selection/insertion
- Reports visible to staff; reporters see own reports

## Mobile Organization
- `src/theme/tokens.ts`: colors, spacing, radius, typography
- `src/components/*`: AppHeader, Card, Buttons, PillTag, Composer, EmptyState, Toast, BottomSheet
- `src/screens/*`: Home, Spaces, Clips, Inbox, Profile; Auth: SignIn/SignUp/Onboarding
- `src/store/*`: Zustand stores (auth, ui)
- `src/lib/supabase.ts`: client setup
- `src/navigation/index.tsx`: tab + auth stacks

## Setup
- Configure `expo.extra.SUPABASE_URL` and `expo.extra.SUPABASE_ANON_KEY` in `app.json`
- Run migrations in Supabase; seed via `supabase/seed/seed.ts` using service role

