import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useBoardStore } from '../../store/boardStore';
import {
  Kanban,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  Lock,
  Mail,
  User as UserIcon,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { login, register, demoLogin } = useAuthStore();
  const { addToast } = useBoardStore();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemoClick = async () => {
    setLoading(true);
    setError(null);
    try {
      await demoLogin();
      addToast({
        type: 'success',
        title: 'Welcome to CollabFlow Demo!',
        description: 'You are exploring the live board as Alex Rivera (Staff Lead). Feel free to drag tasks, edit issues, or invite team members.',
      });
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await register(email, password, name);
        addToast({
          type: 'success',
          title: 'Account created',
          description: 'Welcome to CollabFlow!',
        });
      } else {
        await login(email, password);
        addToast({
          type: 'success',
          title: 'Signed in successfully',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-xl shadow-emerald-500/20 mb-2">
            <Kanban className="w-6 h-6 text-zinc-950 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100">
            CollabFlow
          </h1>
          <p className="text-xs text-zinc-400">
            Enterprise real-time project management & Kanban sync
          </p>
        </div>

        {/* 1-CLICK DEMO ACCESS BUTTON (RECRUITER SHOWCASE) */}
        <div className="p-1 rounded-2xl bg-gradient-to-r from-emerald-500/40 via-emerald-400/20 to-teal-500/40 border border-emerald-500/40 shadow-xl shadow-emerald-950/50">
          <button
            onClick={handleDemoClick}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-100 font-bold text-sm transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
          >
            <span className="text-base">🚀</span>
            <span className="bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent font-extrabold">
              Explore Live Demo as Guest
            </span>
            <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px bg-zinc-800 flex-1" />
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            or sign in with credentials
          </span>
          <div className="h-px bg-zinc-800 flex-1" />
        </div>

        {/* Main Card */}
        <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-2xl backdrop-blur-md space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Rivera"
                    className="w-full pl-9 pr-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="demo@collabflow.dev"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Toggle Sign In / Sign Up */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-zinc-400 hover:text-zinc-200 underline"
            >
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Create one"}
            </button>
          </div>
        </div>

        {/* Feature Pill Highlights */}
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-zinc-400 font-medium">
          <div className="p-2 rounded-xl bg-zinc-900/50 border border-zinc-800/60 flex flex-col items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>0ms Optimistic UI</span>
          </div>
          <div className="p-2 rounded-xl bg-zinc-900/50 border border-zinc-800/60 flex flex-col items-center gap-1">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live WebSockets</span>
          </div>
          <div className="p-2 rounded-xl bg-zinc-900/50 border border-zinc-800/60 flex flex-col items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Prisma & Node.js</span>
          </div>
        </div>
      </div>
    </div>
  );
};
