import { useEffect, useState } from 'react';
import { CalendarCheck, LifeBuoy, ShieldAlert, ShieldCheck } from 'lucide-react';

import { AuthStatusBanner } from '@/components/auth/AuthStatusBanner';
import { EmailMagicLinkForm, type RequestState } from '@/components/auth/EmailMagicLinkForm';
import { PinEntryForm } from '@/components/auth/PinEntryForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthApiError, requestMagicLink, verifyPin } from '@/lib/api';

export function AuthPage() {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [magicState, setMagicState] = useState<RequestState>('idle');
  const [magicError, setMagicError] = useState<string | null>(null);
  const [magicSuccessMessage, setMagicSuccessMessage] = useState<string>('Check your inbox for the secure link.');
  const [pinState, setPinState] = useState<RequestState>('idle');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccessMessage, setPinSuccessMessage] = useState<string>('PIN verified. You are ready to judge offline.');
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return !window.navigator.onLine;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    function handleOnlineChange() {
      setIsOffline(!window.navigator.onLine);
    }

    window.addEventListener('online', handleOnlineChange);
    window.addEventListener('offline', handleOnlineChange);
    return () => {
      window.removeEventListener('online', handleOnlineChange);
      window.removeEventListener('offline', handleOnlineChange);
    };
  }, []);

  async function handleMagicLinkRequest() {
    setMagicState('loading');
    setMagicError(null);

    try {
      await requestMagicLink({ email });
      setMagicSuccessMessage('Check your inbox for the secure link. Use it within 15 minutes.');
      setMagicState('success');
    } catch (error) {
      setMagicState('error');
      if (error instanceof AuthApiError) {
        setMagicError(error.message);
      } else {
        setMagicError('We could not send the magic link. Double-check the email and try again.');
      }
    }
  }

  async function handlePinVerification() {
    setPinState('loading');
    setPinError(null);
    setPinSuccessMessage('PIN verified. You are ready to judge offline.');

    try {
      const result = await verifyPin({ email, pin });
      setPinSuccessMessage(result.message ?? 'PIN verified. Session unlocked for offline access.');
      setPinState('success');
    } catch (error) {
      setPinState('error');
      if (error instanceof AuthApiError) {
        setPinError(error.message);
      } else {
        setPinError('Unable to verify the PIN. Request a new code from the organizer.');
      }
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-brand-200">Secure access</p>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Authenticate to unlock the judging console</h1>
        <p className="max-w-2xl text-sm text-neutral-300">
          Request a fresh magic link or fall back to the organizer-issued PIN so you remain productive—even when the venue Wi-Fi
          drops.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Magic link access</CardTitle>
              <CardDescription>
                The quickest path into the app. We validate the email against the event roster before sending the link.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmailMagicLinkForm
                email={email}
                error={magicError}
                helperText="Use your registered judging email. We will never send spam or marketing content."
                onEmailChange={setEmail}
                onRequest={handleMagicLinkRequest}
                status={magicState}
                successMessage={magicSuccessMessage}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>PIN fallback</CardTitle>
              <CardDescription>
                If your email inbox is unavailable, enter the one-time PIN provided by operations to unlock cached access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PinEntryForm
                email={email}
                error={pinError}
                helperText="Pins rotate nightly. Contact the operations desk if you need a reset or a new device."
                onEmailChange={setEmail}
                onPinChange={setPin}
                onSubmit={handlePinVerification}
                pin={pin}
                status={pinState}
                successMessage={pinSuccessMessage}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <AuthStatusBanner
            description={
              isOffline
                ? 'We will queue your requests locally and sync them once a connection returns. Keep the page open for automatic retries.'
                : 'Stay signed in to keep your offline cache warm. We refresh tokens quietly in the background.'
            }
            title={isOffline ? 'Offline mode active' : 'Session monitoring enabled'}
            variant={isOffline ? 'offline' : 'info'}
          >
            <div className="text-xs text-neutral-200">
              {isOffline ? (
                <p>
                  If you reconnect, we will finalize pending requests automatically. You can continue scoring offline for up to
                  12 hours.
                </p>
              ) : (
                <p>Need to switch devices? Use the magic link to sign out elsewhere and keep your data consistent.</p>
              )}
            </div>
          </AuthStatusBanner>

          <Card className="space-y-4">
            <CardHeader className="flex flex-row items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/15 text-brand-200">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <CardTitle>Access checklist</CardTitle>
                <CardDescription>Follow these quick checks before the first pitch starts.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-neutral-200">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-1 h-4 w-4 text-amber-300" aria-hidden="true" />
                <p>Confirm your email matches the roster. Mismatches are auto-rejected for security.</p>
              </div>
              <div className="flex items-start gap-3">
                <CalendarCheck className="mt-1 h-4 w-4 text-brand-200" aria-hidden="true" />
                <p>Refresh your PIN after quiet hours. Organizers issue new codes each morning.</p>
              </div>
              <div className="flex items-start gap-3">
                <LifeBuoy className="mt-1 h-4 w-4 text-sky-200" aria-hidden="true" />
                <p>Need help? Ping the ops desk in Slack #judges-support or call the hotline listed in your briefing.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
