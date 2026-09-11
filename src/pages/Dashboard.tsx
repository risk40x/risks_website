import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  User,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  Bug,
  Globe,
  Server,
  Code,
  Eye,
  KeyRound,
  Mail,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Camera,
  Upload,
  Link,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

type SidebarView = 'welcome' | 'profile' | 'account' | 'csrf' | 'ssrf' | 'xss' | 'idor';

const vulnItems = [
  { key: 'csrf' as const, label: 'CSRF', icon: Globe, desc: 'Cross-Site Request Forgery' },
  { key: 'ssrf' as const, label: 'SSRF', icon: Server, desc: 'Server-Side Request Forgery' },
  { key: 'xss' as const, label: 'XSS', icon: Code, desc: 'Cross-Site Scripting' },
  { key: 'idor' as const, label: 'IDOR', icon: Eye, desc: 'Insecure Direct Object Reference' },
];

type AccountAction = 'delete' | 'username' | 'password' | 'email' | null;

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [view, setView] = useState<SidebarView>('welcome');
  const [vulnOpen, setVulnOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<AccountAction>(null);

  // Profile state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileUsername, setProfileUsername] = useState<string>('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Photo upload state
  const [photoMode, setPhotoMode] = useState<'menu' | 'upload' | 'url'>('menu');
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // Feedback state
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [photoSuccess, setPhotoSuccess] = useState('');

  // Fetch profile data (avatar + username) on mount and when user changes
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, username')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setAvatarUrl(data.avatar_url);
        setProfileUsername(data.username);
      }
    })();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const resetAccountState = () => {
    setActiveAction(null);
    setNewUsername('');
    setNewEmail('');
    setNewPassword('');
    setDeleteConfirm('');
    setActionError('');
    setActionSuccess('');
  };

  const handleAccountClick = () => {
    setView('account');
    resetAccountState();
  };

  const refreshProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url, username')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setAvatarUrl(data.avatar_url);
      setProfileUsername(data.username);
    }
  };

  // ---- Photo upload handlers ----

  const handleFileUpload = async (file: File) => {
    if (!user) return;
    setPhotoError('');
    setPhotoSuccess('');

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('File must be under 5MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select an image file.');
      return;
    }

    setActionLoading(true);

    const fileExt = file.name.split('.').pop() ?? 'png';
    const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (uploadErr) {
      setPhotoError(uploadErr.message);
      setActionLoading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('user_id', user.id);

    if (updateErr) {
      setPhotoError(updateErr.message);
    } else {
      setAvatarUrl(publicUrl + '?t=' + Date.now());
      setPhotoSuccess('Profile photo updated.');
      setPhotoMode('menu');
    }
    setActionLoading(false);
  };

  const handleUrlSet = async () => {
    if (!user) return;
    setPhotoError('');
    setPhotoSuccess('');

    if (!urlInput.trim() || !/^https?:\/\/.+/.test(urlInput.trim())) {
      setPhotoError('Please enter a valid image URL.');
      return;
    }

    setActionLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: urlInput.trim() })
      .eq('user_id', user.id);

    if (error) {
      setPhotoError(error.message);
    } else {
      setAvatarUrl(urlInput.trim());
      setPhotoSuccess('Profile photo updated.');
      setUrlInput('');
      setPhotoMode('menu');
    }
    setActionLoading(false);
  };

  const handleChangeUsername = async () => {
    setActionError('');
    setActionSuccess('');
    if (newUsername.trim().length < 3) {
      setActionError('Username must be at least 3 characters.');
      return;
    }

    setActionLoading(true);

    const { data: existing } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', newUsername.trim())
      .maybeSingle();

    if (existing) {
      setActionError('That username is already taken.');
      setActionLoading(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ username: newUsername.trim() })
      .eq('user_id', user!.id);

    if (error) {
      setActionError(error.message);
    } else {
      setActionSuccess('Username updated successfully.');
      setProfileUsername(newUsername.trim());
      setNewUsername('');
      setTimeout(() => setActiveAction(null), 1500);
    }
    setActionLoading(false);
  };

  const handleChangeEmail = async () => {
    setActionError('');
    setActionSuccess('');
    if (!newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setActionError('Please enter a valid email address.');
      return;
    }

    setActionLoading(true);

    const { data: existing } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', newEmail.trim())
      .maybeSingle();

    if (existing) {
      setActionError('That email is already in use.');
      setActionLoading(false);
      return;
    }

    const { error: authErr } = await supabase.auth.updateUser({
      email: newEmail.trim(),
    });

    if (authErr) {
      setActionError(authErr.message);
      setActionLoading(false);
      return;
    }

    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ email: newEmail.trim() })
      .eq('user_id', user!.id);

    if (profileErr) {
      setActionError(profileErr.message);
    } else {
      setActionSuccess('Email updated successfully.');
      setNewEmail('');
      setTimeout(() => setActiveAction(null), 1500);
    }
    setActionLoading(false);
  };

  const handleChangePassword = async () => {
    setActionError('');
    setActionSuccess('');
    if (newPassword.length < 6) {
      setActionError('Password must be at least 6 characters.');
      return;
    }

    setActionLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setActionError(error.message);
    } else {
      setActionSuccess('Password updated successfully.');
      setNewPassword('');
      setTimeout(() => setActiveAction(null), 1500);
    }
    setActionLoading(false);
  };

  const handleDeleteAccount = async () => {
    setActionError('');
    setActionSuccess('');

    if (deleteConfirm !== 'DELETE') {
      setActionError('Please type DELETE to confirm.');
      return;
    }

    setActionLoading(true);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      setActionError('No active session. Please log in again.');
      setActionLoading(false);
      return;
    }

    const res = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setActionError(body.error ?? `Request failed (${res.status})`);
      setActionLoading(false);
      return;
    }

    setActionSuccess('Account deleted. Redirecting…');
    setActionLoading(false);
    setTimeout(async () => {
      await signOut();
      navigate('/login');
    }, 1500);
  };

  const navItem = (active: boolean, icon: React.ReactNode, label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
          : 'text-gray-400 hover:text-yellow-300 hover:bg-yellow-500/5 border border-transparent'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  const accountActions = [
    { key: 'delete' as const, label: 'Delete Account', icon: Trash2, color: 'text-red-400' },
    { key: 'username' as const, label: 'Change Username', icon: User, color: 'text-yellow-400' },
    { key: 'password' as const, label: 'Change Password', icon: KeyRound, color: 'text-yellow-400' },
    { key: 'email' as const, label: 'Change Email', icon: Mail, color: 'text-yellow-400' },
  ];

  const inputClass =
    'w-full px-4 py-2.5 rounded-lg bg-slate-950/60 border border-yellow-500/20 text-yellow-50 placeholder-gray-600 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 transition-colors';
  const btnClass =
    'px-5 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  const renderPhotoPanel = () => (
    <div className="mt-4 p-5 rounded-xl bg-slate-950/50 border border-yellow-500/15 space-y-4">
      {photoError && (
        <div className="flex items-start gap-2 text-red-400 text-sm bg-red-950/40 border border-red-500/30 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{photoError}</span>
        </div>
      )}
      {photoSuccess && (
        <div className="flex items-start gap-2 text-green-400 text-sm bg-green-950/40 border border-green-500/30 rounded-lg px-4 py-3">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{photoSuccess}</span>
        </div>
      )}

      {photoMode === 'menu' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => { setPhotoMode('upload'); setPhotoError(''); setPhotoSuccess(''); }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-yellow-500/20 hover:bg-yellow-500/10 hover:border-yellow-500/40 transition-all"
          >
            <Upload className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">Upload from Device</span>
          </button>
          <button
            onClick={() => { setPhotoMode('url'); setPhotoError(''); setPhotoSuccess(''); }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-yellow-500/20 hover:bg-yellow-500/10 hover:border-yellow-500/40 transition-all"
          >
            <Link className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">Set from URL</span>
          </button>
        </div>
      )}

      {photoMode === 'upload' && (
        <>
          <p className="text-sm text-gray-400">Choose an image file from your device (max 5MB).</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
          <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={actionLoading}
              className={`${btnClass} bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 hover:from-yellow-300 hover:to-yellow-500`}
            >
              {actionLoading ? 'Uploading…' : 'Choose File'}
            </button>
            <button
              onClick={() => { setPhotoMode('menu'); setPhotoError(''); setPhotoSuccess(''); }}
              className={`${btnClass} border border-gray-600 text-gray-300 hover:bg-gray-800`}
            >
              Back
            </button>
          </div>
        </>
      )}

      {photoMode === 'url' && (
        <>
          <div>
            <label className="block text-sm font-medium text-yellow-200/80 mb-1.5">Image URL</label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className={inputClass}
              placeholder="https://example.com/photo.jpg"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleUrlSet}
              disabled={actionLoading}
              className={`${btnClass} bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 hover:from-yellow-300 hover:to-yellow-500`}
            >
              {actionLoading ? 'Setting…' : 'Set Photo'}
            </button>
            <button
              onClick={() => { setPhotoMode('menu'); setUrlInput(''); setPhotoError(''); setPhotoSuccess(''); }}
              className={`${btnClass} border border-gray-600 text-gray-300 hover:bg-gray-800`}
            >
              Back
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderActionPanel = () => {
    if (!activeAction) return null;

    return (
      <div className="mt-4 p-5 rounded-xl bg-slate-950/50 border border-yellow-500/15 space-y-4">
        {actionError && (
          <div className="flex items-start gap-2 text-red-400 text-sm bg-red-950/40 border border-red-500/30 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
        {actionSuccess && (
          <div className="flex items-start gap-2 text-green-400 text-sm bg-green-950/40 border border-green-500/30 rounded-lg px-4 py-3">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {activeAction === 'delete' && (
          <>
            <p className="text-sm text-gray-400">
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <div>
              <label className="block text-sm font-medium text-yellow-200/80 mb-1.5">
                Type <span className="font-mono font-bold text-red-400">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className={inputClass}
                placeholder="DELETE"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={actionLoading}
                className={`${btnClass} bg-red-600 text-white hover:bg-red-500`}
              >
                {actionLoading ? 'Deleting…' : 'Delete Account'}
              </button>
              <button
                onClick={() => { setActiveAction(null); setDeleteConfirm(''); setActionError(''); setActionSuccess(''); }}
                className={`${btnClass} border border-gray-600 text-gray-300 hover:bg-gray-800`}
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {activeAction === 'username' && (
          <>
            <div>
              <label className="block text-sm font-medium text-yellow-200/80 mb-1.5">New Username</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className={inputClass}
                placeholder="Enter new username"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleChangeUsername}
                disabled={actionLoading}
                className={`${btnClass} bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 hover:from-yellow-300 hover:to-yellow-500`}
              >
                {actionLoading ? 'Updating…' : 'Update Username'}
              </button>
              <button
                onClick={() => { setActiveAction(null); setNewUsername(''); setActionError(''); setActionSuccess(''); }}
                className={`${btnClass} border border-gray-600 text-gray-300 hover:bg-gray-800`}
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {activeAction === 'password' && (
          <>
            <div>
              <label className="block text-sm font-medium text-yellow-200/80 mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                placeholder="At least 6 characters"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleChangePassword}
                disabled={actionLoading}
                className={`${btnClass} bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 hover:from-yellow-300 hover:to-yellow-500`}
              >
                {actionLoading ? 'Updating…' : 'Update Password'}
              </button>
              <button
                onClick={() => { setActiveAction(null); setNewPassword(''); setActionError(''); setActionSuccess(''); }}
                className={`${btnClass} border border-gray-600 text-gray-300 hover:bg-gray-800`}
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {activeAction === 'email' && (
          <>
            <div>
              <label className="block text-sm font-medium text-yellow-200/80 mb-1.5">New Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className={inputClass}
                placeholder="new@email.com"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleChangeEmail}
                disabled={actionLoading}
                className={`${btnClass} bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 hover:from-yellow-300 hover:to-yellow-500`}
              >
                {actionLoading ? 'Updating…' : 'Update Email'}
              </button>
              <button
                onClick={() => { setActiveAction(null); setNewEmail(''); setActionError(''); setActionSuccess(''); }}
                className={`${btnClass} border border-gray-600 text-gray-300 hover:bg-gray-800`}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const avatarDisplay = avatarUrl
    ? <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
    : <User className="w-5 h-5 text-yellow-400" />;

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-slate-950/80 border-r border-yellow-500/15 flex flex-col">
        {/* Header */}
        <div className="px-5 py-5 border-b border-yellow-500/15">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-slate-900" />
            </div>
            <span className="text-yellow-400 font-bold tracking-wide">Control Panel</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItem(view === 'welcome', <User className="w-4 h-4" />, 'Dashboard', () => setView('welcome'))}
          {navItem(view === 'profile', <User className="w-4 h-4" />, 'Profile', () => { setView('profile'); refreshProfile(); })}

          {/* Settings dropdown */}
          <div>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                view === 'account'
                  ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                  : 'text-gray-400 hover:text-yellow-300 hover:bg-yellow-500/5 border-transparent'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
              {settingsOpen ? <ChevronDown className="w-4 h-4 ml-auto" /> : <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
            {settingsOpen && (
              <div className="mt-1.5 ml-6 space-y-1">
                <button
                  onClick={handleAccountClick}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all ${
                    view === 'account'
                      ? 'text-yellow-400 bg-yellow-500/10'
                      : 'text-gray-500 hover:text-yellow-300 hover:bg-yellow-500/5'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Account</span>
                </button>
              </div>
            )}
          </div>

          {/* Vulnerabilities dropdown */}
          <div>
            <button
              onClick={() => setVulnOpen(!vulnOpen)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                ['csrf','ssrf','xss','idor'].includes(view)
                  ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                  : 'text-gray-400 hover:text-yellow-300 hover:bg-yellow-500/5 border-transparent'
              }`}
            >
              <Bug className="w-4 h-4" />
              <span>Vulnerabilities</span>
              {vulnOpen ? <ChevronDown className="w-4 h-4 ml-auto" /> : <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
            {vulnOpen && (
              <div className="mt-1.5 ml-6 space-y-1">
                {vulnItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setView(item.key)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all ${
                        view === item.key
                          ? 'text-yellow-400 bg-yellow-500/10'
                          : 'text-gray-500 hover:text-yellow-300 hover:bg-yellow-500/5'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Log Out */}
        <div className="px-3 py-4 border-t border-yellow-500/15">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Right side: header + main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header bar */}
        <header className="h-16 shrink-0 bg-slate-950/80 border-b border-yellow-500/15 flex items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <span className="text-yellow-400 font-semibold text-sm tracking-wide">RISK Security Dashboard</span>
          </div>
          <button
            onClick={() => { setView('profile'); refreshProfile(); }}
            className="flex items-center gap-3 group"
          >
            <span className="text-sm text-gray-400 group-hover:text-yellow-300 transition-colors hidden sm:inline">
              {profileUsername || user?.email || 'User'}
            </span>
            <div className="w-10 h-10 rounded-full border-2 border-yellow-500/40 overflow-hidden flex items-center justify-center bg-slate-900 group-hover:border-yellow-500 transition-colors">
              {avatarDisplay}
            </div>
          </button>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {view === 'welcome' && (
            <div className="min-h-full flex items-center justify-center px-6">
              <div className="text-center">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                  <span className="text-gray-100">Welcome to the </span>
                  <span style={{ color: '#8B0000' }}>RISKs</span>
                  <span className="text-gray-100"> website</span>
                </h1>
                <p className="mt-4 text-gray-500 text-lg">
                  Security testing dashboard — explore vulnerability categories from the sidebar.
                </p>
              </div>
            </div>
          )}

          {view === 'profile' && (
            <div className="p-8 max-w-2xl">
              <h2 className="text-2xl font-bold text-yellow-400 mb-6">Profile</h2>

              {/* Avatar display */}
              <div className="bg-slate-900/60 border border-yellow-500/15 rounded-xl p-6 mb-4">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-full border-2 border-yellow-500/40 overflow-hidden flex items-center justify-center bg-slate-950 shrink-0">
                    {avatarUrl
                      ? <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                      : <User className="w-8 h-8 text-yellow-400" />
                    }
                  </div>
                  <div>
                    <p className="text-yellow-100 font-medium text-lg">{profileUsername || '—'}</p>
                    <p className="text-sm text-gray-500">{user?.email ?? '—'}</p>
                  </div>
                </div>
              </div>

              {/* Profile details */}
              <div className="bg-slate-900/60 border border-yellow-500/15 rounded-xl p-6 space-y-4">
                <div>
                  <span className="text-sm text-gray-500">Username</span>
                  <p className="text-yellow-100">{profileUsername || '—'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Email</span>
                  <p className="text-yellow-100">{user?.email ?? '—'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">User ID</span>
                  <p className="text-yellow-100 font-mono text-sm break-all">{user?.id ?? '—'}</p>
                </div>
              </div>

              {/* Change Profile Photo section */}
              <div className="mt-4 bg-slate-900/60 border border-yellow-500/15 rounded-xl overflow-hidden">
                <button
                  onClick={() => { setPhotoMode(photoMode === 'menu' ? 'menu' : 'menu'); setPhotoError(''); setPhotoSuccess(''); }}
                  className="w-full flex items-center gap-3 px-5 py-4 text-sm font-medium text-gray-300 hover:text-yellow-300 hover:bg-yellow-500/5 transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span className="font-semibold">Change Profile Photo</span>
                  <ChevronDown className="w-4 h-4 ml-auto" />
                </button>
                <div className="px-5 pb-5 border-t border-yellow-500/10">
                  {renderPhotoPanel()}
                </div>
              </div>
            </div>
          )}

          {view === 'account' && (
            <div className="p-8 max-w-2xl">
              <h2 className="text-2xl font-bold text-yellow-400 mb-6">Account</h2>

              {activeAction === null ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {accountActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.key}
                        onClick={() => { setActiveAction(action.key); setActionError(''); setActionSuccess(''); }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${action.color === 'text-red-400'
                          ? 'border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40'
                          : 'border-yellow-500/20 hover:bg-yellow-500/10 hover:border-yellow-500/40'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${action.color}`} />
                        <span className={`text-sm font-medium ${action.color}`}>{action.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                renderActionPanel()
              )}
            </div>
          )}

          {['csrf','ssrf','xss','idor'].includes(view) && (
            <div className="p-8 max-w-3xl">
              {(() => {
                const item = vulnItems.find((v) => v.key === view)!;
                const Icon = item.icon;
                return (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-yellow-400">{item.label}</h2>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                    <div className="bg-slate-900/60 border border-yellow-500/15 rounded-xl p-6">
                      <p className="text-gray-400 leading-relaxed">
                        This module covers {item.desc} testing scenarios. Content will be added here
                        as the security testing toolkit expands.
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
