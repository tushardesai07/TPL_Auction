import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Gavel, ArrowUpRight, ShieldAlert, CheckCircle, 
  Sparkles, TrendingUp, AlertTriangle, ChevronRight, Zap
} from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { Team } from '../../types';

export const MultiTeamBidPaddle: React.FC = () => {
  const { 
    teams, 
    session, 
    currentPlayer, 
    highestBidTeam, 
    calculateNextBid, 
    placeBid, 
    tournament,
    squadPlayers,
    recentBids
  } = useAuction();

  const [biddingTeamId, setBiddingTeamId] = useState<string | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<{ teamId: string; message: string } | null>(null);

  if (!currentPlayer || session.status !== 'active' || currentPlayer.status === 'sold') {
    return null;
  }

  const nextMinBid = calculateNextBid(session.current_bid, currentPlayer.base_price);

  const handleTeamBid = async (team: Team, amount: number) => {
    try {
      setBiddingTeamId(team.id);
      setErrorFeedback(null);
      const res = await placeBid(team.id, amount);
      if (!res.success) {
        setErrorFeedback({ teamId: team.id, message: res.error || 'Bid rejected' });
        setTimeout(() => setErrorFeedback(null), 3500);
      }
    } catch (err: any) {
      setErrorFeedback({ teamId: team.id, message: err.message || 'Bid failed' });
      setTimeout(() => setErrorFeedback(null), 3500);
    } finally {
      setBiddingTeamId(null);
    }
  };

  // Find who was previously outbid
  const previousBid = recentBids.find(b => b.player_id === currentPlayer.id && b.team_id !== session.highest_bid_team_id);

  return (
    <div className="bg-bg-card border-2 border-gold/30 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold shadow-sm">
            <Gavel className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase text-gold flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-gold animate-pulse" />
              LIVE MULTI-TEAM BIDDING WAR
            </div>
            <h3 className="font-display font-bold text-sm text-white">
              Team Bidding Console ({teams.length} Franchises)
            </h3>
          </div>
        </div>

        {/* Current Bid Summary */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-subtle border border-white/10 text-xs">
          <span className="text-text-muted">Next Minimum:</span>
          <span className="font-display font-extrabold text-gold text-sm">
            {tournament.currency}{nextMinBid.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Outbid Alert Banner */}
      {previousBid && highestBidTeam && previousBid.team && (
        <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="text-base">⚔️</span>
            <span>
              <strong>{highestBidTeam.name}</strong> ({highestBidTeam.short_name}) outbid{' '}
              <strong className="text-text-primary">{previousBid.team.name}</strong> at{' '}
              <strong className="font-mono text-white">{tournament.currency}{session.current_bid.toLocaleString()}</strong>!
            </span>
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/80">Active Duel</span>
        </div>
      )}

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
        {teams.map(team => {
          const isHighest = session.highest_bid_team_id === team.id;
          const teamSquad = squadPlayers.filter(sp => sp.team_id === team.id);
          const currentCount = teamSquad.length;
          const isSquadFull = currentCount >= team.max_squad_size;

          const remainingSlotsNeeded = team.max_squad_size - currentCount - 1;
          const requiredReserve = remainingSlotsNeeded * tournament.min_bid;
          const canAfford = (team.remaining_purse - nextMinBid) >= requiredReserve;

          const isEligible = !isHighest && !isSquadFull && canAfford;
          const isCurrentSubmitting = biddingTeamId === team.id;
          const error = errorFeedback?.teamId === team.id ? errorFeedback.message : null;

          return (
            <div
              key={team.id}
              className={`p-3.5 rounded-xl border transition-all ${
                isHighest
                  ? 'bg-gold/15 border-gold shadow-gold-glow ring-1 ring-gold/50'
                  : 'bg-bg-subtle/80 border-white/10 hover:border-white/20'
              }`}
            >
              {/* Top Team Info */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-bg-card border border-white/15 flex items-center justify-center shrink-0">
                    {team.logo_url ? (
                      <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-display font-bold text-xs text-gold">{team.short_name}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs text-white truncate max-w-[140px]">
                      {team.name}
                    </h4>
                    <div className="text-[11px] text-text-muted flex items-center gap-2 font-mono">
                      <span>Purse: <strong className="text-gold">{tournament.currency}{team.remaining_purse.toLocaleString()}</strong></span>
                      <span>•</span>
                      <span>Squad: {currentCount}/{team.max_squad_size}</span>
                    </div>
                  </div>
                </div>

                {isHighest ? (
                  <span className="px-2 py-1 rounded-lg bg-gold/20 border border-gold/40 text-gold font-bold text-[10px] tracking-wide flex items-center gap-1 shadow-sm">
                    👑 HIGHEST BIDDER
                  </span>
                ) : !canAfford ? (
                  <span className="px-2 py-0.5 rounded bg-status-danger/15 border border-status-danger/30 text-status-danger text-[10px] font-semibold">
                    Low Purse
                  </span>
                ) : isSquadFull ? (
                  <span className="px-2 py-0.5 rounded bg-white/10 text-text-muted text-[10px]">
                    Squad Full
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-400 font-medium">
                    Ready
                  </span>
                )}
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-2 p-1.5 rounded-lg bg-status-danger/20 border border-status-danger/40 text-status-danger text-[11px]">
                  {error}
                </div>
              )}

              {/* Bid Action Buttons */}
              {isHighest ? (
                <div className="w-full py-2 rounded-lg bg-gold/10 border border-gold/30 text-center text-xs font-display font-bold text-gold">
                  Leading at {tournament.currency}{session.current_bid.toLocaleString()}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {/* Primary Next Bid Button */}
                  <button
                    onClick={() => handleTeamBid(team, nextMinBid)}
                    disabled={!isEligible || isCurrentSubmitting}
                    className="w-full py-2 px-3 rounded-lg bg-gold hover:bg-gold-light text-bg-main font-display font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Gavel className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>
                      {isCurrentSubmitting 
                        ? 'PLACING BID...' 
                        : `BID ${tournament.currency}${nextMinBid.toLocaleString()}`}
                    </span>
                  </button>

                  {/* Quick Increment Chips */}
                  {isEligible && (
                    <div className="grid grid-cols-3 gap-1.5">
                      {[nextMinBid + 200, nextMinBid + 500, nextMinBid + 1000].map(amt => (
                        <button
                          key={amt}
                          onClick={() => handleTeamBid(team, amt)}
                          disabled={isCurrentSubmitting || (team.remaining_purse - amt < requiredReserve)}
                          className="py-1 px-1.5 rounded-md bg-bg-card hover:bg-gold/20 border border-white/10 hover:border-gold/40 text-[10px] font-mono text-text-secondary hover:text-gold transition-colors text-center disabled:opacity-30 disabled:pointer-events-none"
                          title={`Directly raise to ${tournament.currency}${amt.toLocaleString()}`}
                        >
                          +{tournament.currency}{(amt - session.current_bid).toLocaleString()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
