import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, LifeBuoy, ShieldAlert, ShieldCheck } from 'lucide-react';

import { AuthStatusBanner } from '@/components/auth/AuthStatusBanner';
import { EmailMagicLinkForm, type RequestState } from '@/components/auth/EmailMagicLinkForm';
import { EmailPasswordSignInForm, type SignInState } from '@/components/auth/EmailPasswordSignInForm';
import { EmailPasswordSignUpForm, type SignUpState } from '@/components/auth/EmailPasswordSignUpForm';
import { PasswordResetRequestForm, type ResetRequestState } from '@/components/auth/PasswordResetRequestForm';
import { PinEntryForm } from '@/components/auth/PinEntryForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AuthApiError,
  requestMagicLink,
  requestPasswordReset,
  signInWithPassword,
  signUpWithPassword,
  verifyPin,
} from '@/lib/api';
import { cn } from '@/lib/utils';

type AuthTab = 'signin' | 'signup' | 'magic' | 'pin' | 'reset';

export function AuthPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');

  const [signInState, setSignInState] = useState<SignInState>('idle');
  const [signInError, setSignInError] = useState<string | null>(null);

  const [signUpState, setSignUpState] = useState<SignUpState>('idle');
  const [signUpError, setSignUpError] = useState<string | null>(null);

  const [magicState, setMagicState] = useState<RequestState>('idle');
  const [magicError, setMagicError] = useState<string | null>(null);

  const [pinState, setPinState] = useState<RequestState>('idle');
  const [pinError, setPinError] = useState<string | null>(null);

  const [resetState, setResetState] = useState<ResetRequestState>('idle');
  const [resetError, setResetError] = useState<string | null>(null);

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

  async function handleSignIn(email: string, password: string) {
    setSignInState('loading');
    setSignInError(null);

    try {
      await signInWithPassword({ email, password });
      setSignInState('success');
      setTimeout(() => navigate('/score'), 1000);
    } catch (error) {
      setSignInState('error');
      if (error instanceof AuthApiError) {
        setSignInError(error.message);
      } else {
        setSignInError('Unable to sign in. Please check your credentials and try again.');
      }
    }
  }

  async function handleSignUp(email: string, password: string, fullName?: string) {
    setSignUpState('loading');
    setSignUpError(null);

    try {
      const result = await signUpWithPassword({ email, password, fullName, eventId: 'demo-event' });
      setSignUpState('success');

      if (result.needsEmailConfirmation) {
        setTimeout(() => setActiveTab('signin'), 3000);
      } else {
        setTimeout(() => navigate('/score'), 1000);
      }
    } catch (error) {
      setSignUpState('error');
      if (error instanceof AuthApiError) {
        setSignUpError(error.message);
      } else {
        setSignUpError('Unable to create your account. Please try again.');
      }
    }
  }

  async function handleMagicLinkRequest() {
    setMagicState('loading');
    setMagicError(null);

    try {
      await requestMagicLink({ email });
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

    try {
      await verifyPin({ email, pin });
      setPinState('success');
      setTimeout(() => navigate('/score'), 1000);
    } catch (error) {
      setPinState('error');
      if (error instanceof AuthApiError) {
        setPinError(error.message);
      } else {
        setPinError('Unable to verify the PIN. Request a new code from the organizer.');
      }
    }
  }

  async function handlePasswordResetRequest(email: string) {
    setResetState('loading');
    setResetError(null);

    try {
      await requestPasswordReset({ email });
      setResetState('success');
    } catch (error) {
      setResetState('error');
      if (error instanceof AuthApiError) {
        setResetError(error.message);
      } else {
        setResetError('Unable to send the password reset email. Please try again.');
      }
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-brand-200">Secure access</p>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Authenticate to unlock the judging console</h1>
        <p className="max-w-2xl text-sm text-neutral-300">
          Choose your preferred authentication method to access the judging platform. All methods are secure and
          validated against the event roster.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap gap-2 border-b border-surface-border/50 pb-4">
                <button
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-medium transition',
                    activeTab === 'signin'
                      ? 'bg-brand-500/20 text-brand-200'
                      : 'text-neutral-300 hover:bg-surface-border/20 hover:text-white',
                  )}
                  onClick={() => setActiveTab('signin')}
                  type="button"
                >
                  Sign In
                </button>
                <button
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-medium transition',
                    activeTab === 'signup'
                      ? 'bg-brand-500/20 text-brand-200'
                      : 'text-neutral-300 hover:bg-surface-border/20 hover:text-white',
                  )}
                  onClick={() => setActiveTab('signup')}
                  type="button"
                >
                  Sign Up
                </button>
                <button
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-medium transition',
                    activeTab === 'magic'
                      ? 'bg-brand-500/20 text-brand-200'
                      : 'text-neutral-300 hover:bg-surface-border/20 hover:text-white',
                  )}
                  onClick={() => setActiveTab('magic')}
                  type="button"
                >
                  Magic Link
                </button>
                <button
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-medium transition',
                    activeTab === 'pin'
                      ? 'bg-brand-500/20 text-brand-200'
                      : 'text-neutral-300 hover:bg-surface-border/20 hover:text-white',
                  )}
                  onClick={() => setActiveTab('pin')}
                  type="button"
                >
                  PIN
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === 'signin' && !resetState && (
                <div className="space-y-3">
                  <div>
                    <CardTitle className="mb-1">Sign in with password</CardTitle>
                    <CardDescription>Enter your email and password to access your account.</CardDescription>
                  </div>
                  <EmailPasswordSignInForm
                    email={email}
                    error={signInError}
                    onEmailChange={setEmail}
                    onForgotPassword={() => setActiveTab('reset')}
                    onSubmit={handleSignIn}
                    status={signInState}
                  />
                  <p className="text-center text-xs text-neutral-400">
                    Don't have an account?{' '}
                    <button
                      className="text-brand-300 hover:text-brand-200 focus-visible:outline-none focus-visible:underline"
                      onClick={() => setActiveTab('signup')}
                      type="button"
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              )}

              {activeTab === 'signup' && (
                <div className="space-y-3">
                  <div>
                    <CardTitle className="mb-1">Create your account</CardTitle>
                    <CardDescription>Sign up with your email to get started.</CardDescription>
                  </div>
                  <EmailPasswordSignUpForm
                    email={email}
                    error={signUpError}
                    onEmailChange={setEmail}
                    onSubmit={handleSignUp}
                    showFullNameField
                    status={signUpState}
                    successMessage="Account created! Redirecting to the scoring page..."
                  />
                  <p className="text-center text-xs text-neutral-400">
                    Already have an account?{' '}
                    <button
                      className="text-brand-300 hover:text-brand-200 focus-visible:outline-none focus-visible:underline"
                      onClick={() => setActiveTab('signin')}
                      type="button"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              )}

              {activeTab === 'magic' && (
                <div className="space-y-3">
                  <div>
                    <CardTitle className="mb-1">Magic link access</CardTitle>
                    <CardDescription>
                      The quickest path into the app. We validate the email against the event roster before sending the
                      link.
                    </CardDescription>
                  </div>
                  <EmailMagicLinkForm
                    email={email}
                    error={magicError}
                    helperText="Use your registered judging email. We will never send spam or marketing content."
                    onEmailChange={setEmail}
                    onRequest={handleMagicLinkRequest}
                    status={magicState}
                    successMessage="Check your inbox for the secure link. Use it within 15 minutes."
                  />
                </div>
              )}

              {activeTab === 'pin' && (
                <div className="space-y-3">
                  <div>
                    <CardTitle className="mb-1">PIN fallback</CardTitle>
                    <CardDescription>
                      If your email inbox is unavailable, enter the one-time PIN provided by operations to unlock cached
                      access.
                    </CardDescription>
                  </div>
                  <PinEntryForm
                    email={email}
                    error={pinError}
                    helperText="Pins rotate nightly. Contact the operations desk if you need a reset or a new device."
                    onEmailChange={setEmail}
                    onPinChange={setPin}
                    onSubmit={handlePinVerification}
                    pin={pin}
                    status={pinState}
                    successMessage="PIN verified. Redirecting to scoring page..."
                  />
                </div>
              )}

              {activeTab === 'reset' && (
                <PasswordResetRequestForm
                  email={email}
                  error={resetError}
                  onBackToSignIn={() => setActiveTab('signin')}
                  onEmailChange={setEmail}
                  onSubmit={handlePasswordResetRequest}
                  status={resetState}
                  successMessage="Check your email for password reset instructions."
                />
              )}
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
                  If you reconnect, we will finalize pending requests automatically. You can continue scoring offline
                  for up to 12 hours.
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
