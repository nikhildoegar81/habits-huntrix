/**
 * Supabase Edge Function: award-streaks
 * Awards +200 points for any habit with a 7-day YES streak ending yesterday.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function main(req: Request): Promise<Response> {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(url, key);

  const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
  const userId = profiles?.[0]?.id;
  if (!userId) return new Response("No profile", { status: 200 });

  const { data: habits } = await supabase.from('habits').select('id').eq('user_id', userId).eq('is_active', true);
  if (!habits) return new Response("No habits", { status: 200 });

  const today = new Date();
  const y = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 1));
  const dstr = (d: Date) => d.toISOString().slice(0,10);

  for (const h of habits) {
    const start = new Date(y); start.setUTCDate(y.getUTCDate() - 6);
    const { data: logs } = await supabase
      .from('habit_logs')
      .select('log_date,status')
      .eq('user_id', userId).eq('habit_id', h.id)
      .gte('log_date', dstr(start)).lte('log_date', dstr(y))
      .order('log_date', { ascending: true });

    if (!logs || logs.length < 7) continue;
    const allYes = logs.every(l => l.status === 'yes');
    if (!allYes) continue;

    const endDate = dstr(y);
    const { data: exists } = await supabase
      .from('streak_awards')
      .select('id').eq('user_id', userId).eq('habit_id', h.id).eq('streak_end_date', endDate).limit(1);

    if (exists && exists.length) continue;

    await supabase.from('streak_awards').insert({ user_id: userId, habit_id: h.id, streak_end_date: endDate });
    await supabase.from('points_ledger').insert({ user_id: userId, source: 'streak7', related_habit: h.id, amount: 200, awarded_for_date: endDate });
  }

  return new Response("ok", { status: 200 });
}
