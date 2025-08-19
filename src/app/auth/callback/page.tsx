'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const s = supabase();

    // Supabase JS will automatically parse the access_token in the URL
    // on first use in the browser. We then check for the session and redirect.
    const sub = s.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace('/settings');
    });

    // Also check immediately in case the session is already set.
    s.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/settings');
    });

    return () => {
      sub.data.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="p-4 text-sm">
      Signing you in… If this page stays here, go back and try again.
    </div>
  );
}
