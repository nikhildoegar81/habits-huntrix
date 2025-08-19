'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Dashboard(){
  const s = supabase();
  const [weekPoints, setWeekPoints] = useState<number>(0);
  const [byHabit, setByHabit] = useState<any[]>([]);

  useEffect(()=>{(async()=>{
    const { data: prof } = await s.from('profiles').select('id').single();
    if(!prof) return;
    const today = new Date();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const start = new Date(end); start.setDate(end.getDate()-6);
    const ds = (d: Date) => d.toISOString().slice(0,10);

    const { data: habits } = await s.from('habits').select('id,name').eq('user_id', prof!.id).eq('is_active', true).order('sort_order');

    let total = 0; const rows: any[] = [];
    for (const h of habits||[]) {
      const { data: logs } = await s
        .from('habit_logs')
        .select('status,points')
        .eq('user_id', prof!.id).eq('habit_id', h.id)
        .gte('log_date', ds(start)).lte('log_date', ds(end));
      const yes = logs?.filter(l=>l.status==='yes').length||0;
      const exc = logs?.filter(l=>l.status==='exception').length||0;
      const pts = logs?.reduce((s,l)=>s+(l.points||0),0)||0; total += pts;
      rows.push({ name: h.name, yes, exc, pts });
    }

    const { data: bonus } = await s
      .from('points_ledger')
      .select('amount')
      .eq('user_id', prof!.id)
      .gte('created_at', start.toISOString())
      .lte('created_at', new Date(end.getTime()+24*3600*1000).toISOString());
    total += (bonus||[]).reduce((s,b)=>s+b.amount,0);

    setWeekPoints(total); setByHabit(rows);
  })();},[]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Progress</h1>
      <div className="rounded-2xl border bg-white p-4 mb-4">
        <div className="text-sm text-neutral-500">This week</div>
        <div className="text-3xl font-bold">{weekPoints} pts</div>
      </div>
      <div className="space-y-3">
        {byHabit.map(h => (
          <div key={h.name} className="rounded-2xl border bg-white p-3">
            <div className="font-medium">{h.name}</div>
            <div className="text-sm">Yes: {h.yes} • Exception: {h.exc} • Points: {h.pts}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
