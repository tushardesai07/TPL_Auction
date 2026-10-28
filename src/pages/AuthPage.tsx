import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Radio, Lock, Mail, User, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAuction } from '../context/AuctionContext';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signUp, switchDemoRole } = useAuth();
  const { teams } = useAuction();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        navigate('/admin');
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate('/admin');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoPersona = (role: 'admin' | 'manager' | 'viewer', teamId?: string) => {
    switchDemoRole(role, teamId);
    if (role === 'admin') navigate('/admin/auction');
    else if (role === 'manager') navigate('/manager');
    else navigate('/live');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left Side: 1-Click Fast Demo Personas */}
        <div className="md:col-span-5 bg-bg-card border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gold mb-1">
              FAST ACCESS
            </div>
            <h2 className="text-xl font-display font-bold text-white">
              Instant Demo Personas
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Test all 3 roles immediately without waiting for Supabase credentials:
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {/* Persona 1: Admin */}
            <button
              onClick={() => handleDemoPersona('admin')}
              className="w-full p-3.5 rounded-xl bg-bg-subtle hover:bg-gold/15 border border-white/5 hover:border-gold/40 text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold/15 text-gold flex items-center justify-center font-bold">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-text-primary group-hover:text-gold transition-colors">
                    Auctioneer / Chief Admin
                  </div>
                  <div className="text-[11px] text-text-muted">
                    Full auction controls, hammer, players & team setup
                  </div>
                </div>
              </div>
            </button>

            {/* Persona 2: Manager */}
            <button
              onClick={() => handleDemoPersona('manager', teams[0]?.id)}
              className="w-full p-3.5 rounded-xl bg-bg-subtle hover:bg-status-success/15 border border-white/5 hover:border-status-success/40 text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-status-success/15 text-status-success flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-text-primary group-hover:text-status-success transition-colors">
                    {teams[0]?.name ? `${teams[0].name} Manager` : 'Franchise Team Manager'}
                  </div>
                  <div className="text-[11px] text-text-muted">
                    Mobile bidding terminal, purse monitor, squad builder
                  </div>
                </div>
              </div>
            </button>

            {/* Persona 3: Public Viewer */}
            <button
              onClick={() => handleDemoPersona('viewer')}
              className="w-full p-3.5 rounded-xl bg-bg-subtle hover:bg-blue-500/15 border border-white/5 hover:border-blue-500/40 text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-text-primary group-hover:text-blue-400 transition-colors">
                    Public Spectator
                  </div>
                  <div className="text-[11px] text-text-muted">
                    Projector broadcast screen with live ticker
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Right Side: Supabase Auth Form */}
        <div className="md:col-span-7 bg-bg-card border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-2xl font-display font-bold text-white">
              {isSignUp ? 'Create Tournament Account' : 'Sign In to Tournament'}
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Authenticate via Supabase Auth with Row Level Security
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-status-danger/10 border border-status-danger/30 text-status-danger text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-text-muted absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Balasaheb Patil"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-bg-subtle border border-white/10 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-gold"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-text-muted absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@vpl2026.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-bg-subtle border border-white/10 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-muted absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-bg-subtle border border-white/10 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gold hover:bg-gold-light text-bg-main font-display font-bold text-sm tracking-wide shadow-gold-glow transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'Processing...' : isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-text-muted">
            {isSignUp ? 'Already have an account? ' : "Don't have an account yet? "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-gold font-semibold hover:underline ml-1"
            >
              {isSignUp ? 'Sign In' : 'Create One'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
