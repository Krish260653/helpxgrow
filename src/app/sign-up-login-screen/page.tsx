'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import AppLogo from '@/components/ui/AppLogo';
import { AppProvider } from '@/context/AppContext';

type Mode = 'signin' | 'signup';

interface SignInForm {
  email: string;
  password: string;
  remember: boolean;
}

interface SignUpForm {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  password: string;
  terms: boolean;
}

function PasswordStrengthMeter({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
    { label: 'Special character', met: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.met).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  const textColors = ['', 'text-red-400', 'text-orange-400', 'text-yellow-400', 'text-green-400'];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {[1, 2, 3, 4].map(i => (
          <div
            key={`strength-bar-${i}`}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-zinc-700'}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${textColors[score]}`}>{labels[score]}</span>
        <div className="flex gap-2">
          {checks.map((c, i) => (
            <span key={`check-${i}`} className={`text-[10px] ${c.met ? 'text-green-400' : 'text-zinc-600'}`}>
              {c.met ? '✓' : '○'} {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function OAuthButton({ provider, onClick, loading }: { provider: 'google' | 'github'; onClick: () => void; loading: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:border-zinc-600 text-sm font-medium text-zinc-200 transition-all duration-150 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-zinc-500 border-t-zinc-200 rounded-full animate-spin" />
      ) : provider === 'google' ? (
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
        </svg>
      )}
      Continue with {provider === 'google' ? 'Google' : 'GitHub'}
    </button>
  );
}

function SignInForm({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<SignInForm>();

  const handleOAuth = async (provider: 'google' | 'github') => {
    setOauthLoading(provider);
    await new Promise(r => setTimeout(r, 800));
    setOauthLoading(null);
    toast.success(`Signed in with ${provider === 'google' ? 'Google' : 'GitHub'}`);
    router.push('/home-dashboard');
  };

  const onSubmit = async (data: SignInForm) => {
    setSubmitLoading(true);
    setAuthError('');
    await new Promise(r => setTimeout(r, 600));
    // BACKEND INTEGRATION POINT: POST /api/auth/signin
    if (data.email === 'demo@helpxgrow.ai' && data.password === 'HELPxGROW@2026') {
      toast.success('Welcome back!');
      router.push('/home-dashboard');
    } else {
      setAuthError('Invalid credentials. Try: demo@helpxgrow.ai / HELPxGROW@2026');
    }
    setSubmitLoading(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Sign in to HELPxGROW</h2>
        <p className="text-sm text-zinc-500 mt-1">Multi-agent AI platform</p>
      </div>

      {/* OAuth */}
      <div className="space-y-2">
        <OAuthButton provider="google" onClick={() => handleOAuth('google')} loading={oauthLoading === 'google'} />
        <OAuthButton provider="github" onClick={() => handleOAuth('github')} loading={oauthLoading === 'github'} />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-xs text-zinc-600">or continue with email</span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {authError && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">{authError}</div>
        )}

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Work Email</label>
          <input
            type="email"
            {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' } })}
            placeholder="you@company.com"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-zinc-400">Password</label>
            <button type="button" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">Forgot password?</button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password', { required: 'Password is required' })}
              placeholder="••••••••"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="remember"
            {...register('remember')}
            className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-zinc-900"
          />
          <label htmlFor="remember" className="text-xs text-zinc-400">Remember me for 30 days</label>
        </div>

        <button
          type="submit"
          disabled={submitLoading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-zinc-900 font-semibold text-sm transition-all duration-150 active:scale-[0.99]"
        >
          {submitLoading ? <><span className="w-4 h-4 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />Signing in…</> : 'Sign In'}
        </button>
      </form>

      {/* Demo credentials */}
      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <p className="text-[11px] text-blue-400 font-mono">
          Demo credentials — Email: demo@helpxgrow.ai · Password: HELPxGROW@2026
        </p>
      </div>

      <p className="text-xs text-zinc-500 text-center">
        Don&apos;t have an account?{' '}
        <button onClick={onSwitch} className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">Sign up free</button>
      </p>
    </div>
  );
}

function SignUpForm({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignUpForm>();
  const watchedPassword = watch('password', '');

  React.useEffect(() => {
    setPasswordValue(watchedPassword || '');
  }, [watchedPassword]);

  const handleOAuth = async (provider: 'google' | 'github') => {
    setOauthLoading(provider);
    await new Promise(r => setTimeout(r, 800));
    setOauthLoading(null);
    toast.success(`Account created with ${provider === 'google' ? 'Google' : 'GitHub'}`);
    router.push('/home-dashboard');
  };

  const onSubmit = async () => {
    setSubmitLoading(true);
    await new Promise(r => setTimeout(r, 800));
    // BACKEND INTEGRATION POINT: POST /api/auth/signup
    setSuccess(true);
    setSubmitLoading(false);
    toast.success('Account created!');
    setTimeout(() => router.push('/home-dashboard'), 2000);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-5xl">🎉</div>
        <h2 className="text-xl font-bold text-white">Account created!</h2>
        <p className="text-sm text-zinc-400 text-center">Redirecting to your dashboard…</p>
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Create your account</h2>
        <p className="text-sm text-zinc-500 mt-1">Start with HELPxGROW Agentic AI</p>
      </div>

      <div className="space-y-2">
        <OAuthButton provider="google" onClick={() => handleOAuth('google')} loading={oauthLoading === 'google'} />
        <OAuthButton provider="github" onClick={() => handleOAuth('github')} loading={oauthLoading === 'github'} />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-xs text-zinc-600">or with email</span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">First Name</label>
            <input
              type="text"
              {...register('firstName', { required: 'Required' })}
              placeholder="Arjun"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {errors.firstName && <p className="mt-1 text-xs text-red-400">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Last Name</label>
            <input
              type="text"
              {...register('lastName', { required: 'Required' })}
              placeholder="Mehta"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {errors.lastName && <p className="mt-1 text-xs text-red-400">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Work Email</label>
          <input
            type="email"
            {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Valid email required' } })}
            placeholder="arjun@company.com"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Company</label>
          <input
            type="text"
            {...register('company', { required: 'Company is required' })}
            placeholder="Acme Corp"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          {errors.company && <p className="mt-1 text-xs text-red-400">{errors.company.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Minimum 8 characters' },
              })}
              placeholder="Create a strong password"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          <PasswordStrengthMeter password={passwordValue} />
        </div>

        <div className="flex items-start gap-2 pt-1">
          <input
            type="checkbox"
            id="terms"
            {...register('terms', { required: 'You must accept the terms' })}
            className="mt-0.5 w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-cyan-500"
          />
          <label htmlFor="terms" className="text-xs text-zinc-400 leading-relaxed">
            I agree to the{' '}
            <span className="text-cyan-400 cursor-pointer hover:text-cyan-300">Terms of Service</span>
            {' '}and{' '}
            <span className="text-cyan-400 cursor-pointer hover:text-cyan-300">Privacy Policy</span>
          </label>
        </div>
        {errors.terms && <p className="text-xs text-red-400">{errors.terms.message}</p>}

        <button
          type="submit"
          disabled={submitLoading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-zinc-900 font-semibold text-sm transition-all duration-150 active:scale-[0.99]"
        >
          {submitLoading ? <><span className="w-4 h-4 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />Creating account…</> : 'Create Account'}
        </button>
      </form>

      <p className="text-xs text-zinc-500 text-center">
        Already have an account?{' '}
        <button onClick={onSwitch} className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">Sign in</button>
      </p>
    </div>
  );
}

const PLATFORM_STATS = [
  { value: '207×', label: 'Faster than manual' },
  { value: '99.1%', label: 'SLA compliance' },
  { value: '$4.2K', label: 'Penalty avoided' },
  { value: '100%', label: 'Audit coverage' },
];

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('signin');

  return (
    <AppProvider>
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        {/* Radial glow background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
          {/* Left panel — dark brand */}
          <div className="hidden lg:flex flex-col justify-between bg-zinc-900 p-8">
            <div>
              <div className="flex items-center gap-3 mb-8">
                <AppLogo size={36} />
                <div>
                  <div className="text-base font-bold text-white">HELPxGROW</div>
                  <div className="text-xs font-mono text-cyan-400">Agentic AI Platform</div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 leading-tight">
                Autonomous workflows.<br />Zero manual overhead.
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Deploy intelligent agents that handle onboarding, approvals, and meeting actions — with full HMAC-signed audit trail.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 my-8">
              {PLATFORM_STATS.map((stat, i) => (
                <div key={`stat-${i}`} className="p-3 rounded-xl bg-zinc-800 border border-zinc-700">
                  <div className="text-xl font-bold tabular-nums text-cyan-400">{stat.value}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Feature list */}
            <div className="space-y-2">
              {[
                '🧠 6 specialized AI agents',
                '🔒 HMAC-signed audit trail',
                '💰 Smart model cost routing',
                '🛡️ Autonomous SLA recovery',
              ].map((f, i) => (
                <div key={`feat-${i}`} className="flex items-center gap-2 text-xs text-zinc-400">
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel — form */}
          <div className="bg-zinc-950 p-8 flex flex-col justify-center">
            {mode === 'signin' ? (
              <SignInForm onSwitch={() => setMode('signup')} />
            ) : (
              <SignUpForm onSwitch={() => setMode('signin')} />
            )}
          </div>
        </div>
      </div>
    </AppProvider>
  );
}