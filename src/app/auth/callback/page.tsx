'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [msg, setMsg] = useState('Signing you in…');

  useEffect(() => {
    const run = async () => {
      const s = supabase();

      // 1) Handle the "token_hash" style links (type can be: magiclink | recovery | invite)
      const token_hash = searchParams.get('token_hash');
      const type = (searchParams.get('type') || 'magiclink') as
        'magiclink' | 'recovery' | 'invite' | 'signup' | 'email_change';

      if (token_hash) {
        const { data, error } = await s.auth.verifyOtp({ type, token_hash });
        if (error) {
          setMsg(`Could not verify OTP (${error.message}). Try sending a new link.`);
          return;
        }
        // Success → go to settings
        router.replace('/settings');
        return;
      }

      // 2) Handle older-style links with #access_token in URL hash
      //    supabase-js v2 usually picks these up automatically on getSession()
      const { data: { session } } = await s.auth.getSession();
      if (session) {
        router.replace('/settings');
        return;
      }

      // 3) Still nothing? Show a helpful message.
      setMsg('Still signing you in… If this page stays here, open the magic link in the same browser where the app is running (not an email app’s mini-browser).');
    };

    run();
  }, [router, searchParams]);

  return <div className="p-4 text-sm">{msg}</div>;
}
