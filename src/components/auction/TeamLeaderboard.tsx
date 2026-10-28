import React, { useState } from 'react';
import { Users, Eye } from 'lucide-react';
import { Team, SquadPlayer } from '../../types';
import { BudgetBar } from '../common/BudgetBar';

interface TeamLeaderboardProps {
  teams: Team[];
  squadPlayers: SquadPlayer[];
  currency?: string;
  onViewSquad?: (team: Team) => void;
  activeTeamId?: string;
}

export const TeamLeaderboard: React.FC<TeamLeaderboardProps> = ({
  teams,
  squadPlayers,
  currency = '₹',
  onViewSquad,
  activeTeamId,
}) => {
  return (
    <div className="bg-bg-card border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gold" />
          <h3 className="font-display font-semibold text-sm tracking-wide text-text-primary">
            TEAM PURSE & SQUAD
          </h3>
        </div>
        <span className="text-[10px] text-text-muted font-mono">
          {teams.length} Teams
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
        {teams.map((team) => {
          const teamBoughtPlayers = squadPlayers.filter(sp => sp.team_id === team.id);
          const squadCount = teamBoughtPlayers.length;
          const isLeading = activeTeamId === team.id;

          return (
            <div
              key={team.id}
              className={`p-3 rounded-xl border transition-all ${
                isLeading
                  ? 'bg-gold/10 border-gold/40 shadow-sm'
                  : 'bg-bg-subtle/70 border-white/5 hover:border-white/15'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg overflow-hidden bg-bg-card border border-white/10 flex items-center justify-center shrink-0">
                    {team.logo_url ? (
                      <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-display font-bold text-[10px] text-gold">{team.short_name}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs text-text-primary truncate max-w-[130px]">
                      {team.name}
                    </h4>
                    <p className="text-[10px] text-text-muted">
                      {team.owner_name?.slice(0, 18)}
                    </p>
                  </div>
                </div>

                {onViewSquad && (
                  <button
                    onClick={() => onViewSquad(team)}
                    className="p-1 rounded text-text-muted hover:text-gold hover:bg-white/5 transition-colors"
                    title="View Team Squad"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Compact Visual Budget Bar */}
              <BudgetBar
                spent={team.spent_amount}
                remaining={team.remaining_purse}
                initial={team.initial_purse}
                squadCount={squadCount}
                maxSquad={team.max_squad_size}
                currency={currency}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
