import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Copy, ExternalLink } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function MagicLinkRedirectHelper() {
  const [copied, setCopied] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [correctUrl, setCorrectUrl] = useState('');

  useEffect(() => {
    const hash = window.location.hash;
    const hasAccessToken = hash.includes('access_token');
    setHasToken(hasAccessToken);

    if (hasAccessToken) {
      const appUrl = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
      const newUrl = `${appUrl}/score${hash}`;
      setCorrectUrl(newUrl);
    }
  }, []);

  const copyUrl = async () => {
    if (correctUrl) {
      await navigator.clipboard.writeText(correctUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openCorrectUrl = () => {
    if (correctUrl) {
      window.location.href = correctUrl;
    }
  };

  if (!hasToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-900 via-brand-900/20 to-neutral-900 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <AlertCircle className="h-6 w-6 text-amber-400" />
              Incorrect URL
            </CardTitle>
            <CardDescription>
              This page is not meant to be accessed directly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-neutral-300">
              It looks like you've navigated to an incorrect URL. Magic links should redirect to the correct
              application URL automatically.
            </p>

            <div className="rounded-lg border border-surface-border/70 bg-surface-base/60 p-4">
              <h3 className="mb-2 font-semibold text-white">What to do:</h3>
              <ol className="list-inside list-decimal space-y-2 text-sm text-neutral-300">
                <li>Request a new magic link from the login page</li>
                <li>Make sure you're using the correct application URL</li>
                <li>Contact your administrator if the issue persists</li>
              </ol>
            </div>

            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
            >
              Go to Home Page
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-900 via-brand-900/20 to-neutral-900 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <AlertCircle className="h-6 w-6 text-amber-400" />
            Magic Link Configuration Issue
          </CardTitle>
          <CardDescription>
            The magic link is redirecting to the wrong URL
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <p className="text-neutral-300">
              Your magic link authentication was successful, but you've been redirected to the wrong URL. This
              happens when the Supabase Site URL is misconfigured.
            </p>

            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-amber-200">
                <AlertCircle className="h-4 w-4" />
                Action Required
              </h3>
              <p className="text-sm text-amber-100">
                An administrator needs to update the Site URL in the Supabase Dashboard. See{' '}
                <code className="rounded bg-neutral-800 px-1 py-0.5">MAGIC_LINK_FIX.md</code> for detailed
                instructions.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-white">Temporary Workaround:</h3>
            <p className="text-sm text-neutral-300">
              Click the button below to manually navigate to the correct URL with your authentication token:
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={openCorrectUrl}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600"
              >
                <ExternalLink className="h-4 w-4" />
                Open Correct URL
              </button>

              <button
                type="button"
                onClick={copyUrl}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-surface-border/70 bg-surface-highlight/60 px-4 py-2.5 text-sm font-medium text-white transition hover:border-brand-400/70"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy URL
                  </>
                )}
              </button>
            </div>

            <div className="rounded-lg border border-surface-border/70 bg-surface-base/60 p-3">
              <p className="break-all font-mono text-xs text-neutral-400">{correctUrl}</p>
            </div>
          </div>

          <div className="rounded-lg border border-surface-border/70 bg-surface-base/60 p-4">
            <h3 className="mb-3 font-semibold text-white">For Administrators:</h3>
            <ol className="list-inside list-decimal space-y-2 text-sm text-neutral-300">
              <li>Open your Supabase Dashboard</li>
              <li>
                Navigate to <span className="font-semibold text-white">Authentication → URL Configuration</span>
              </li>
              <li>
                Update <span className="font-semibold text-white">Site URL</span> to:{' '}
                <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-brand-200">
                  {import.meta.env.VITE_APP_URL || 'http://localhost:5173'}
                </code>
              </li>
              <li>
                Add to <span className="font-semibold text-white">Redirect URLs</span> whitelist:{' '}
                <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-brand-200">
                  {import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/**
                </code>
              </li>
              <li>Save changes and request a new magic link</li>
            </ol>
          </div>

          <p className="text-center text-sm text-neutral-400">
            See{' '}
            <a
              href="https://github.com/yourusername/yourrepo/blob/main/MAGIC_LINK_FIX.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-200 underline hover:text-brand-100"
            >
              MAGIC_LINK_FIX.md
            </a>{' '}
            for complete troubleshooting steps
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
