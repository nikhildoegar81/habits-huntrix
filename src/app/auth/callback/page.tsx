'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// Tell Next.js not to pre-render this page
export const dynamic = 'force-dynamic'; // or: export const revalidate = 0;

export default function AuthCallback() {
  const router = useRouter();
  const [msg, setMsg] = useState('Signing you in…');

  useEffect(() => {
    const s = supabase();

    const run = async () => {
      // Read params from the real browser URL (avoids useSearchParams + Suspense)
      const url = new URL(window.location.href);
      const token_hash = url.searchParams.get('token_hash');
      const type = (url.searchParams.get('type') || 'magiclink') as
        'magiclink' | 'recovery' | 'invite' | 'signup' | 'email_change';

      // Newer Supabase links: ?token_hash=...&type=magiclink
      if (token_hash) {
        const { error } = await s.auth.verifyOtp({ type, token_hash });
        if (error) {
          setMsg(`Could not verify OTP (${error.message}). Try sending a new link and open it in the same browser as the app.`);
          return;
        }
        router.replace('/settings');
        return;
      }

      // Older flow: #access_token=... (handled by getSession)
      const { data: { session } } = await s.auth.getSession();
      if (session) {
        router.replace('/settings');
        return;
      }

      setMsg('Still signing you in… If this page stays here, open the link in the same browser where the app is running (not an email app’s mini-browser).');
    };

    run();
  }, [router]);

  return <div className="p-4 text-sm">{msg}</div>;
}
