import { createClient } from '@supabase/supabase-js'

type Creds = { email: string, password: string }
const url = process.env.SUPABASE_URL!
const anon = process.env.SUPABASE_ANON_KEY!
const teenA: Creds = { email: process.env.TEEN_A_EMAIL!, password: process.env.TEEN_A_PASSWORD! }
const teenB: Creds = { email: process.env.TEEN_B_EMAIL!, password: process.env.TEEN_B_PASSWORD! }
const mentorA: Creds = { email: process.env.MENTOR_A_EMAIL!, password: process.env.MENTOR_A_PASSWORD! }
const staffA: Creds = { email: process.env.STAFF_A_EMAIL!, password: process.env.STAFF_A_PASSWORD! }

async function login(c: Creds) { const s = createClient(url, anon); await s.auth.signInWithPassword(c); return s }
function log(name: string, ok: boolean) { console.log(`${ok?'PASS':'FAIL'} - ${name}`) }

async function run() {
  const sTeenA = await login(teenA)
  const sTeenB = await login(teenB)
  const sMentorA = await login(mentorA)
  const sStaffA = await login(staffA)

  // 1 Cohort isolation: teenA should not see teenB cohort posts if not shared cohort
  const postsA = await sTeenA.from('channel_posts').select('id,channel_id').limit(10)
  const postsBView = await sTeenA.from('channel_posts').select('id').eq('author_id', (await sTeenB.auth.getUser()).data.user?.id!)
  log('Cohort isolation', !!postsA.data && postsBView.data?.length===0)

  // 2 DM restrictions: teenA cannot DM teenB
  const tryDm = await sTeenA.rpc('create_dm', { target: (await sTeenB.auth.getUser()).data.user?.id })
  log('DM restrictions', !!tryDm.error)

  // 3 Block enforcement: after blocking teenB, teenB messages hidden
  const teenAId = (await sTeenA.auth.getUser()).data.user!.id
  const teenBId = (await sTeenB.auth.getUser()).data.user!.id
  await sTeenA.from('blocks').insert({ blocker_id: teenAId, blocked_id: teenBId })
  const msgs = await sTeenA.from('messages').select('*').eq('sender_id', teenBId)
  log('Block enforcement', (msgs.data||[]).length===0)

  // 4 Escalation update permissions: mentorA can create, staffA can update
  const escCreate = await sMentorA.from('escalations').insert({ reason: 'test', severity: 'low', conversation_id: (await sMentorA.from('conversations').select('id').limit(1)).data?.[0]?.id })
  const escId = (escCreate.data as any)?.[0]?.id
  const escUpdateAsMentor = await sMentorA.from('escalations').update({ status: 'resolved' }).eq('id', escId)
  const escUpdateAsStaff = await sStaffA.from('escalations').update({ status: 'in_review' }).eq('id', escId)
  log('Escalation update mentor denied', !!escUpdateAsMentor.error)
  log('Escalation update staff allowed', !escUpdateAsStaff.error)

  // 5 Membership approvals staff-only
  const memReq = await sTeenA.from('membership_requests').insert({ user_id: teenAId, cohort_id: (await sStaffA.from('cohorts').select('id').limit(1)).data?.[0]?.id })
  const memApproveTeen = await sTeenA.from('membership_requests').update({ status: 'approved' }).eq('id', (memReq.data as any)?.[0]?.id)
  const memApproveStaff = await sStaffA.from('membership_requests').update({ status: 'approved' }).eq('id', (memReq.data as any)?.[0]?.id)
  log('Membership approval teen denied', !!memApproveTeen.error)
  log('Membership approval staff allowed', !memApproveStaff.error)

  // 6 Prompt visibility: auth-only
  const dpStaff = await sStaffA.from('daily_prompts').select('*').limit(1)
  log('Daily prompts visible to staff', !!dpStaff.data)

  // 7 Clips write mentors/staff only
  const clipTeen = await sTeenA.from('clips').insert({ title: 'x', description: 'y', video_url: 'z' })
  const clipMentor = await sMentorA.from('clips').insert({ title: 'x', description: 'y', video_url: 'z' })
  log('Clip insert teen denied', !!clipTeen.error)
  log('Clip insert mentor allowed', !clipMentor.error)

  // 8 Messages select only by members
  const anyConv = await sStaffA.from('conversations').select('id').limit(1)
  const msgsTeenA = await sTeenA.from('messages').select('*').eq('conversation_id', anyConv.data?.[0]?.id)
  log('Messages select only by members', !!msgsTeenA.error || (msgsTeenA.data||[]).length===0)

  // 9 Reports staff update only
  const rep = await sTeenA.from('reports').insert({ target_type: 'post', target_id: postsA.data?.[0]?.id, reason: 'test' })
  const repUpdateTeen = await sTeenA.from('reports').update({ status: 'resolved' }).eq('id', (rep.data as any)?.[0]?.id)
  const repUpdateStaff = await sStaffA.from('reports').update({ status: 'resolved' }).eq('id', (rep.data as any)?.[0]?.id)
  log('Report update teen denied', !!repUpdateTeen.error)
  log('Report update staff allowed', !repUpdateStaff.error)

  // 10 Cohorts staff create only
  const cohortTeen = await sTeenA.from('cohorts').insert({ name: 'x' })
  const cohortStaff = await sStaffA.from('cohorts').insert({ name: 'y' })
  log('Cohort insert teen denied', !!cohortTeen.error)
  log('Cohort insert staff allowed', !cohortStaff.error)

  // 11 Guidelines acceptance self-only write
  const gaTeenA = await sTeenA.from('guidelines_acceptance').upsert({ user_id: teenAId })
  const gaTeenBOnA = await sTeenB.from('guidelines_acceptance').upsert({ user_id: teenAId })
  log('Guidelines self-only write', !gaTeenA.error && !!gaTeenBOnA.error)

  // 12 Saved resources self-only
  const srTeenA = await sTeenA.from('saved_resources').insert({ resource_id: (await sStaffA.from('resources').select('id').limit(1)).data?.[0]?.id, user_id: teenAId })
  const srTeenBOnA = await sTeenB.from('saved_resources').insert({ resource_id: (await sStaffA.from('resources').select('id').limit(1)).data?.[0]?.id, user_id: teenAId })
  log('Saved resources self-only', !srTeenA.error && !!srTeenBOnA.error)
}

run().catch(e => { console.error(e); process.exit(1) })

