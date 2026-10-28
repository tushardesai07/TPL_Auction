import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, User, Trophy, MapPin, CheckCircle2 } from 'lucide-react';
import { Team, SquadPlayer } from '../../types';

interface TeamRosterModalProps {
  team: Team | null;
  teams?: Team[];
  squadPlayers: SquadPlayer[];
  currency?: string;
  onClose: () => void;
  onSelectTeam?: (team: Team) => void;
}

export const TeamRosterModal: React.FC<TeamRosterModalProps> = ({
  team,
  teams = [],
  squadPlayers,
  currency = '₹',
  onClose,
  onSelectTeam,
}) => {
  // If no team is passed or modal closed, immediately unmount
  if (!team) return null;

  // Currently viewed team in the modal
  const [activeTeam, setActiveTeam] = useState<Team>(team);

  // Keep active team synced if incoming team changes
  useEffect(() => {
    if (team) {
      setActiveTeam(team);
    }
  }, [team]);

  // Support closing with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const roster = squadPlayers.filter(sp => sp.team_id === activeTeam.id);

  return (
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-main/80 backdrop-blur-md cursor-pointer"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="cursor-default relative max-w-2xl w-full bg-bg-card border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[88vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-bg-subtle border border-gold/30 flex items-center justify-center shrink-0">
                {activeTeam.logo_url ? (
                  <img src={activeTeam.logo_url} alt={activeTeam.name} className="w-full h-full object-cover" />
                ) : (
                  <Shield className="w-6 h-6 text-gold" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  <span>{activeTeam.name}</span>
                  <span className="px-2 py-0.5 rounded-lg bg-gold/15 text-gold font-mono text-xs border border-gold/30 font-bold">
                    {activeTeam.short_name}
                  </span>
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Owner: <strong className="text-text-primary">{activeTeam.owner_name || 'Unassigned'}</strong> • Spent: <strong className="text-gold font-display">{currency}{activeTeam.spent_amount.toLocaleString()}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-text-muted hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Franchise Selector Tabs (Allows picking any franchise to inspect its squad) */}
          {teams.length > 0 && (
            <div className="py-2.5 flex items-center gap-2 overflow-x-auto border-b border-white/10 scrollbar-thin">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider shrink-0 mr-1">
                Franchises:
              </span>
              {teams.map(t => {
                const isSelected = t.id === activeTeam.id;
                const tRoster = squadPlayers.filter(sp => sp.team_id === t.id);

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setActiveTeam(t);
                      onSelectTeam?.(t);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-gold text-bg-main shadow-gold-glow font-bold ring-2 ring-gold/50'
                        : 'bg-bg-subtle text-text-secondary hover:text-white hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    <span>{t.short_name}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isSelected ? 'bg-bg-main/30 text-bg-main' : 'bg-white/10 text-gold'
                    }`}>
                      {tRoster.length}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Metrics Strip */}
          <div className="py-2.5 px-3 bg-bg-subtle/50 rounded-xl my-2 border border-white/5 flex items-center justify-between text-xs">
            <div>
              Purse Left: <strong className="text-gold font-display">{currency}{activeTeam.remaining_purse.toLocaleString()}</strong>
            </div>
            <div>
              Acquired: <strong className="text-status-success font-display">{roster.length}</strong> / {activeTeam.max_squad_size} Players
            </div>
            <div>
              Remaining Slots: <strong className="text-text-primary">{activeTeam.max_squad_size - roster.length}</strong>
            </div>
          </div>

          {/* Player Roster Grid */}
          <div className="flex-1 overflow-y-auto py-2 space-y-2 pr-1 scrollbar-thin">
            {roster.length === 0 ? (
              <div className="text-center py-12 text-sm text-text-muted space-y-1">
                <div className="font-semibold text-text-secondary">No players acquired yet by {activeTeam.name}</div>
                <div className="text-xs">Select another franchise tab above or stand by for upcoming live auction rounds.</div>
              </div>
            ) : (
              roster.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-bg-subtle/80 border border-white/5 hover:border-gold/30 flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-text-muted w-5">
                      #{index + 1}
                    </span>
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-bg-card border border-white/10 shrink-0">
                      <img
                        src={item.player?.photo_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80'}
                        alt={item.player?.name}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-text-primary flex items-center gap-2">
                        {item.player?.name}
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          item.player?.role === 'Icon Player' ? 'bg-amber-400/20 text-amber-300' :
                          item.player?.role === 'Batsman' ? 'bg-blue-500/20 text-blue-400' :
                          item.player?.role === 'Bowler' ? 'bg-emerald-500/20 text-emerald-400' :
                          item.player?.role === 'All Rounder' ? 'bg-gold/20 text-gold' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          {item.player?.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-text-muted flex items-center gap-2 mt-0.5">
                        <span>Village: <strong className="text-text-secondary">{item.player?.village || 'Local'}</strong></span>
                        <span>•</span>
                        <span>Bat: <strong className="text-text-secondary">{item.player?.batting_style || 'RHB'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-text-muted uppercase font-medium">Bought For</div>
                    <div className="font-display font-bold text-sm text-status-success">
                      {currency}{item.purchase_price.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer summary */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-text-secondary">
            <div>
              Franchise: <strong className="text-white">{activeTeam.name}</strong>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-gold/15 hover:bg-gold text-gold hover:text-bg-main border border-gold/30 text-xs font-bold transition-all"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
