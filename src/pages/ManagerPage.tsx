import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Radio, Wallet, CheckCircle2, ChevronRight, Eye, 
  Shield, Trophy, MapPin, Zap, ArrowRight, Layers, DollarSign, Filter 
} from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { useAuth } from '../context/AuthContext';
import { CountdownTimer } from '../components/common/CountdownTimer';
import { BidPanel } from '../components/auction/BidPanel';
import { BudgetBar } from '../components/common/BudgetBar';
import { TeamRosterModal } from '../components/auction/TeamRosterModal';
import { LiveBidFeed } from '../components/auction/LiveBidFeed';
import { Team, PlayerRole } from '../types';

export const ManagerPage: React.FC = () => {
  const { 
    tournament, 
    session, 
    currentPlayer, 
    highestBidTeam, 
    teams, 
    players,
    squadPlayers, 
    remainingTime,
    events 
  } = useAuction();
  const { managedTeam, switchDemoRole } = useAuth();

  // Active bidding franchise (who places bids)
  const currentTeam: Team | undefined = managedTeam || teams[0];

  // UI state
  const [activeTab, setActiveTab] = useState<'bid' | 'teams'>('bid');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(currentTeam?.id || teams[0]?.id || '');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);

  if (!currentTeam) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold shadow-gold-glow">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-display font-bold text-white">
          No Franchise Teams Created Yet
        </h2>
        <p className="text-xs text-text-muted max-w-sm mx-auto">
          To use the manager bidding terminal, please create at least one franchise team first.
        </p>
        <div className="pt-2">
          <Link
            to="/admin/teams"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold hover:bg-gold-light text-bg-main font-bold text-xs tracking-wider shadow-gold-glow transition-all"
          >
            + Add Teams Now →
          </Link>
        </div>
      </div>
    );
  }

  // Active team being inspected in the teams tab
  const inspectedTeam = teams.find(t => t.id === selectedTeamId) || currentTeam;

  // Players acquired by the active bidding team
  const currentTeamSquad = squadPlayers.filter(sp => sp.team_id === currentTeam.id);
  const currentTeamSquadCount = currentTeamSquad.length;

  // Players acquired by the currently selected/inspected team
  const inspectedTeamSquad = squadPlayers.filter(sp => sp.team_id === inspectedTeam.id).map(sp => {
    const matchedPlayer = sp.player || players.find(p => p.id === sp.player_id);
    return {
      ...sp,
      player: matchedPlayer
    };
  });

  // Filtered roster for the inspected team
  const filteredRoster = inspectedTeamSquad.filter(sp => {
    if (roleFilter === 'all') return true;
    return sp.player?.role === roleFilter;
  });

  // Role counts for inspected team
  const iconCount = inspectedTeamSquad.filter(sp => sp.player?.role === 'Icon Player').length;
  const batsmenCount = inspectedTeamSquad.filter(sp => sp.player?.role === 'Batsman').length;
  const bowlersCount = inspectedTeamSquad.filter(sp => sp.player?.role === 'Bowler').length;
  const allRoundersCount = inspectedTeamSquad.filter(sp => sp.player?.role === 'All Rounder').length;
  const keepersCount = inspectedTeamSquad.filter(sp => sp.player?.role === 'Wicket Keeper').length;

  const isAuctionLive = session.status === 'active';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header: Tournament info, live indicator & tab toggle */}
      <div className="bg-bg-card border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isAuctionLive ? 'bg-status-danger animate-pulse' : 'bg-gold'}`} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-primary">
              {isAuctionLive ? 'LIVE BROADCAST ROUND' : session.status.toUpperCase()}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-extrabold text-white mt-0.5">
            {tournament.name}
          </h1>
          <div className="text-xs text-text-muted mt-0.5">
            Manager Command & Franchise Roster Terminal
          </div>
        </div>

        {/* Tab Switcher: Live Bidding vs All Teams & Squads */}
        <div className="flex items-center bg-bg-subtle p-1 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('bid')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'bid'
                ? 'bg-gold text-bg-main shadow-gold-glow'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Live Bidding</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('teams')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'teams'
                ? 'bg-gold text-bg-main shadow-gold-glow'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>All Teams & Squads ({teams.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIVE BIDDING CONSOLE                                              */}
      {/* ========================================================================= */}
      {activeTab === 'bid' && (
        <div className="space-y-5">
          {/* Active Franchise Selector Bar */}
          <div className="bg-bg-card border border-white/10 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center font-display font-bold text-gold text-base shrink-0 overflow-hidden">
                  {currentTeam.logo_url ? (
                    <img src={currentTeam.logo_url} alt={currentTeam.name} className="w-full h-full object-cover" />
                  ) : (
                    currentTeam.short_name
                  )}
                </div>
                <div>
                  <div className="text-xs text-gold font-bold uppercase tracking-wider">
                    MY BIDDING FRANCHISE
                  </div>
                  <div className="text-base font-display font-bold text-white flex items-center gap-2">
                    {currentTeam.name}
                    <span className="text-xs text-text-muted">({currentTeam.short_name})</span>
                  </div>
                </div>
              </div>

              {/* Quick switch to bid as another team (testing/manager multi-team role) */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-text-muted hidden sm:inline">Switch Team:</label>
                <select
                  value={currentTeam.id}
                  onChange={(e) => {
                    switchDemoRole('manager', e.target.value);
                    setSelectedTeamId(e.target.value);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-bg-subtle border border-white/10 text-xs font-semibold text-gold focus:outline-none focus:border-gold"
                >
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.short_name} • {t.name} (Purse: {tournament.currency}{t.remaining_purse.toLocaleString()})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setIsRosterModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-bg-subtle hover:bg-white/10 text-gold text-xs font-semibold flex items-center gap-1 border border-gold/20"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Roster ({currentTeamSquadCount})</span>
                </button>
              </div>
            </div>

            <BudgetBar
              spent={currentTeam.spent_amount}
              remaining={currentTeam.remaining_purse}
              initial={currentTeam.initial_purse}
              squadCount={currentTeamSquadCount}
              maxSquad={currentTeam.max_squad_size}
              currency={tournament.currency}
            />
          </div>

          {/* Current Player on the Block */}
          {currentPlayer ? (
            <div className="bg-bg-card border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-gold/40 bg-bg-subtle shrink-0 shadow-lg">
                    <img
                      src={currentPlayer.photo_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80'}
                      alt={currentPlayer.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>

                  <div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gold/15 text-gold border border-gold/30">
                      {currentPlayer.role}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-display font-bold text-white mt-1 leading-snug">
                      {currentPlayer.name}
                    </h3>
                    <div className="text-xs text-text-muted mt-0.5 flex flex-wrap items-center gap-2">
                      <span>Village: <strong className="text-text-primary">{currentPlayer.village || 'Local'}</strong></span>
                      <span>•</span>
                      <span>Base: <strong className="text-gold font-display">{tournament.currency}{currentPlayer.base_price.toLocaleString()}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Countdown Ring */}
                <div className="self-center sm:self-auto shrink-0">
                  <CountdownTimer
                    seconds={remainingTime}
                    totalSeconds={session.timer_seconds || 15}
                    size="md"
                  />
                </div>
              </div>

              {/* Current Bid Stage */}
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    CURRENT HIGHEST BID
                  </div>
                  <div className="text-3xl sm:text-4xl font-display font-extrabold text-white">
                    <span className="text-gold font-light">{tournament.currency}</span>
                    {(session.current_bid > 0 ? session.current_bid : currentPlayer.base_price).toLocaleString()}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    CURRENT HOLDER
                  </div>
                  <div className="text-base sm:text-lg font-display font-bold text-gold">
                    {highestBidTeam ? `${highestBidTeam.name} (${highestBidTeam.short_name})` : 'Awaiting Opening Bid'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-bg-card border border-white/10 rounded-2xl p-8 text-center text-text-muted text-sm space-y-1">
              <div className="font-semibold text-text-secondary">No player currently on the auction block.</div>
              <div className="text-xs">The auctioneer will call the next player shortly. Stand by.</div>
            </div>
          )}

          {/* Fast Bid Panel */}
          <BidPanel
            team={currentTeam}
            player={currentPlayer}
            session={session}
            squadCount={currentTeamSquadCount}
          />

          {/* Quick Roster Teaser & Live Feed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quick Squad Summary */}
            <div className="bg-bg-card border border-white/10 rounded-2xl p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-gold" />
                  <span>{currentTeam.short_name} Acquired Squad ({currentTeamSquadCount})</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTeamId(currentTeam.id);
                    setActiveTab('teams');
                  }}
                  className="text-xs text-gold hover:underline font-semibold flex items-center gap-1"
                >
                  <span>Inspect All →</span>
                </button>
              </div>

              {currentTeamSquadCount === 0 ? (
                <div className="py-6 text-center text-xs text-text-muted">
                  No players purchased yet. Place a bid to win cricketers!
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
                  {currentTeamSquad.map(sp => {
                    const p = sp.player || players.find(player => player.id === sp.player_id);
                    return (
                      <div key={sp.id} className="p-2 rounded-xl bg-bg-subtle/80 border border-white/5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg overflow-hidden bg-bg-card border border-white/10 shrink-0">
                            <img src={p?.photo_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80'} alt={p?.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="font-semibold text-text-primary">{p?.name || 'Player'}</div>
                            <div className="text-[10px] text-gold">{p?.role} • {p?.village}</div>
                          </div>
                        </div>
                        <div className="font-display font-bold text-status-success">
                          {tournament.currency}{sp.purchase_price.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Live Feed */}
            <LiveBidFeed
              events={events}
              currency={tournament.currency}
              maxItems={6}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ALL TEAMS & SQUAD ROSTER INSPECTOR                                 */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <div className="space-y-6">
          {/* Franchise Selection Strip */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-gold" />
                <span>SELECT A FRANCHISE TO INSPECT ITS SQUAD & FINANCES</span>
              </div>
              <span className="text-[11px] text-text-muted">
                {teams.length} Franchises Registered
              </span>
            </div>

            {/* Horizontal Team Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {teams.map(team => {
                const isSelected = team.id === inspectedTeam.id;
                const isCurrentBidding = team.id === currentTeam.id;
                const teamSquad = squadPlayers.filter(sp => sp.team_id === team.id);

                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => {
                      setSelectedTeamId(team.id);
                      setRoleFilter('all');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2.5 relative ${
                      isSelected
                        ? 'bg-gold/15 border-gold shadow-gold-glow scale-[1.02]'
                        : 'bg-bg-card border-white/10 hover:border-white/20 hover:bg-bg-subtle/80'
                    }`}
                  >
                    {isCurrentBidding && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-gold text-bg-main uppercase tracking-wider">
                        My Team
                      </span>
                    )}

                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-bg-card border border-white/10 flex items-center justify-center font-display font-bold text-xs shrink-0">
                        {team.logo_url ? (
                          <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className={isSelected ? 'text-gold' : 'text-white'}>{team.short_name}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-display font-bold text-xs text-white truncate">
                          {team.name}
                        </div>
                        <div className="text-[10px] text-text-muted font-mono">
                          {team.short_name}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                      <div>
                        <div className="text-[9px] text-text-muted uppercase font-medium">Purse Left</div>
                        <div className="font-display font-bold text-gold">
                          {tournament.currency}{team.remaining_purse.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-text-muted uppercase font-medium">Squad</div>
                        <div className="font-mono font-bold text-text-primary">
                          {teamSquad.length}/{team.max_squad_size}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Team Detail Dossier */}
          <div className="bg-bg-card border border-white/10 rounded-2xl p-5 shadow-2xl space-y-5">
            {/* Dossier Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-bg-subtle border-2 border-gold/30 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                  {inspectedTeam.logo_url ? (
                    <img src={inspectedTeam.logo_url} alt={inspectedTeam.name} className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="w-7 h-7 text-gold" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-display font-black text-white">
                      {inspectedTeam.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded-lg bg-gold/15 border border-gold/30 text-gold font-mono font-bold text-xs">
                      {inspectedTeam.short_name}
                    </span>
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">
                    Owner / Manager: <strong className="text-text-primary">{inspectedTeam.owner_name || 'Unassigned'}</strong>
                  </div>
                </div>
              </div>

              {/* Action: Set as active bidding franchise */}
              <div className="flex items-center gap-2">
                {currentTeam.id !== inspectedTeam.id ? (
                  <button
                    type="button"
                    onClick={() => switchDemoRole('manager', inspectedTeam.id)}
                    className="px-3.5 py-2 rounded-xl bg-gold/15 hover:bg-gold text-gold hover:text-bg-main border border-gold/30 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Bid for {inspectedTeam.short_name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-status-success/15 border border-status-success/40 text-status-success text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Your Active Bidding Team</span>
                  </span>
                )}
              </div>
            </div>

            {/* Financial Metrics & Progress Bar */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-bg-subtle/80 border border-white/5">
                  <div className="text-[10px] text-text-muted uppercase font-medium">Initial Purse</div>
                  <div className="font-display font-bold text-sm text-text-primary mt-0.5">
                    {tournament.currency}{inspectedTeam.initial_purse.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-bg-subtle/80 border border-white/5">
                  <div className="text-[10px] text-text-muted uppercase font-medium">Remaining Purse</div>
                  <div className="font-display font-bold text-sm text-gold mt-0.5">
                    {tournament.currency}{inspectedTeam.remaining_purse.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-bg-subtle/80 border border-white/5">
                  <div className="text-[10px] text-text-muted uppercase font-medium">Total Spent</div>
                  <div className="font-display font-bold text-sm text-text-secondary mt-0.5">
                    {tournament.currency}{inspectedTeam.spent_amount.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-bg-subtle/80 border border-white/5">
                  <div className="text-[10px] text-text-muted uppercase font-medium">Squad Capacity</div>
                  <div className="font-display font-bold text-sm text-status-success mt-0.5">
                    {inspectedTeamSquad.length} / {inspectedTeam.max_squad_size} Players
                  </div>
                </div>
              </div>

              <BudgetBar
                spent={inspectedTeam.spent_amount}
                remaining={inspectedTeam.remaining_purse}
                initial={inspectedTeam.initial_purse}
                squadCount={inspectedTeamSquad.length}
                maxSquad={inspectedTeam.max_squad_size}
                currency={tournament.currency}
              />
            </div>

            {/* Squad Role Composition Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
              <span className="text-xs text-text-muted font-medium mr-1">Roster Roles:</span>
              <span className="px-2.5 py-1 rounded-lg bg-bg-subtle text-[11px] text-text-primary border border-white/5 font-semibold">
                👑 Icon: <strong className="text-amber-300 font-display">{iconCount}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-bg-subtle text-[11px] text-text-primary border border-white/5 font-semibold">
                🏏 Batsmen: <strong className="text-blue-400 font-display">{batsmenCount}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-bg-subtle text-[11px] text-text-primary border border-white/5 font-semibold">
                ⚡ Bowlers: <strong className="text-emerald-400 font-display">{bowlersCount}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-bg-subtle text-[11px] text-text-primary border border-white/5 font-semibold">
                🌟 All Rounders: <strong className="text-gold font-display">{allRoundersCount}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-bg-subtle text-[11px] text-text-primary border border-white/5 font-semibold">
                🧤 Keepers: <strong className="text-purple-400 font-display">{keepersCount}</strong>
              </span>
            </div>

            {/* Players Acquired by this Team Header & Filter */}
            <div className="pt-2 border-t border-white/10 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                    <span>Acquired Players</span>
                    <span className="px-2 py-0.5 rounded-full bg-status-success/15 border border-status-success/30 text-status-success font-mono text-xs">
                      {inspectedTeamSquad.length} Players
                    </span>
                  </h3>
                  <p className="text-[11px] text-text-muted">
                    Official cricketers sold to {inspectedTeam.name} in the live auction
                  </p>
                </div>

                {/* Role filter buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { role: 'all', label: `All (${inspectedTeamSquad.length})` },
                    { role: 'Icon Player', label: `👑 Icon (${iconCount})` },
                    { role: 'Batsman', label: `🏏 Bat (${batsmenCount})` },
                    { role: 'Bowler', label: `⚡ Bowl (${bowlersCount})` },
                    { role: 'All Rounder', label: `🌟 AR (${allRoundersCount})` },
                    { role: 'Wicket Keeper', label: `🧤 WK (${keepersCount})` },
                  ].map(tab => (
                    <button
                      key={tab.role}
                      type="button"
                      onClick={() => setRoleFilter(tab.role)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        roleFilter === tab.role
                          ? 'bg-gold text-bg-main shadow-sm'
                          : 'bg-bg-subtle text-text-muted hover:text-white border border-white/5'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Roster Grid / Cards */}
              {filteredRoster.length === 0 ? (
                <div className="bg-bg-subtle/40 border border-white/5 rounded-2xl p-8 text-center space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center text-text-muted">
                    <Shield className="w-6 h-6 opacity-40" />
                  </div>
                  <div className="font-display font-bold text-sm text-text-secondary">
                    {inspectedTeamSquad.length === 0 
                      ? `No players have been purchased yet by ${inspectedTeam.name}` 
                      : `No players in role '${roleFilter}' acquired yet by ${inspectedTeam.name}`}
                  </div>
                  <div className="text-xs text-text-muted max-w-sm mx-auto">
                    When this franchise wins players in the live auction, their complete profile and purchase price will appear here.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredRoster.map((sp, idx) => {
                    const p = sp.player;
                    return (
                      <div
                        key={sp.id}
                        className="p-3.5 rounded-xl bg-bg-subtle/80 border border-white/5 hover:border-gold/30 transition-all flex items-center justify-between gap-3 shadow-md"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono text-xs text-text-muted w-5 shrink-0">
                            #{idx + 1}
                          </span>

                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-bg-card border border-white/10 shrink-0">
                            <img
                              src={p?.photo_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80'}
                              alt={p?.name}
                              className="w-full h-full object-cover object-top"
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="font-display font-bold text-sm text-white truncate">
                              {p?.name || 'Cricketer'}
                            </div>

                            <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                              <span className={`font-semibold ${
                                p?.role === 'Icon Player' ? 'text-amber-300' :
                                p?.role === 'Batsman' ? 'text-blue-400' :
                                p?.role === 'Bowler' ? 'text-emerald-400' :
                                p?.role === 'All Rounder' ? 'text-gold' : 'text-purple-400'
                              }`}>
                                {p?.role}
                              </span>
                              <span className="text-text-muted">•</span>
                              <span className="text-text-muted truncate">{p?.village || 'Local'}</span>
                            </div>

                            <div className="text-[10px] text-text-muted mt-0.5">
                              Bat: <strong className="text-text-secondary">{p?.batting_style || 'RHB'}</strong> • Bowl: <strong className="text-text-secondary">{p?.bowling_style || 'None'}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Price Paid */}
                        <div className="text-right shrink-0">
                          <div className="text-[9px] text-text-muted uppercase font-medium">Bought For</div>
                          <div className="font-display font-extrabold text-sm sm:text-base text-status-success">
                            {tournament.currency}{sp.purchase_price.toLocaleString()}
                          </div>
                          <div className="text-[9px] text-text-muted font-mono">
                            Base: {tournament.currency}{p?.base_price.toLocaleString() || '0'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Team Roster Modal with Full Multi-Franchise Switcher */}
      {isRosterModalOpen && (
        <TeamRosterModal
          team={inspectedTeam || currentTeam}
          teams={teams}
          squadPlayers={squadPlayers}
          currency={tournament.currency}
          onClose={() => setIsRosterModalOpen(false)}
          onSelectTeam={(t) => setSelectedTeamId(t.id)}
        />
      )}
    </div>
  );
};
