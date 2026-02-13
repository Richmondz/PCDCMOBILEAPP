# PCDC Teen Club Connect

Safety-first teen mentorship app built with Expo + Supabase.

## UI Requirement
Implement the entire app using the design system tokens. Use `src/theme/tokens.ts` and reusable UI components. No inline random colors. All screens must use shared components.

## Tech Stack
- Expo (React Native, TypeScript)
- Supabase (Auth, Postgres, Storage, Realtime)
- Zustand, React Navigation

## Environment
Set in `app.json` under `expo.extra`:
```
SUPABASE_URL
SUPABASE_ANON_KEY
```

## Scripts
```
npm install
npm run start
npm run android
npm run ios
```

## Milestones
- M1: Scaffold + Auth + Profiles
- M2: Spaces + Moderation
- M3: Daily Pulse
- M4: Inbox
- M5: Clips
- M6: Moderation Queue + notifications

## QA Checklist (MVP)
- Auth: sign in/out, profile creation
- RLS: teen cannot access other cohorts; mentors/staff limited to assignments; staff full access
- Block/report flows function and persist
- Clips only by mentors/staff; teens can view/bookmark
- Inbox restricted to assigned mentors/staff
- Help Now visible at all times

## Moderation Test Cases
- Report a post: teen files report; report appears in staff moderation queue; status updates to in_review → resolved.
- Block user: teen blocks a user; blocked user’s posts and messages no longer appear; attempts to react/post in blocked context are prevented.
- Staff notes: add notes to reports; verify persistence.
- Content visibility: staff can access and review all; mentors limited to assigned cohorts; teens limited to memberships.

## Notifications (MVP)
- In-thread realtime updates: new messages arrive via Supabase Realtime; fallback polling every 3s.
- Prompt: daily prompt loads on Home; can be set by staff in `daily_prompts`.
- Cohort announcements: posts in Announcements channel visible to members; verify timely retrieval with refresh.
