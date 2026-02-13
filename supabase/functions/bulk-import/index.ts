import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'

const url = Deno.env.get('SUPABASE_URL')!
const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(url, service)

function parseCSV(csv: string): Array<Record<string, string>> {
  const lines = csv.trim().split(/\r?\n/)
  const header = lines.shift()!.split(',').map(h => h.trim())
  return lines.map(line => {
    const cells = line.split(',').map(c => c.trim())
    const row: Record<string, string> = {}
    header.forEach((h, i) => { row[h] = cells[i] || '' })
    return row
  })
}

async function ensureUser(email: string, nickname: string, role: 'teen'|'mentor'|'staff') {
  const { data: existing } = await supabase.from('profiles').select('id').eq('id', (await supabase.from('auth.users').select('id').eq('email', email)).data?.[0]?.id || '').limit(1)
  // Supabase PostgREST cannot select auth schema like that; fallback using auth admin
  const { data: find } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 })
  let user = find.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) {
    const pwd = crypto.randomUUID() + '!Aa1'
    const created = await supabase.auth.admin.createUser({ email, password: pwd, email_confirm: true })
    user = created.data.user!
  }
  await supabase.from('profiles').upsert({ id: user!.id, role, nickname })
  return user!.id
}

async function ensureCohort(name: string) {
  const { data } = await supabase.from('cohorts').select('id').eq('name', name).limit(1)
  let id = data && data[0]?.id
  if (!id) id = (await supabase.from('cohorts').insert({ name }).select('id').single()).data!.id
  return id
}

async function assignMembership(userId: string, cohortId: string) {
  await supabase.from('cohort_memberships').upsert({ cohort_id: cohortId, user_id: userId, status: 'active' })
}

async function assignMentor(teenId: string, mentorEmail?: string) {
  if (!mentorEmail) return
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 })
  const mentorUser = list.users.find(u => u.email?.toLowerCase() === mentorEmail.toLowerCase())
  if (!mentorUser) return
  await supabase.from('mentor_assignments').upsert({ teen_id: teenId, mentor_id: mentorUser.id })
}

export default async function handler(req: Request): Promise<Response> {
  const body = await req.json()
  const { csv } = body
  const rows = parseCSV(csv)
  const logs: any[] = []
  for (const r of rows) {
    const email = r.email
    const nickname = r.nickname || email.split('@')[0]
    const role = (r.role || 'teen') as 'teen'|'mentor'|'staff'
    const cohort = r.cohort || 'General'
    const mentor_email = r.mentor_email || ''
    const uid = await ensureUser(email, nickname, role)
    const cohortId = await ensureCohort(cohort)
    await assignMembership(uid, cohortId)
    if (role === 'teen') await assignMentor(uid, mentor_email)
    await supabase.from('audit_logs').insert({ actor_id: null, action: 'bulk_import_row', target_type: 'user', target_id: uid, meta: { email, nickname, role, cohort, mentor_email } })
    logs.push({ email, ok: true })
  }
  return new Response(JSON.stringify({ ok: true, logs }), { headers: { 'content-type': 'application/json' } })
}

serve(handler)

