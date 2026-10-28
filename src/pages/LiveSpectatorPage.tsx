import React, { useState } from 'react';
import { Radio, Trophy, CheckCircle, Clock } from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { PlayerSpotlight } from '../components/auction/PlayerSpotlight';
import { TeamLeaderboard } from '../components/auction/TeamLeaderboard';
import { LiveBidFeed } from '../components/auction/LiveBidFeed';
import { TeamRosterModal } from '../components/auction/TeamRosterModal';
import { Team } from '../types';

export const LiveSpectatorPage: React.FC = () => {
  const { 
    tournament, 
    teams, 
    session, 
    currentPlayer, 
    highestBidTeam, 
    events, 
    recentBids, 
    squadPlayers, 
    remainingTime 
  } = useAuction();

  const [inspectTeam, setInspectTeam] = useState<Team | null>(null);

  // Recent 5 sold players
  const recentSold = squadPlayers.slice(-5).reverse();

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Broadcast TV Header Bar */}
      <div className="bg-bg-card border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 rounded-full bg-status-danger animate-ping" />
          <div>
            <h1 className="text-lg font-display font-black tracking-wide text-white uppercase flex items-center gap-2">
              {tournament.name}
              <span className="text-xs px-2 py-0.5 rounded bg-status-danger/20 border border-status-danger/40 text-status-danger font-mono font-bold">
                OFFICIAL BROADCAST
              </span>
            </h1>
            <p className="text-xs text-text-muted">
              Live Spectator Arena • Big Screen Projection Mode
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div>
            <span className="text-text-muted">LOT NUMBER:</span>{' '}
            <strong className="text-gold font-display font-bold text-sm">
              #{currentPlayer ? currentPlayer.order_index : session.round_number}
            </strong>
          </div>
          <div>
            <span className="text-text-muted">TOTAL PLAYERS SOLD:</span>{' '}
            <strong className="text-status-success font-display font-bold text-sm">
              {squadPlayers.length}
            </strong>
          </div>
        </div>
      </div>

      {/* Main Broadcast Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Team Leaderboard & Recent Sold (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="min-h-[460px]">
            <TeamLeaderboard
              teams={teams}
              squadPlayers={squadPlayers}
              currency={tournament.currency}
              onViewSquad={(team) => setInspectTeam(team)}
              activeTeamId={session.highest_bid_team_id || undefined}
            />
          </div>

          {/* Recent Sold Ticker Card */}
          <div className="bg-bg-card border border-white/10 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-status-success" />
                <h3 className="font-display font-semibold text-xs tracking-wide text-white uppercase">
                  RECENTLY SOLD
                </h3>
              </div>
              <span className="text-[10px] text-text-muted font-mono">Latest 5</span>
            </div>

            <div className="space-y-2">
              {recentSold.length === 0 ? (
                <div className="text-center py-6 text-xs text-text-muted">
                  No sales completed yet
                </div>
              ) : (
                recentSold.map(item => (
                  <div key={item.id} className="p-2.5 rounded-xl bg-bg-subtle/70 border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">
                        {item.player?.name}
                      </div>
                      <div className="text-[10px] text-gold">
                        Sold to {item.team?.name}
                      </div>
                    </div>
                    <div className="text-right font-display font-bold text-xs text-status-success">
                      {tournament.currency}{item.purchase_price.toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Center / Right: Big Stage Player Spotlight & Live Bid Stream (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <PlayerSpotlight
            player={currentPlayer}
            session={session}
            highestBidTeam={highestBidTeam}
            remainingTime={remainingTime}
            currency={tournament.currency}
            isProjector={true}
          />

          {/* Live Activity Ticker */}
          <div className="min-h-[300px]">
            <LiveBidFeed
              events={events}
              recentBids={recentBids}
              currency={tournament.currency}
              maxItems={10}
            />
          </div>
        </div>
      </div>

      <TeamRosterModal
        team={inspectTeam}
        teams={teams}
        squadPlayers={squadPlayers}
        currency={tournament.currency}
        onClose={() => setInspectTeam(null)}
        onSelectTeam={(t) => setInspectTeam(t)}
      />
    </div>
  );
};
