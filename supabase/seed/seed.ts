import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL as string
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

if (!url || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, serviceRoleKey)

async function run() {
  // Create users
  const users = [
    { email: 'staff@example.com', password: 'Password123!', role: 'staff', nickname: 'PCDC Staff' },
    { email: 'mentor1@example.com', password: 'Password123!', role: 'mentor', nickname: 'Mentor A' },
    { email: 'teen1@example.com', password: 'Password123!', role: 'teen', nickname: 'Alex T.' },
  ]

  const created: { id: string; email: string; role: string; nickname: string }[] = []
  for (const u of users) {
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    })
    if (error) throw error
    created.push({ id: data.user!.id, email: u.email, role: u.role, nickname: u.nickname })
  }

  // Insert profiles
  for (const u of created) {
    const { error } = await admin.from('profiles').insert({ id: u.id, role: u.role, nickname: u.nickname })
    if (error) throw error
  }

  // Create cohort
  const { data: cohort, error: cohortErr } = await admin.from('cohorts').insert({ name: 'Fall Cohort' }).select().single()
  if (cohortErr) throw cohortErr

  // Memberships
  for (const u of created) {
    const { error } = await admin.from('cohort_memberships').insert({ cohort_id: cohort.id, user_id: u.id })
    if (error) throw error
  }

  // Assign teen to mentor
  const teen = created.find(c => c.role === 'teen')!
  const mentor = created.find(c => c.role === 'mentor')!
  await admin.from('mentor_assignments').insert({ teen_id: teen.id, mentor_id: mentor.id })

  // Sample channel + post
  const { data: ann, error: chErr } = await admin.from('channels').insert({ cohort_id: cohort.id, name: 'Announcements' }).select().single()
  if (chErr) throw chErr
  await admin.from('channel_posts').insert({ channel_id: ann.id, author_id: created.find(c => c.role === 'staff')!.id, content: 'Welcome to Teen Club!' })

  // Sample resource
  await admin.from('resources').insert({ title: 'Crisis Text Line', category: 'stress/anxiety', description: 'Text HOME to 741741', url: 'https://www.crisistextline.org/', created_by: created.find(c => c.role === 'staff')!.id })

  console.log('Seed complete')
}

run().catch(err => { console.error(err); process.exit(1) })

