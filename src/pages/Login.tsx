import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Lock, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Captcha from '@/components/Captcha';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please enter your username and password.');
      return;
    }

    // Validate captcha
    const codeEl = document.querySelector('[data-captcha-code]') as HTMLInputElement;
    const expectedCode = codeEl?.value ?? '';
    if (captchaInput !== expectedCode) {
      setError('Captcha code is incorrect. Please try again.');
      return;
    }

    setLoading(true);

    // Look up email by username
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username.trim())
      .maybeSingle();

    if (profileErr) {
      setError('Unable to verify account. Please try again.');
      setLoading(false);
      return;
    }
    if (!profile) {
      setError('No account found with that username.');
      setLoading(false);
      return;
    }

    // Sign in with Supabase Auth
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    });

    if (signInErr) {
      setError('Invalid username or password.');
      setLoading(false);
      return;
    }

    navigate('/dashboard');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <Shield className="w-8 h-8 text-slate-900" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-yellow-400 tracking-wide">
            RISK Security
          </h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/70 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl"
        >
          {error && (
            <div className="flex items-start gap-2 text-red-400 text-sm bg-red-950/40 border border-red-500/30 rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-yellow-200/80 mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-950/60 border border-yellow-500/20 text-yellow-50 placeholder-gray-600 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 transition-colors"
                placeholder="Enter your username"
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-yellow-200/80 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-950/60 border border-yellow-500/20 text-yellow-50 placeholder-gray-600 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 transition-colors"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Captcha */}
          <div>
            <label className="block text-sm font-medium text-yellow-200/80 mb-1.5">
              Captcha Verification
            </label>
            <Captcha value={captchaInput} onChange={setCaptchaInput} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 font-semibold hover:from-yellow-300 hover:to-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-yellow-500/20"
          >
            {loading ? 'Signing in…' : 'Log In'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
            >
              Sign up
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
