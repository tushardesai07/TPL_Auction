import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, User, Zap } from 'lucide-react';
import { Player, Team, AuctionSession } from '../../types';
import { CountdownTimer } from '../common/CountdownTimer';
import { StatusBadge } from '../common/StatusBadge';

interface PlayerSpotlightProps {
  player: Player | null;
  session: AuctionSession;
  highestBidTeam: Team | null;
  remainingTime: number;
  currency?: string;
  isProjector?: boolean;
}

export const PlayerSpotlight: React.FC<PlayerSpotlightProps> = ({
  player,
  session,
  highestBidTeam,
  remainingTime,
  currency = '₹',
  isProjector = false,
}) => {
  if (!player) {
    return (
      <div className="w-full bg-bg-card border border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[420px]">
        <div className="w-20 h-20 rounded-full bg-bg-subtle border border-white/5 flex items-center justify-center text-text-muted mb-4">
          <User className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-display font-semibold text-text-secondary">
          No Player Currently on the Block
        </h3>
        <p className="text-sm text-text-muted max-w-sm mt-1">
          The auctioneer will bring the next player to the block shortly.
        </p>
      </div>
    );
  }

  const hasBids = session.current_bid > 0;
  const displayBid = hasBids ? session.current_bid : player.base_price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`w-full bg-bg-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative ${
        isProjector ? 'p-8 lg:p-10' : 'p-6 lg:p-8'
      }`}
    >
      {/* Background radial gold aura */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar: Order & Status */}
      <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 font-mono text-xs font-bold text-gold">
            LOT #{player.order_index}
          </span>
          <StatusBadge status={session.status === 'active' ? 'active' : session.status} />
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <MapPin className="w-3.5 h-3.5 text-gold" />
          <span>Village: <strong className="text-text-primary">{player.village || 'Local'}</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left Column: Player Photo & Attributes */}
        <div className="md:col-span-5 flex flex-col items-center sm:items-start text-center sm:text-left">
          <div className="relative group">
            <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border-2 border-white/15 bg-bg-subtle shadow-lg relative">
              <img
                src={player.photo_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'}
                alt={player.name}
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-transparent to-transparent opacity-60" />
            </div>

            {/* Role Tag overlay */}
            <div className="absolute bottom-3 left-3 right-3 bg-bg-main/90 backdrop-blur-md border border-white/10 rounded-xl px-3 py-1.5 flex items-center justify-between">
              <span className={`text-xs font-bold tracking-wide uppercase flex items-center gap-1 ${
                player.role === 'Icon Player' ? 'text-amber-300 font-extrabold' : 'text-gold'
              }`}>
                {player.role === 'Icon Player' && '👑 '}
                {player.role}
              </span>
              {player.age && (
                <span className="text-[11px] font-mono text-text-muted">
                  Age: {player.age}
                </span>
              )}
            </div>
          </div>

          {/* Styles / Skills */}
          <div className="mt-4 w-full grid grid-cols-2 gap-2 text-left">
            <div className="bg-bg-subtle/80 rounded-xl p-2.5 border border-white/5">
              <div className="text-[10px] text-text-muted uppercase font-medium">Batting</div>
              <div className="text-xs font-semibold text-text-primary truncate">
                {player.batting_style || 'Right Hand'}
              </div>
            </div>
            <div className="bg-bg-subtle/80 rounded-xl p-2.5 border border-white/5">
              <div className="text-[10px] text-text-muted uppercase font-medium">Bowling</div>
              <div className="text-xs font-semibold text-text-primary truncate">
                {player.bowling_style || 'Right Arm Med'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Player Name, Huge Bid & Countdown Ring */}
        <div className="md:col-span-7 flex flex-col justify-between h-full">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-gold mb-1 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              PLAYER ON THE BLOCK
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white tracking-tight leading-tight">
              {player.name}
            </h1>

            <div className="flex items-center gap-4 mt-3 text-sm text-text-secondary">
              <span>Base Price: <strong className="text-text-primary font-display">{currency}{player.base_price.toLocaleString()}</strong></span>
              <span>•</span>
              <span className="text-gold font-medium">{player.role} Specialist</span>
            </div>
          </div>

          {/* Live Price & Countdown Stage */}
          <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            {/* Price Column */}
            <div className="sm:col-span-7">
              <div className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                {hasBids ? 'CURRENT HIGHEST BID' : 'STARTING BASE PRICE'}
              </div>
              <motion.div
                key={displayBid}
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-white tracking-tight mt-1"
              >
                <span className="text-gold font-light mr-1">{currency}</span>
                {displayBid.toLocaleString()}
              </motion.div>

              {/* Current Leading Team / Sold Status */}
              <div className="mt-3">
                {session.status === 'sold' && highestBidTeam ? (
                  <div className="p-3 rounded-xl bg-status-success/15 border border-status-success/40 text-status-success flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg overflow-hidden border border-status-success/50 bg-bg-card flex items-center justify-center shrink-0">
                      {highestBidTeam.logo_url ? (
                        <img src={highestBidTeam.logo_url} alt={highestBidTeam.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-display font-bold text-xs text-status-success">{highestBidTeam.short_name}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-status-success">
                        🏆 OFFICIALLY SOLD & JOINED SQUAD
                      </div>
                      <div className="text-sm font-display font-bold text-white">
                        {highestBidTeam.name} ({highestBidTeam.short_name})
                      </div>
                    </div>
                  </div>
                ) : highestBidTeam ? (
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-bg-subtle/80 border border-gold/30">
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-gold/40 bg-bg-card flex items-center justify-center shrink-0">
                      {highestBidTeam.logo_url ? (
                        <img src={highestBidTeam.logo_url} alt={highestBidTeam.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-display font-bold text-xs text-gold">{highestBidTeam.short_name}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] text-text-muted uppercase font-medium">Leading Bidder</div>
                      <div className="text-sm font-display font-bold text-gold flex items-center gap-2">
                        <span>{highestBidTeam.name}</span>
                        <span className="text-[11px] font-mono font-normal text-text-muted">
                          (Purse: {currency}{highestBidTeam.remaining_purse.toLocaleString()})
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-text-muted italic py-1">
                    No bids placed yet. Waiting for opening bid...
                  </div>
                )}
              </div>
            </div>

            {/* Countdown Ring Column */}
            <div className="sm:col-span-5 flex justify-center sm:justify-end">
              {session.status === 'sold' || player.status === 'sold' ? (
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-status-success/15 border-2 border-status-success/40 flex flex-col items-center justify-center text-center shadow-lg">
                  <div className="text-[10px] uppercase font-bold text-status-success tracking-wider">Lot Status</div>
                  <div className="text-2xl sm:text-3xl font-display font-black text-status-success tracking-wide">
                    SOLD
                  </div>
                  <div className="text-[10px] text-text-muted mt-0.5">Round Finished</div>
                </div>
              ) : session.status === 'unsold' || player.status === 'unsold' ? (
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-status-danger/15 border-2 border-status-danger/40 flex flex-col items-center justify-center text-center shadow-lg">
                  <div className="text-[10px] uppercase font-bold text-status-danger tracking-wider">Lot Status</div>
                  <div className="text-2xl sm:text-3xl font-display font-black text-status-danger tracking-wide">
                    UNSOLD
                  </div>
                  <div className="text-[10px] text-text-muted mt-0.5">Round Finished</div>
                </div>
              ) : session.status === 'paused' ? (
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-status-warning/15 border-2 border-status-warning/40 flex flex-col items-center justify-center text-center shadow-lg animate-pulse">
                  <div className="text-[10px] uppercase font-bold text-status-warning tracking-wider">Auction</div>
                  <div className="text-xl sm:text-2xl font-display font-black text-status-warning tracking-wide">
                    PAUSED
                  </div>
                  <div className="text-xs font-mono text-text-muted mt-0.5">{remainingTime}s left</div>
                </div>
              ) : (
                <CountdownTimer
                  seconds={remainingTime}
                  totalSeconds={session.timer_seconds || 15}
                  size={isProjector ? 'hero' : 'lg'}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
