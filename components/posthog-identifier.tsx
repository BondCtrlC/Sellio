'use client';

import { useEffect, useRef } from 'react';
import posthog from 'posthog-js';
import { createClient } from '@/lib/supabase/client';

export function PostHogIdentifier() {
  const identified = useRef(false);

  useEffect(() => {
    if (identified.current) return;

    const identify = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: creator } = await supabase
        .from('creators')
        .select('username, display_name, plan')
        .eq('user_id', user.id)
        .single();

      posthog.identify(user.id, {
        email: user.email,
        username: creator?.username,
        display_name: creator?.display_name,
        plan: creator?.plan,
      });

      identified.current = true;
    };

    identify();
  }, []);

  return null;
}
