import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, User, Lock, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): string | null => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return 'Please enter a valid email address.';
    if (username.trim().length < 3)
      return 'Username must be at least 3 characters.';
    if (password.length < 6)
      return 'Password must be at least 6 characters.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);

    // Check for duplicate username
    const { data: existingUser, error: userErr } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.trim())
      .maybeSingle();

    if (userErr) {
      setError('Unable to validate username. Please try again.');
      setLoading(false);
      return;
    }
    if (existingUser) {
      setError('That username is already taken.');
      setLoading(false);
      return;
    }

    // Check for duplicate email
    const { data: existingEmail } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email.trim())
      .maybeSingle();

    if (existingEmail) {
      setError('An account with that email already exists.');
      setLoading(false);
      return;
    }

    // Sign up with Supabase Auth
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (signUpErr) {
      setError(signUpErr.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Insert profile row
      const { error: profileErr } = await supabase.from('profiles').insert({
        user_id: data.user.id,
        username: username.trim(),
        email: email.trim(),
      });

      if (profileErr) {
        // Best-effort cleanup: if profile insert fails, the auth row still exists
        // but the user can't log in meaningfully. Show the error.
        setError('Account created but profile save failed: ' + profileErr.message);
        setLoading(false);
        return;
      }

      navigate('/dashboard');
    }

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
          <p className="text-sm text-gray-500 mt-1">Create your account</p>
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

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-yellow-200/80 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-950/60 border border-yellow-500/20 text-yellow-50 placeholder-gray-600 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 transition-colors"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          </div>

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
                placeholder="Choose a username"
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
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 font-semibold hover:from-yellow-300 hover:to-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-yellow-500/20"
          >
            {loading ? 'Creating account…' : 'Sign Up'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
            >
              Log in
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
