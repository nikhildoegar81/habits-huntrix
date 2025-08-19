src/app/settings/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Settings(){
  const s = supabase();
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [habits, setHabits] = useState<any[]>([]);

  useEffect(()=>{(async()=>{
    const { data: prof } = await s.from('profiles').select('id,email,nickname').single();
    if(prof){ setNickname(prof.nickname||''); setEmail(prof.email||''); }
    const { data: hs } = await s.from('habits').select('id,name,is_active,sort_order').order('sort_order');
    setHabits(hs||[]);
  })();},[]);

  const saveProfile = async () => {
    const { data: prof } = await s.from('profiles').select('id').single();
    await s.from('profiles').update({ nickname }).eq('id', prof!.id);
    alert('Saved');
  };
  const addHabit = async () => {
    const { data: prof } = await s.from('profiles').select('id').single();
    await s.from('habits').insert({ user_id: prof!.id, name: 'New habit', sort_order: (habits?.length||0)+1 });
    location.reload();
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>
      <div className="space-y-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="font-medium mb-2">Profile</div>
          <input className="w-full rounded-xl border p-2 mb-2" value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="Nickname"/>
          <div className="text-xs text-neutral-500">Login email: {email}</div>
          <button onClick={saveProfile} className="mt-2 rounded-xl bg-blue-100 px-3 py-2">Save</button>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">Habits</div>
            <button onClick={addHabit} className="rounded-xl bg-green-100 px-3 py-1">+ Add</button>
          </div>
          <div className="space-y-2">
            {habits.map(h => (
              <div key={h.id} className="flex items-center gap-2">
                <input className="flex-1 rounded-xl border p-2" defaultValue={h.name} onBlur={async (e)=>{
                  await s.from('habits').update({ name: e.target.value }).eq('id', h.id);
                }}/>
                <label className="text-sm flex items-center gap-2">
                  Active <input type="checkbox" defaultChecked={h.is_active} onChange={async(ev)=>{
                    await s.from('habits').update({ is_active: ev.target.checked }).eq('id', h.id);
                  }}/>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
