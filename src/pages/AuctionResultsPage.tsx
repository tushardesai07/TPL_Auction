import React, { useState } from 'react';
import { 
  Award, Trophy, Download, Printer, TrendingUp, Users, 
  DollarSign, PieChart, BarChart2, Star, CheckCircle, Shield 
} from 'lucide-react';
import { useAuction } from '../context/AuctionContext';

export const AuctionResultsPage: React.FC = () => {
  const { tournament, teams, players, squadPlayers } = useAuction();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'analytics' | 'players'>('leaderboard');

  const totalSpent = teams.reduce((acc, t) => acc + t.spent_amount, 0);
  const totalSold = squadPlayers.length;
  const totalUnsold = players.filter(p => p.status === 'unsold').length;
  const avgPrice = totalSold > 0 ? Math.round(totalSpent / totalSold) : 0;

  // Highest Purchase
  const highestSale = squadPlayers.length > 0 
    ? [...squadPlayers].sort((a, b) => b.purchase_price - a.purchase_price)[0] 
    : null;

  // Most Expensive Team
  const mostExpensiveTeam = [...teams].sort((a, b) => b.spent_amount - a.spent_amount)[0];

  // Role Breakdown
  const roleCounts: Record<string, number> = {};
  squadPlayers.forEach(sp => {
    const role = sp.player?.role || 'Batsman';
    roleCounts[role] = (roleCounts[role] || 0) + 1;
  });

  // Export Results CSV
  const exportResultsCSV = () => {
    const headers = ['Team', 'Owner', 'Players Bought', 'Total Spent', 'Remaining Purse'];
    const rows = teams.map(t => [
      `"${t.name}"`,
      `"${t.owner_name || ''}"`,
      squadPlayers.filter(sp => sp.team_id === t.id).length,
      t.spent_amount,
      t.remaining_purse
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `VPL_Auction_Team_Results.csv`;
    link.click();
  };

  // Export Player Purchases CSV
  const exportPurchasesCSV = () => {
    const headers = ['Player', 'Role', 'Village', 'Bought By Team', 'Purchase Price'];
    const rows = squadPlayers.map(sp => [
      `"${sp.player?.name || ''}"`,
      sp.player?.role || '',
      `"${sp.player?.village || ''}"`,
      `"${sp.team?.name || ''}"`,
      sp.purchase_price
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `VPL_Player_Purchases.csv`;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 print:p-0 print:m-0">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10 print:border-b-2 print:border-black">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-gold mb-1">
            OFFICIAL TOURNAMENT SUMMARY
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white print:text-black">
            Auction Results & Leaderboards
          </h1>
          <p className="text-xs text-text-muted mt-1 print:text-gray-600">
            {tournament.name} • Certified Final Franchise Rosters
          </p>
        </div>

        <div className="flex items-center gap-3 print:hidden">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-bg-card hover:bg-bg-subtle text-text-secondary hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>

          <button
            onClick={exportResultsCSV}
            className="px-4 py-2 rounded-xl bg-bg-card hover:bg-bg-subtle text-gold border border-gold/30 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Teams CSV</span>
          </button>

          <button
            onClick={exportPurchasesCSV}
            className="px-4 py-2 rounded-xl bg-gold hover:bg-gold-light text-bg-main font-display font-bold text-xs tracking-wider flex items-center gap-2 shadow-gold-glow transition-all"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Export Purchases CSV</span>
          </button>
        </div>
      </div>

      {/* Highlights KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-bg-card border border-white/10 shadow-lg">
          <div className="text-xs text-text-muted mb-1 uppercase font-semibold">Total Spending</div>
          <div className="text-2xl sm:text-3xl font-display font-extrabold text-gold">
            {tournament.currency}{totalSpent.toLocaleString()}
          </div>
          <div className="text-[11px] text-text-muted mt-1">Across 8 franchises</div>
        </div>

        <div className="p-5 rounded-2xl bg-bg-card border border-white/10 shadow-lg">
          <div className="text-xs text-text-muted mb-1 uppercase font-semibold">Players Acquired</div>
          <div className="text-2xl sm:text-3xl font-display font-extrabold text-status-success">
            {totalSold} <span className="text-sm font-normal text-text-muted">/ {players.length}</span>
          </div>
          <div className="text-[11px] text-text-muted mt-1">{totalUnsold} unsold in pool</div>
        </div>

        <div className="p-5 rounded-2xl bg-bg-card border border-white/10 shadow-lg">
          <div className="text-xs text-text-muted mb-1 uppercase font-semibold">Average Player Price</div>
          <div className="text-2xl sm:text-3xl font-display font-extrabold text-blue-400">
            {tournament.currency}{avgPrice.toLocaleString()}
          </div>
          <div className="text-[11px] text-text-muted mt-1">Per signed cricketer</div>
        </div>

        <div className="p-5 rounded-2xl bg-bg-card border border-white/10 shadow-lg">
          <div className="text-xs text-text-muted mb-1 uppercase font-semibold">Top Bid (Marquee)</div>
          <div className="text-2xl sm:text-3xl font-display font-extrabold text-white">
            {highestSale ? `${tournament.currency}${highestSale.purchase_price.toLocaleString()}` : '—'}
          </div>
          <div className="text-[11px] text-gold truncate mt-1">
            {highestSale?.player?.name || 'N/A'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 print:hidden">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'leaderboard'
              ? 'bg-gold text-bg-main shadow-gold-glow'
              : 'text-text-secondary hover:text-white'
          }`}
        >
          Franchise Leaderboard
        </button>

        <button
          onClick={() => setActiveTab('players')}
          className={`px-4 py-2 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'players'
              ? 'bg-gold text-bg-main shadow-gold-glow'
              : 'text-text-secondary hover:text-white'
          }`}
        >
          Top Player Purchases
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'analytics'
              ? 'bg-gold text-bg-main shadow-gold-glow'
              : 'text-text-secondary hover:text-white'
          }`}
        >
          Visual Analytics & Spending
        </button>
      </div>

      {/* TAB 1: Team Leaderboard Table */}
      {activeTab === 'leaderboard' && (
        <div className="bg-bg-card border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-bg-subtle/70 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  <th className="py-3.5 px-4">Rank</th>
                  <th className="py-3.5 px-4">Franchise</th>
                  <th className="py-3.5 px-4">Owner / Manager</th>
                  <th className="py-3.5 px-4 text-center">Squad Size</th>
                  <th className="py-3.5 px-4 text-right">Spent Amount</th>
                  <th className="py-3.5 px-4 text-right">Purse Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {[...teams]
                  .sort((a, b) => b.spent_amount - a.spent_amount)
                  .map((team, idx) => {
                    const squadCount = squadPlayers.filter(sp => sp.team_id === team.id).length;
                    return (
                      <tr key={team.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-gold text-sm">
                          #{idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-bg-subtle border border-gold/30 shrink-0 flex items-center justify-center font-display font-bold text-gold text-xs">
                              {team.logo_url ? (
                                <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                              ) : (
                                team.short_name
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-white text-sm">
                                {team.name}
                              </div>
                              <div className="text-[10px] text-text-muted font-mono">
                                {team.short_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-text-secondary">
                          {team.owner_name}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-text-primary">
                          {squadCount} / {team.max_squad_size}
                        </td>
                        <td className="py-3.5 px-4 text-right font-display font-bold text-white text-sm">
                          {tournament.currency}{team.spent_amount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-display font-bold text-gold text-sm">
                          {tournament.currency}{team.remaining_purse.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Player Leaderboard Table */}
      {activeTab === 'players' && (
        <div className="bg-bg-card border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-bg-subtle/70 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  <th className="py-3.5 px-4">Rank</th>
                  <th className="py-3.5 px-4">Player</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Village</th>
                  <th className="py-3.5 px-4">Acquired By</th>
                  <th className="py-3.5 px-4 text-right">Sold Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {squadPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-text-muted">
                      No players have been sold yet.
                    </td>
                  </tr>
                ) : (
                  [...squadPlayers]
                    .sort((a, b) => b.purchase_price - a.purchase_price)
                    .map((item, idx) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-gold text-sm">
                          #{idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-white text-sm">
                          {item.player?.name}
                        </td>
                        <td className="py-3.5 px-4 text-text-secondary">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-gold font-medium">
                            {item.player?.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-text-muted">
                          {item.player?.village}
                        </td>
                        <td className="py-3.5 px-4 font-display font-semibold text-text-primary">
                          {item.team?.name}
                        </td>
                        <td className="py-3.5 px-4 text-right font-display font-extrabold text-status-success text-base">
                          {tournament.currency}{item.purchase_price.toLocaleString()}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Visual Analytics */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Spending by team bar chart */}
          <div className="bg-bg-card border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-gold" />
              Team Spending Distribution
            </h3>

            <div className="space-y-3 pt-2">
              {teams.map(team => {
                const pct = tournament.total_purse > 0 ? (team.spent_amount / tournament.total_purse) * 100 : 0;
                return (
                  <div key={team.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-text-primary">{team.name}</span>
                      <span className="text-gold font-display">{tournament.currency}{team.spent_amount.toLocaleString()}</span>
                    </div>
                    <div className="h-2.5 w-full bg-bg-subtle rounded-full overflow-hidden">
                      <div className="h-full bg-gold rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Players Acquired By Role */}
          <div className="bg-bg-card border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-status-success" />
              Players Acquired by Specialization
            </h3>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {['Batsman', 'Bowler', 'All Rounder', 'Wicket Keeper'].map(role => {
                const count = roleCounts[role] || 0;
                return (
                  <div key={role} className="p-4 rounded-xl bg-bg-subtle/80 border border-white/5 text-center">
                    <div className="text-2xl font-display font-bold text-gold">
                      {count}
                    </div>
                    <div className="text-xs text-text-secondary mt-1 font-medium">
                      {role}s
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
