import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, User, Search, Filter, ShieldCheck, X, CheckCircle, Lock 
} from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { PlayerSpotlight } from '../components/auction/PlayerSpotlight';
import { AuctionControls } from '../components/auction/AuctionControls';
import { LiveBidFeed } from '../components/auction/LiveBidFeed';
import { TeamLeaderboard } from '../components/auction/TeamLeaderboard';
import { TeamRosterModal } from '../components/auction/TeamRosterModal';
import { MultiTeamBidPaddle } from '../components/auction/MultiTeamBidPaddle';
import { Team, Player } from '../types';

export const AuctioneerPage: React.FC = () => {
  const { 
    tournament, 
    teams, 
    players, 
    session, 
    currentPlayer, 
    highestBidTeam, 
    events, 
    recentBids, 
    squadPlayers, 
    remainingTime,
    startNextPlayer 
  } = useAuction();

  const [inspectTeam, setInspectTeam] = useState<Team | null>(null);
  const [isPlayerPickerOpen, setIsPlayerPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerRole, setPickerRole] = useState<string>('all');
  const [pickerStatusFilter, setPickerStatusFilter] = useState<'eligible' | 'all'>('eligible');

  const soldPlayerIds = new Set<string>([
    ...players.filter(p => p.status === 'sold').map(p => p.id),
    ...squadPlayers.map(sp => sp.player_id)
  ]);

  const filteredPickerPlayers = players.filter(p => {
    const isSold = soldPlayerIds.has(p.id) || p.status === 'sold';
    if (pickerStatusFilter === 'eligible' && isSold) return false;

    const matchesSearch = p.name.toLowerCase().includes(pickerSearch.toLowerCase()) || 
                          (p.village && p.village.toLowerCase().includes(pickerSearch.toLowerCase()));
    const matchesRole = pickerRole === 'all' || p.role === pickerRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner: Tournament Meta & Connection Bar */}
      <div className="bg-bg-card border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold font-bold text-sm">
            LOT #{currentPlayer ? currentPlayer.order_index : session.round_number}
          </div>
          <div>
            <div className="font-display font-bold text-sm text-text-primary flex items-center gap-2">
              {tournament.name}
              <span className="text-xs text-text-muted">• Round {session.round_number}</span>
            </div>
            <div className="text-[11px] text-text-muted">
              Authoritative Master Auction Console
            </div>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-text-secondary bg-bg-subtle px-3 py-1.5 rounded-xl border border-white/5">
            <Users className="w-3.5 h-3.5 text-gold" />
            <span>Connected Managers: <strong className="text-white">{teams.length}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 text-text-secondary bg-bg-subtle px-3 py-1.5 rounded-xl border border-white/5">
            <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
            <span>Total Sold: <strong className="text-white">{squadPlayers.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Alert if teams or players are empty */}
      {(teams.length === 0 || players.length === 0) && (
        <div className="p-4 rounded-2xl bg-gold/10 border border-gold/40 flex flex-wrap items-center justify-between gap-3 shadow-gold-glow">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="text-sm font-bold text-white">
                Tournament has {teams.length} teams and {players.length} players
              </div>
              <div className="text-xs text-text-muted">
                Add your real village franchises and cricketers to begin live bidding on the auction block.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/admin/teams" className="px-3.5 py-1.5 rounded-xl bg-gold hover:bg-gold-light text-bg-main font-bold text-xs shadow-sm">
              + Add Teams →
            </Link>
            <Link to="/admin/players" className="px-3.5 py-1.5 rounded-xl bg-bg-card hover:bg-bg-subtle border border-white/20 text-white font-bold text-xs hover:border-gold">
              + Add Players →
            </Link>
          </div>
        </div>
      )}

      {/* 3-Column Pro Layout: Left: Teams | Center: Player on Block + Controls | Right: Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Team Overview (3 Cols) */}
        <div className="lg:col-span-3 min-h-[600px]">
          <TeamLeaderboard
            teams={teams}
            squadPlayers={squadPlayers}
            currency={tournament.currency}
            onViewSquad={(team) => setInspectTeam(team)}
            activeTeamId={session.highest_bid_team_id || undefined}
          />
        </div>

        {/* Center Column: Current Player Spotlight & Auctioneer Controls (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          <PlayerSpotlight
            player={currentPlayer}
            session={session}
            highestBidTeam={highestBidTeam}
            remainingTime={remainingTime}
            currency={tournament.currency}
          />

          <MultiTeamBidPaddle />

          <AuctionControls
            onSelectSpecificPlayer={() => setIsPlayerPickerOpen(true)}
          />
        </div>

        {/* Right Column: Live Bid Feed & Ticker (3 Cols) */}
        <div className="lg:col-span-3 min-h-[600px]">
          <LiveBidFeed
            events={events}
            recentBids={recentBids}
            currency={tournament.currency}
          />
        </div>
      </div>

      {/* Team Squad Inspect Modal */}
      <TeamRosterModal
        team={inspectTeam}
        teams={teams}
        squadPlayers={squadPlayers}
        currency={tournament.currency}
        onClose={() => setInspectTeam(null)}
        onSelectTeam={(t) => setInspectTeam(t)}
      />

      {/* Manual Player Picker Modal */}
      {isPlayerPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-main/80 backdrop-blur-md">
          <div className="relative max-w-2xl w-full bg-bg-card border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="font-display font-bold text-lg text-white">
                  Call Specific Player to the Block
                </h3>
                <p className="text-xs text-text-muted">
                  Select any registered player to start their auction round
                </p>
              </div>
              <button
                onClick={() => setIsPlayerPickerOpen(false)}
                className="p-1.5 text-text-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pool filter toggle & Category chips */}
            <div className="py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-white/5">
              <div className="flex items-center gap-1.5 bg-bg-subtle p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setPickerStatusFilter('eligible')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    pickerStatusFilter === 'eligible'
                      ? 'bg-gold text-bg-main shadow-sm'
                      : 'text-text-muted hover:text-white'
                  }`}
                >
                  Eligible Only
                </button>
                <button
                  type="button"
                  onClick={() => setPickerStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    pickerStatusFilter === 'all'
                      ? 'bg-gold text-bg-main shadow-sm'
                      : 'text-text-muted hover:text-white'
                  }`}
                >
                  All ({players.length})
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { role: 'all', label: 'All Lots' },
                  { role: 'Icon Player', label: '👑 Icon Set' },
                  { role: 'Batsman', label: '🏏 Batsmen' },
                  { role: 'Bowler', label: '⚡ Bowlers' },
                  { role: 'All Rounder', label: '🌟 All Rounders' },
                  { role: 'Wicket Keeper', label: '🧤 Keepers' }
                ].map(cat => (
                  <button
                    key={cat.role}
                    type="button"
                    onClick={() => setPickerRole(cat.role)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      pickerRole === cat.role
                        ? 'bg-white/20 text-white border border-white/20'
                        : 'bg-bg-subtle text-text-muted hover:text-white border border-white/5'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search input */}
            <div className="py-2.5 border-b border-white/5">
              <div className="relative">
                <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search player name or village..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-bg-subtle border border-white/10 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            {/* Player list */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1 scrollbar-thin">
              {filteredPickerPlayers.length === 0 ? (
                <div className="text-center py-8 text-text-muted text-xs">
                  No eligible players found matching your filters.
                </div>
              ) : (
                filteredPickerPlayers.map(p => {
                  const isSold = soldPlayerIds.has(p.id) || p.status === 'sold';
                  const squadInfo = squadPlayers.find(sp => sp.player_id === p.id);

                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        isSold 
                          ? 'bg-bg-subtle/40 border-white/5 opacity-80' 
                          : 'bg-bg-subtle/80 border-white/5 hover:border-gold/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-text-muted w-6">
                          #{p.order_index}
                        </span>
                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-bg-card border border-white/10">
                          <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-text-primary flex items-center gap-2">
                            {p.name}
                            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase ${
                              isSold ? 'bg-status-success/20 text-status-success font-bold' :
                              p.status === 'unsold' ? 'bg-status-danger/20 text-status-danger' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {isSold ? 'SOLD' : p.status}
                            </span>
                          </div>
                          <div className="text-xs text-text-muted">
                            {p.role} • {p.village} • Base: <strong className="text-gold font-display">{tournament.currency}{p.base_price.toLocaleString()}</strong>
                          </div>
                        </div>
                      </div>

                      {isSold ? (
                        <div 
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-status-success/10 border border-status-success/30 text-status-success text-xs font-bold"
                          title="Player is already sold and cannot be re-auctioned"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>SOLD {squadInfo?.team ? `to ${squadInfo.team.short_name}` : ''}</span>
                        </div>
                      ) : (
                        <button
                          onClick={async () => {
                            await startNextPlayer(p.id);
                            setIsPlayerPickerOpen(false);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-gold/15 hover:bg-gold text-gold hover:text-bg-main border border-gold/30 text-xs font-bold transition-all shadow-sm"
                        >
                          Put on Block →
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
