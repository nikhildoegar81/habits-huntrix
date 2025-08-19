'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Settings(){
  const s = supabase();
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [habits, setHabits] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [signedIn, setSignedIn] = useState<boolean>(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(()=>{(async()=>{
    const { data: userRes } = await s.auth.getUser();
    if (userRes?.user) {
      setSignedIn(true);
      const { data: profile } = await s.from('profiles').select('id,email,nickname').eq('id', userRes.user.id).single();
      if (!profile) {
        await s.from('profiles').insert({ id: userRes.user.id, email: userRes.user.email, nickname: 'Kiddo' });
        await s.from('app_settings').insert({ user_id: userRes.user.id });
        const defaults = [
          'Getting ready for school on time',
          'Sleep on time',
          'High-quality brushing',
          'High-quality bath',
          'Do one good thing',
          'Show respect to elders',
        ];
        await s.from('habits').insert(defaults.map((name, i)=>({ user_id: userRes.user.id, name, sort_order: i+1 })));
      }
      const { data: prof } = await s.from('profiles').select('id,email,nickname').single();
      if(prof){ setNickname(prof.nickname||''); setEmail(prof.email||''); }
      const { data: hs } = await s.from('habits').select('id,name,is_active,sort_order').order('sort_order');
      setHabits(hs||[]);
    } else {
      setSignedIn(false);
    }
    const { data: sub } = s.auth.onAuthStateChange((_event, session)=>{
      if(session?.user){ location.reload(); }
    });
    return () => { sub.subscription.unsubscribe(); };
  })();},[]);

const sendOtp = async () => {
  setSending(true);
  const { error } = await s.auth.signInWithOtp({
    email: userEmail,
    options: {
      emailRedirectTo: typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : undefined
    }
  });
  setSending(false);
  if (error) alert(error.message); else setSent(true);
};
  
  const saveProfile = async () => {
    const { data: prof } = await s.from('profiles').select('id').single();
    if(!prof) return alert('Please sign in first.');
    await s.from('profiles').update({ nickname }).eq('id', prof!.id);
    alert('Saved');
  };
  const addHabit = async () => {
    const { data: prof } = await s.from('profiles').select('id').single();
    if(!prof) return;
    await s.from('habits').insert({ user_id: prof!.id, name: 'New habit', sort_order: (habits?.length||0)+1 });
    location.reload();
  };

  if(!signedIn){
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-4">Settings</h1>
        <div className="rounded-2xl border bg-white p-4">
          <div className="font-medium mb-2">Sign in</div>
          <p className="text-sm text-neutral-600 mb-3">Enter your email to receive a one-time magic link.</p>
          <input className="w-full rounded-xl border p-2 mb-2" type="email" placeholder="you@example.com" value={userEmail} onChange={(e)=>setUserEmail(e.target.value)} />
          <button disabled={sending || !userEmail} onClick={sendOtp} className="rounded-xl bg-blue-100 px-3 py-2">{sending ? 'Sending...' : 'Send OTP link'}</button>
          {sent && <div className="text-sm text-emerald-700 mt-2">Check your email and open the link on this device.</div>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>
      <div className="space-y-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="font-medium mb-2">Profile</div>
          <input className="w-full rounded-xl border p-2 mb-2" value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="Nickname"/>
          <div className="text-xs text-neutral-500">Login email: {email || '—'}</div>
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
                    await s.from('habits').update({ is_active: (ev.target as HTMLInputElement).checked }).eq('id', h.id);
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
