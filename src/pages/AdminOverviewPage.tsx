import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Users, User, Settings, Award, ArrowRight, 
  TrendingUp, Wallet, CheckCircle, Ban 
} from 'lucide-react';
import { useAuction } from '../context/AuctionContext';

export const AdminOverviewPage: React.FC = () => {
  const { tournament, teams, players, squadPlayers } = useAuction();

  const totalSpent = teams.reduce((acc, t) => acc + t.spent_amount, 0);
  const totalPurse = teams.reduce((acc, t) => acc + t.initial_purse, 0);
  const soldPlayersCount = squadPlayers.length;
  const unsoldPlayersCount = players.filter(p => p.status === 'unsold').length;
  const availablePlayersCount = players.filter(p => p.status === 'available').length;

  const quickLinks = [
    {
      to: '/admin/auction',
      title: 'Auctioneer Desk',
      desc: 'Authoritative controls, call player to block, hammer down sold/unsold',
      icon: Shield,
      color: 'text-gold',
      badge: 'Live Console'
    },
    {
      to: '/admin/teams',
      title: 'Team Management',
      desc: 'Create/edit franchises, set budget, assign managers, inspect rosters',
      icon: Users,
      color: 'text-status-success',
      badge: `${teams.length} Teams`
    },
    {
      to: '/admin/players',
      title: 'Player Registry',
      desc: 'Manage player roster, roles, base prices, photo uploads & CSV import',
      icon: User,
      color: 'text-blue-400',
      badge: `${players.length} Players`
    },
    {
      to: '/admin/settings',
      title: 'Auction Configuration',
      desc: 'Configure tournament name, bid increments table, timer, purse rules',
      icon: Settings,
      color: 'text-purple-400',
      badge: 'Rules'
    },
    {
      to: '/results',
      title: 'Results & Analytics',
      desc: 'View leaderboard, highest bids, team spending charts & export CSVs',
      icon: Award,
      color: 'text-amber-400',
      badge: 'Reports'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-white">
            Tournament Command Center
          </h1>
          <p className="text-xs text-text-muted mt-1">
            {tournament.name} • Administrator & Auction Master Management
          </p>
        </div>

        <Link
          to="/admin/auction"
          className="px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-bg-main font-display font-bold text-xs tracking-wider flex items-center gap-2 shadow-gold-glow transition-all"
        >
          <Shield className="w-4 h-4 stroke-[2.5]" />
          LAUNCH AUCTIONEER DESK →
        </Link>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-bg-card border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-text-muted text-xs mb-2">
            <span>Total Spending</span>
            <Wallet className="w-4 h-4 text-gold" />
          </div>
          <div className="text-2xl sm:text-3xl font-display font-extrabold text-white">
            {tournament.currency}{totalSpent.toLocaleString()}
          </div>
          <div className="text-[11px] text-text-muted mt-1 font-mono">
            of {tournament.currency}{totalPurse.toLocaleString()} total purse
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-bg-card border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-text-muted text-xs mb-2">
            <span>Players Sold</span>
            <CheckCircle className="w-4 h-4 text-status-success" />
          </div>
          <div className="text-2xl sm:text-3xl font-display font-extrabold text-status-success">
            {soldPlayersCount}
          </div>
          <div className="text-[11px] text-text-muted mt-1">
            out of {players.length} players
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-bg-card border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-text-muted text-xs mb-2">
            <span>Available in Pool</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-display font-extrabold text-white">
            {availablePlayersCount}
          </div>
          <div className="text-[11px] text-text-muted mt-1">
            pending auction calls
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-bg-card border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-text-muted text-xs mb-2">
            <span>Unsold Players</span>
            <Ban className="w-4 h-4 text-status-danger" />
          </div>
          <div className="text-2xl sm:text-3xl font-display font-extrabold text-status-danger">
            {unsoldPlayersCount}
          </div>
          <div className="text-[11px] text-text-muted mt-1">
            eligible for re-auction
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {quickLinks.map(card => {
          const Icon = card.icon;
          return (
            <Link
              key={card.to}
              to={card.to}
              className="p-6 rounded-2xl bg-bg-card border border-white/10 hover:border-gold/40 shadow-xl transition-all hover:scale-[1.02] group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${card.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-text-secondary">
                    {card.badge}
                  </span>
                </div>

                <h3 className="text-lg font-display font-bold text-white group-hover:text-gold transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
                  {card.desc}
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-text-secondary group-hover:text-gold">
                <span>Manage</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
