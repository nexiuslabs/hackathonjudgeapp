import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { getSupabaseClient } from '@/lib/api';

function normaliseRedirectTarget(params: URLSearchParams): string | null {
  const raw = params.get('redirect_to') ?? params.get('next');
  if (!raw) {
    return null;
  }

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch (error) {
    console.warn('Failed to decode redirect target from magic link', error);
  }

  if (/^https?:/i.test(decoded)) {
    try {
      const url = new URL(decoded);
      if (typeof window !== 'undefined' && url.origin === window.location.origin) {
        return url.pathname + url.search + url.hash;
      }
      return null;
    } catch (error) {
      console.warn('Invalid absolute redirect target from magic link', error);
      return null;
    }
  }

  if (!decoded.startsWith('/')) {
    return `/${decoded}`;
  }

  return decoded;
}

export function MagicLinkHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const hasHandledRef = useRef(false);

  useEffect(() => {
    if (hasHandledRef.current) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const hash = location.hash || window.location.hash;
    if (!hash || !hash.includes('access_token')) {
      return;
    }

    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const type = params.get('type')?.toLowerCase();

    if (!type || (type !== 'magiclink' && type !== 'recovery')) {
      return;
    }

    hasHandledRef.current = true;

    const redirectTarget = normaliseRedirectTarget(params) ?? '/score';

    const supabase = getSupabaseClient();

    const consumeMagicLink = async () => {
      try {
        await supabase.auth.getSession();
      } catch (error) {
        console.warn('Failed to hydrate Supabase session from magic link', error);
      }

      const cleanUrl = `${window.location.pathname}${window.location.search}`;
      window.history.replaceState(window.history.state, '', cleanUrl);

      navigate(redirectTarget, { replace: true });
    };

    void consumeMagicLink();
  }, [location.hash, navigate]);

  return null;
}
