# PCDC Teen Club Connect — PRD

## Overview
A safety-first, teen-only community and mentorship app for PCDC Teen Club. Builds daily engagement, private support, and skill-building with strict role-gated communication and staff moderation.

## Goals
- Daily engagement via mood check-ins and prompts
- Safe mentor/staff messaging — no teen-to-teen DMs
- Cohort-based spaces with moderated channels
- Short mentor/staff video clips with purposeful CTAs
- Staff oversight: moderation queue, block/report, crisis resources

## Audience & Roles
- Teen: participates in cohorts, posts, reacts, checks in, bookmarks tools; messages assigned mentors/staff only
- Mentor: supports assigned teens; posts clips; participates in cohort channels; office hours
- Staff: full access; set prompts, manage cohorts/roles; review moderation queue; resources management

## Core Features
1. Auth & Profiles: Email/password (Supabase). Onboarding: nickname, grade, interests (tags), language pref.
2. Daily Pulse: one-tap mood (1–5), tags, optional note. Private streak, Today’s Prompt, Quick Tools (breathing, grounding, reframe).
3. Spaces: cohorts with channels (Announcements, Wins, Ask, Study, Off-topic). Posts are text + optional image. Reactions subtle. Optional anonymous posting in Ask (anonymous to teens, visible to staff).
4. Clips: mentor/staff-only short videos (15–60s). Limited daily set (10). CTAs: Save Tool, Try Now, Ask Mentor.
5. Inbox: 1:1 threads teen↔assigned mentors/staff. Realtime via Supabase; fallback polling. Lite read receipts.
6. Resources: curated entries by staff; categories; Help Now section; Saved Tools.
7. Moderation & Safety: report/block; staff moderation queue; rate limits; block enforcement across content.

## Safety Model
- No public follower counts/like counts; no infinite scroll
- Role-gated messaging: teens may DM only assigned mentors/staff; optional moderated cohort group chat
- Minimal PII: nickname or first name + last initial; grade; interests; language preference
- Crisis support: prominent “Help Now” static section; advise emergency services for immediate danger
- Moderation queue: staff can manage reports with statuses and notes; reporters see their own reports
- Block enforcement: hidden content across posts/messages/clips between blocker and blocked
- RLS enforces role-based access with cohort membership; staff override for moderation

## User Flows
### Onboarding
1. Sign up → Verify email → Create profile (nickname, grade, interests) → Await cohort assignment
2. If mentor/staff, role granted by staff; see appropriate tabs and capabilities

### Daily Pulse
Tap mood (1–5) → optional tags/note → streak updates → Quick Tools available → Prompt visible with link to cohort response

### Spaces
Select cohort → choose channel tab → write post (text + optional image) → subtle reactions → optionally report/block content → staff moderation sees reports

### Clips
View Today’s 10 → watch clip → tap CTA (Save Tool/ Try Now/ Ask Mentor) → bookmark stored; Ask leads to DM with assigned mentors

### Inbox
Open 1:1 threads with mentors/staff → send text → realtime updates; read receipts shown; report/block available

### Resources & Help Now
Browse categories; open resource; bookmark; see Help Now static crisis text and guidance; contact emergency if danger

## Non-Goals
No public social graph; no teen-to-teen DMs; no infinite algorithmic feed; no video editor; no payments; no advanced ML

## Success Metrics
- % teens with 3+ check-ins/week
- % teens watching 3+ clips/week
- Mentor response latency (median)
- Staff moderation SLA
- Reported incident resolution time

