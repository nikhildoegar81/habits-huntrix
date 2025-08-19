'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Habit = { id: string; name: string };
type Status = 'yes' | 'no' | 'exception';

export default function CheckinPage(){
  const [habits, setHabits] = useState<Habit[]>([]);
  const [today, setToday] = useState<string>('');
  const s = supabase();

  useEffect(()=>{
    const t = new Date();
    setToday(t.toISOString().slice(0,10));
    (async()=>{
      const { data: prof } = await s.from('profiles').select('id').single();
      if(!prof) return;
      const { data } = await s.from('habits').select('id,name').eq('user_id', prof.id).eq('is_active', true).order('sort_order');
      setHabits(data||[]);
    })();
  },[]);

  const setStatus = async (habit_id: string, status: Status) => {
    const { data: prof } = await s.from('profiles').select('id').single();
    if(!prof) return alert('Please sign in via OTP first (Settings tab).');
    const payload = { user_id: prof!.id, habit_id, log_date: today, status };
    await s.from('habit_logs').upsert(payload, { onConflict: 'user_id,habit_id,log_date' });
    alert('Saved!');
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Daily Check-in</h1>
      <p className="mb-4 text-sm">{today}</p>
      <div className="space-y-3">
        {habits.map(h => (
          <div key={h.id} className="rounded-2xl border p-3 bg-white">
            <div className="font-medium mb-2">{h.name}</div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={()=>setStatus(h.id,'yes')} className="rounded-xl bg-emerald-100 px-3 py-2">Yes (+20)</button>
              <button onClick={()=>setStatus(h.id,'exception')} className="rounded-xl bg-amber-100 px-3 py-2">Exception (+10)</button>
              <button onClick={()=>setStatus(h.id,'no')} className="rounded-xl bg-rose-100 px-3 py-2">No (0)</button>
            </div>
          </div>
        ))}
        {habits.length===0 && (
          <div className="text-sm text-neutral-600">No habits yet. Go to <b>Settings</b> to add some.</div>
        )}
      </div>
    </div>
  );
}
