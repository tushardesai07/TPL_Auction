import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Trophy, Shield, Radio, Users, User, Settings, Award, 
  ChevronDown, UserCheck, Wifi, WifiOff, PlusCircle 
} from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { useAuth } from '../../context/AuthContext';

export const AuctionHeader: React.FC = () => {
  const location = useLocation();
  const { tournament, connectionStatus, session, teams } = useAuction();
  const { role, profile, switchDemoRole, signOut } = useAuth();
  const [isPersonaOpen, setIsPersonaOpen] = useState(false);
  const isAdmin = role === 'admin' || role === 'auctioneer';

  const navLinks = [
    { to: '/admin/teams', label: 'Teams', icon: Users },
    { to: '/admin/players', label: 'Players', icon: User },
    { to: '/admin/auction', label: 'Auctioneer Desk', icon: Shield, adminOnly: true },
    { to: '/manager', label: 'Manager Terminal', icon: Users },
    { to: '/live', label: 'Broadcast Live', icon: Radio },
    { to: '/results', label: 'Results', icon: Award },
    { to: '/admin/settings', label: 'Settings', icon: Settings, adminOnly: true },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-bg-main/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Tournament Info */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold group-hover:scale-105 transition-transform shadow-gold-glow">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display font-bold text-sm tracking-wide text-text-primary group-hover:text-gold transition-colors flex items-center gap-2">
                {tournament.name}
                <span className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-gold/20 text-gold rounded border border-gold/30">
                  VPL 2026
                </span>
              </div>
              <div className="text-[10px] text-text-muted font-medium tracking-wider uppercase">
                {tournament.description?.slice(0, 32) || 'Bid. Build. Battle.'}
              </div>
            </div>
          </Link>

          {/* Broadcast Status Indicator */}
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-white/10">
            {session.status === 'active' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-danger/10 border border-status-danger/30 text-status-danger text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-status-danger animate-pulse" />
                LIVE AUCTION
              </span>
            ) : session.status === 'paused' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-warning/15 border border-status-warning/40 text-status-warning text-xs font-semibold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-status-warning" />
                PAUSED
              </span>
            ) : session.status === 'sold' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-success/15 border border-status-success/40 text-status-success text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-status-success" />
                ROUND SOLD
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-text-muted text-xs font-semibold uppercase">
                <span className="w-2 h-2 rounded-full bg-zinc-500" />
                {session.status}
              </span>
            )}

            {/* Connection badge */}
            {connectionStatus === 'connected' ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-status-success font-medium">
                <Wifi className="w-3.5 h-3.5" /> Supabase Live
              </span>
            ) : connectionStatus === 'reconnecting' ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-status-warning font-medium animate-pulse">
                <Wifi className="w-3.5 h-3.5" /> Reconnecting...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-gold font-medium" title="Offline / Local Interactive Engine">
                <WifiOff className="w-3.5 h-3.5" /> Interactive Demo
              </span>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-bg-card/90 p-1 rounded-xl border border-white/5">
          {navLinks.filter(item => !item.adminOnly || isAdmin).map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to) && item.to !== '/admin');
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gold/15 text-gold border border-gold/30 shadow-sm font-semibold'
                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Persona Switcher / Role Badge */}
        <div className="relative flex items-center gap-2">
          <button
            onClick={() => setIsPersonaOpen(!isPersonaOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 bg-bg-card hover:bg-bg-subtle border border-white/10 hover:border-gold/30 rounded-xl transition-all text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center text-gold font-bold text-xs uppercase">
              {role[0]}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-text-primary capitalize flex items-center gap-1.5">
                {role}
                <ChevronDown className="w-3 h-3 text-text-muted" />
              </div>
              <div className="text-[10px] text-text-muted truncate max-w-[120px]">
                {profile?.full_name || 'Spectator'}
              </div>
            </div>
          </button>

          {/* Persona Switcher Dropdown */}
          {isPersonaOpen && (
            <div className="absolute right-0 top-12 mt-2 w-64 bg-bg-card border border-white/10 rounded-2xl shadow-2xl p-2 z-50">
              <div className="px-3 py-2 border-b border-white/10 mb-1">
                <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  Test Personas (1-Click)
                </div>
                <div className="text-xs text-text-secondary mt-0.5">
                  Instant switch between roles
                </div>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    switchDemoRole('admin');
                    setIsPersonaOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${
                    role === 'admin' ? 'bg-gold/20 text-gold font-semibold' : 'text-text-primary hover:bg-white/5'
                  }`}
                >
                  <Shield className="w-4 h-4 text-gold" />
                  <div className="text-left">
                    <div>Auctioneer / Admin</div>
                    <div className="text-[10px] text-text-muted">Full auction & tournament control</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    switchDemoRole('manager', teams[0]?.id);
                    setIsPersonaOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${
                    role === 'manager' ? 'bg-gold/20 text-gold font-semibold' : 'text-text-primary hover:bg-white/5'
                  }`}
                >
                  <Users className="w-4 h-4 text-status-success" />
                  <div className="text-left">
                    <div>{teams[0]?.name ? `${teams[0].name} Manager` : 'Franchise Team Manager'}</div>
                    <div className="text-[10px] text-text-muted">Live bidding mobile terminal</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    switchDemoRole('viewer');
                    setIsPersonaOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${
                    role === 'viewer' ? 'bg-gold/20 text-gold font-semibold' : 'text-text-primary hover:bg-white/5'
                  }`}
                >
                  <Radio className="w-4 h-4 text-blue-400" />
                  <div className="text-left">
                    <div>Public Spectator</div>
                    <div className="text-[10px] text-text-muted">Watch broadcast stream</div>
                  </div>
                </button>
              </div>

              <div className="pt-2 mt-2 border-t border-white/10 flex justify-between px-2">
                <Link
                  to="/auth"
                  onClick={() => setIsPersonaOpen(false)}
                  className="text-[11px] text-gold hover:underline"
                >
                  Login with Account →
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setIsPersonaOpen(false);
                  }}
                  className="text-[11px] text-text-muted hover:text-status-danger"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
