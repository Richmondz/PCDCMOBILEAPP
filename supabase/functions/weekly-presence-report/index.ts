import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export default async function handler(req: Request): Promise<Response> {
  const url = Deno.env.get('SUPABASE_URL')!
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const resend = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('EMAIL_FROM')
  const to = 'yzholdingsllc8011@gmail.com'
  if (!resend || !from) return new Response('Missing email secrets', { status: 500 })
  const supabase = createClient(url, key)

  const { data, error } = await supabase.rpc('weekly_presence_totals', { tz: 'America/New_York' })
  if (error) return new Response(error.message, { status: 500 })
  const rows = (data as Array<{ nickname: string; role: string; total_seconds: number }>) || []
  const html = renderHtml(rows)
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resend}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject: 'Weekly Presence Report', html })
  })
  if (!r.ok) return new Response(await r.text(), { status: 500 })
  return new Response('ok')
}

function renderHtml(rows: Array<{ nickname: string; role: string; total_seconds: number }>) {
  const items = rows.map(r => `<tr><td style="padding:8px;border:1px solid #ddd">${escapeHtml(r.nickname)}</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(r.role)}</td><td style="padding:8px;border:1px solid #ddd">${fmt(r.total_seconds)}</td></tr>`).join('')
  return `<!doctype html><html><body><h2>Weekly Presence (last week)</h2><table style="border-collapse:collapse"><thead><tr><th style="padding:8px;border:1px solid #ddd">User</th><th style="padding:8px;border:1px solid #ddd">Role</th><th style="padding:8px;border:1px solid #ddd">Total</th></tr></thead><tbody>${items}</tbody></table></body></html>`
}

function fmt(s: number) {
  const h = Math.floor(s/3600)
  const m = Math.floor((s%3600)/60)
  return `${h}h ${m}m`
}

function escapeHtml(str: string) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')
}

