/**
 * Supabase Edge Function: weekly-email
 * Computes weekly summary and queues an email (replace with your email provider call).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
function ds(d: Date){ return d.toISOString().slice(0,10); }

export async function main(req: Request): Promise<Response> {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(url, key);

  const { data: profile } = await supabase.from('profiles').select('id,email,nickname').single();
  if (!profile) return new Response("no profile", { status: 200 });

  const { data: settings } = await supabase.from('app_settings').select('weekly_email_enabled, timezone').eq('user_id', profile.id).single();
  if (!settings?.weekly_email_enabled) return new Response("disabled", { status: 200 });

  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(end); start.setUTCDate(end.getUTCDate() - 6);

  const { data: habits } = await supabase.from('habits').select('id,name').eq('user_id', profile.id).eq('is_active', true).order('sort_order');

  let totalPoints = 0;
  const byHabit: any[] = [];

  for (const h of (habits||[])) {
    const { data: logs } = await supabase
      .from('habit_logs')
      .select('status,points')
      .eq('user_id', profile.id).eq('habit_id', h.id)
      .gte('log_date', ds(start)).lte('log_date', ds(end));

    const yes = (logs||[]).filter(l=>l.status==='yes').length;
    const exc = (logs||[]).filter(l=>l.status==='exception').length;
    const pts = (logs||[]).reduce((s,l)=>s+(l.points||0),0);
    totalPoints += pts;
    byHabit.push({ name: h.name, yes, exc, completed: yes+exc, days: 7 });
  }

  const { data: bonus } = await supabase
    .from('points_ledger').select('amount')
    .eq('user_id', profile.id)
    .gte('created_at', start.toISOString())
    .lte('created_at', new Date(end.getTime()+24*3600*1000).toISOString());
  totalPoints += (bonus||[]).reduce((s,b)=>s+b.amount,0);

  await supabase.from('points_ledger').insert({
    user_id: profile.id,
    source: 'manual',
    amount: 0,
    meta: { type: 'weekly_email_queued', to: profile.email, summary: { totalPoints, byHabit } }
  });

  return new Response("queued", { status: 200 });
}
