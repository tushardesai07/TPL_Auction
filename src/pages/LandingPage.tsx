import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Radio, Users, Shield, ArrowRight, Zap, Target, Award } from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { tournament, session, teams, players } = useAuction();
  const { switchDemoRole } = useAuth();

  const isLive = session.status === 'active';

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden">
      {/* Cinematic stadium background aura */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center relative z-10">
        {/* Live Status Pill */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-bg-card/90 border border-white/10 mb-8 backdrop-blur-md shadow-lg"
        >
          {isLive ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-status-danger animate-pulse" />
              <span className="text-xs font-bold tracking-widest uppercase text-status-danger">
                LIVE AUCTION IN PROGRESS
              </span>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-gold" />
              <span className="text-xs font-semibold tracking-wider uppercase text-gold">
                AUCTION ARENA READY
              </span>
            </>
          )}
          <span className="text-text-muted text-xs">•</span>
          <span className="text-xs text-text-secondary font-mono">{tournament.name}</span>
        </motion.div>

        {/* Hero Title */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-4"
        >
          <h2 className="text-xs sm:text-sm font-display font-bold tracking-[0.35em] uppercase text-gold">
            VILLAGE CRICKET CHAMPIONSHIP 2026
          </h2>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-display font-extrabold tracking-tight text-white uppercase leading-none">
            {tournament.name}
          </h1>
          <p className="text-xl sm:text-2xl font-light tracking-widest text-text-secondary font-display italic">
            Bid. Build. Battle.
          </p>
        </motion.div>

        <p className="max-w-2xl mx-auto text-text-secondary text-sm sm:text-base mt-6 font-normal">
          The premier IPL-style player auction engineered for rural cricket championships.
          Authoritative real-time bidding, server-locked transactions, mobile manager terminals, and broadcast-grade projector displays.
        </p>

        {/* Quick Setup Guide if Empty */}
        {(teams.length === 0 || players.length === 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="my-8 max-w-3xl mx-auto p-6 rounded-2xl bg-bg-card border-2 border-gold/40 shadow-gold-glow text-left"
          >
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold mb-2">
              <Zap className="w-4 h-4" />
              WHERE TO ADD YOUR TOURNAMENT DATA
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-2">
              Clean Slate Ready: Add Your Real Teams & Players
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed mb-5">
              All dummy data has been removed. You can now populate your actual village franchises and cricketers using the dedicated management sections below:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to="/admin/teams"
                className="p-4 rounded-xl bg-bg-subtle hover:bg-gold/15 border border-white/10 hover:border-gold/40 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-sm text-white group-hover:text-gold transition-colors">
                      Step 1: Add Teams
                    </div>
                    <div className="text-[11px] text-text-muted">
                      {teams.length} teams created so far
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-lg bg-gold text-bg-main text-xs font-bold">
                  + Add Teams →
                </span>
              </Link>

              <Link
                to="/admin/players"
                className="p-4 rounded-xl bg-bg-subtle hover:bg-gold/15 border border-white/10 hover:border-gold/40 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center font-bold">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-sm text-white group-hover:text-gold transition-colors">
                      Step 2: Add Players
                    </div>
                    <div className="text-[11px] text-text-muted">
                      {players.length} players created so far
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-lg bg-gold text-bg-main text-xs font-bold">
                  + Add Players →
                </span>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Primary Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 mt-8"
        >
          <Link
            to="/admin/teams"
            className="px-6 py-3.5 rounded-xl bg-gold hover:bg-gold-light text-bg-main font-display font-bold text-xs tracking-wider flex items-center gap-2 shadow-gold-glow hover:scale-105 active:scale-95 transition-all"
          >
            <Users className="w-4 h-4 stroke-[2.5]" />
            MANAGE TEAMS
          </Link>

          <Link
            to="/admin/players"
            className="px-6 py-3.5 rounded-xl bg-gold hover:bg-gold-light text-bg-main font-display font-bold text-xs tracking-wider flex items-center gap-2 shadow-gold-glow hover:scale-105 active:scale-95 transition-all"
          >
            <Award className="w-4 h-4 stroke-[2.5]" />
            MANAGE PLAYERS
          </Link>

          <Link
            to="/admin/auction"
            className="px-6 py-3.5 rounded-xl bg-bg-card hover:bg-bg-subtle text-white border border-white/15 hover:border-gold/40 font-display font-bold text-xs tracking-wider flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
          >
            <Shield className="w-4 h-4 text-gold stroke-[2.5]" />
            AUCTIONEER CONSOLE
          </Link>

          <Link
            to="/live"
            className="px-6 py-3.5 rounded-xl bg-bg-card hover:bg-bg-subtle text-white border border-white/15 hover:border-gold/40 font-display font-bold text-xs tracking-wider flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
          >
            <Radio className="w-4 h-4 text-status-danger" />
            LIVE BROADCAST
          </Link>
        </motion.div>

        {/* Live Tournament Stats Counter */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          <div className="bg-bg-card/70 border border-white/10 rounded-2xl p-5 text-center backdrop-blur-sm">
            <div className="text-3xl sm:text-4xl font-display font-extrabold text-gold">
              {teams.length}
            </div>
            <div className="text-xs uppercase font-semibold text-text-muted mt-1 tracking-wider">
              Franchise Teams
            </div>
          </div>

          <div className="bg-bg-card/70 border border-white/10 rounded-2xl p-5 text-center backdrop-blur-sm">
            <div className="text-3xl sm:text-4xl font-display font-extrabold text-white">
              {players.length}
            </div>
            <div className="text-xs uppercase font-semibold text-text-muted mt-1 tracking-wider">
              Registered Players
            </div>
          </div>

          <div className="bg-bg-card/70 border border-white/10 rounded-2xl p-5 text-center backdrop-blur-sm">
            <div className="text-3xl sm:text-4xl font-display font-extrabold text-status-success">
              {tournament.currency}{tournament.total_purse.toLocaleString()}
            </div>
            <div className="text-xs uppercase font-semibold text-text-muted mt-1 tracking-wider">
              Purse Per Team
            </div>
          </div>

          <div className="bg-bg-card/70 border border-white/10 rounded-2xl p-5 text-center backdrop-blur-sm">
            <div className="text-3xl sm:text-4xl font-display font-extrabold text-blue-400">
              {tournament.bid_timer_seconds}s
            </div>
            <div className="text-xs uppercase font-semibold text-text-muted mt-1 tracking-wider">
              Countdown Timer
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Features Ticker */}
      <div className="w-full border-t border-white/10 bg-bg-card/40 py-4 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-center gap-8 text-xs text-text-secondary font-medium uppercase tracking-wider">
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-gold" /> Server-side Bid Validation
          </span>
          <span className="flex items-center gap-2">
            <Target className="w-4 h-4 text-status-success" /> Atomic Concurrency Lock
          </span>
          <span className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-status-danger" /> Instant Realtime Push
          </span>
          <span className="flex items-center gap-2">
            <Award className="w-4 h-4 text-gold" /> Cinema Sold Fanfare
          </span>
        </div>
      </div>
    </div>
  );
};
