import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Edit2, Trash2, Eye, Shield, Wallet, X, Check, Upload, Image 
} from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { useAuth } from '../context/AuthContext';
import { TeamRosterModal } from '../components/auction/TeamRosterModal';
import { Team } from '../types';
import { apiCreateTeam, apiUpdateTeam, apiDeleteTeam, uploadMedia } from '../services/auctionApi';

export const TeamManagementPage: React.FC = () => {
  const { tournament, teams, squadPlayers } = useAuction();
  const { role } = useAuth();
  const isAdmin = role === 'admin' || role === 'auctioneer';

  const [localTeams, setLocalTeams] = useState<Team[]>(teams);

  // Keep local teams reactive to changes in AuctionContext / Supabase realtime
  useEffect(() => {
    setLocalTeams(teams);
  }, [teams]);
  const [editingTeam, setEditingTeam] = useState<Partial<Team> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inspectTeam, setInspectTeam] = useState<Team | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingTeam({
      id: '',
      tournament_id: tournament.id,
      name: '',
      short_name: '',
      logo_url: '',
      owner_name: '',
      initial_purse: tournament.total_purse,
      remaining_purse: tournament.total_purse,
      spent_amount: 0,
      max_squad_size: tournament.max_players_per_team,
      squad_count: 0
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (team: Team) => {
    setEditingTeam({ ...team });
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingTeam) return;

    try {
      setIsUploading(true);
      const res = await uploadMedia(file, 'team-logos');
      if (res.url) {
        setEditingTeam(prev => ({ ...prev, logo_url: res.url }));
      }
    } catch (err: any) {
      alert(err.message || 'Logo upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam || !editingTeam.name) return;

    setSaveStatus('Saving to Supabase...');

    try {
      if (editingTeam.id && localTeams.some(t => t.id === editingTeam.id)) {
        // Update existing team
        await apiUpdateTeam(editingTeam.id, editingTeam);
        setLocalTeams(prev => prev.map(t => t.id === editingTeam.id ? { ...t, ...editingTeam } as Team : t));
      } else {
        // Create new team
        const res = await apiCreateTeam({
          tournament_id: tournament.id,
          name: editingTeam.name!,
          short_name: editingTeam.short_name || editingTeam.name!.substring(0, 3).toUpperCase(),
          logo_url: editingTeam.logo_url || 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=200&auto=format&fit=crop&q=80',
          owner_name: editingTeam.owner_name || 'Team Owner',
          initial_purse: editingTeam.initial_purse || tournament.total_purse,
          remaining_purse: editingTeam.remaining_purse || tournament.total_purse,
          spent_amount: 0,
          max_squad_size: editingTeam.max_squad_size || tournament.max_players_per_team
        });

        if (res.data) {
          setLocalTeams(prev => [...prev, res.data!]);
        }
      }

      setSaveStatus('Saved!');
      setTimeout(() => {
        setIsModalOpen(false);
        setEditingTeam(null);
        setSaveStatus(null);
      }, 500);
    } catch (err: any) {
      alert(err.message || 'Failed to save team');
      setSaveStatus(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this team?')) {
      await apiDeleteTeam(id);
      setLocalTeams(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-white">
            Team Franchises
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Manage teams, initial purse allocations, logos, and squad capacities
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-bg-main font-display font-bold text-xs tracking-wider flex items-center gap-2 shadow-gold-glow transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            ADD NEW TEAM
          </button>
        ) : (
          <span className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-text-muted text-xs font-semibold">
            Franchise Directory • Public View
          </span>
        )}
      </div>

      {/* Empty State */}
      {localTeams.length === 0 ? (
        <div className="bg-bg-card border border-white/10 rounded-2xl p-12 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-display font-bold text-white">No Teams Registered Yet</h3>
          <p className="text-xs text-text-muted max-w-md mx-auto">
            {isAdmin 
              ? "You haven't added any franchise teams yet. Click the 'ADD NEW TEAM' button above to register your first team." 
              : "Franchise teams registered by the tournament administrator will appear here for all spectators and managers."}
          </p>
          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-bg-main font-bold text-xs shadow-gold-glow transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              ADD FIRST TEAM
            </button>
          )}
        </div>
      ) : (
        /* Teams Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {localTeams.map(team => {
            const roster = squadPlayers.filter(sp => sp.team_id === team.id);
            const currentSquadCount = roster.length;

            return (
              <div
                key={team.id}
                className="bg-bg-card border border-white/10 rounded-2xl p-5 shadow-xl space-y-4 hover:border-gold/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-bg-subtle border border-gold/30 flex items-center justify-center shrink-0">
                        {team.logo_url ? (
                          <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                        ) : (
                          <Shield className="w-6 h-6 text-gold" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-base text-white">
                          {team.name}
                        </h3>
                        <div className="text-xs text-gold font-mono font-bold">
                          {team.short_name}
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 border border-white/10 text-text-muted">
                      {currentSquadCount}/{team.max_squad_size}
                    </span>
                  </div>

                  <div className="text-xs text-text-muted py-2 border-y border-white/5 space-y-1">
                    <div>Owner / Manager: <strong className="text-text-primary">{team.owner_name || 'Unassigned'}</strong></div>
                    <div>Purse Remaining: <strong className="text-gold font-display">{tournament.currency}{team.remaining_purse.toLocaleString()}</strong></div>
                    <div>Spent: <strong className="text-text-primary font-display">{tournament.currency}{team.spent_amount.toLocaleString()}</strong></div>
                  </div>

                  {/* Players Acquired by Team */}
                  <div className="pt-2 space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center justify-between">
                      <span>Players Acquired ({roster.length})</span>
                      <span className="text-gold font-mono text-[10px]">Total: {tournament.currency}{team.spent_amount.toLocaleString()}</span>
                    </div>

                    {roster.length === 0 ? (
                      <div className="py-2.5 text-center text-[11px] text-text-muted bg-bg-subtle/40 rounded-xl border border-white/5">
                        No players acquired yet in auction
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                        {roster.map(item => (
                          <div key={item.id} className="p-1.5 rounded-lg bg-bg-subtle/80 border border-white/5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md overflow-hidden bg-bg-card border border-white/10 shrink-0">
                                <img 
                                  src={item.player?.photo_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80'} 
                                  alt={item.player?.name} 
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-text-primary text-xs">{item.player?.name || 'Player'}</span>
                                <span className="text-[10px] text-gold font-medium">({item.player?.role})</span>
                              </div>
                            </div>
                            <span className="font-display font-bold text-status-success text-xs">
                              {tournament.currency}{item.purchase_price.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <button
                    onClick={() => setInspectTeam(team)}
                    className="px-3 py-1.5 rounded-lg bg-bg-subtle hover:bg-gold/20 text-gold hover:text-white border border-gold/20 flex items-center gap-1.5 transition-colors font-medium"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Full Squad ({currentSquadCount})</span>
                  </button>

                  {isAdmin ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(team)}
                        className="p-1.5 rounded-lg bg-bg-subtle hover:bg-gold/20 text-text-secondary hover:text-gold transition-colors"
                        title="Edit Team"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(team.id)}
                        className="p-1.5 rounded-lg bg-bg-subtle hover:bg-status-danger/20 text-text-secondary hover:text-status-danger transition-colors"
                        title="Delete Team"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-text-muted font-medium">Franchise Active</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Team Modal with Photo Upload */}
      {isModalOpen && editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-main/80 backdrop-blur-md">
          <div className="relative max-w-lg w-full bg-bg-card border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h3 className="font-display font-bold text-lg text-white">
                {editingTeam.id && localTeams.some(t => t.id === editingTeam.id) ? 'Edit Team Franchise' : 'Create New Team'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-text-secondary font-semibold mb-1">Team Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Thunder Strikers"
                  value={editingTeam.name || ''}
                  onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-bg-subtle border border-white/10 text-white focus:outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary font-semibold mb-1">Short Name / Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TS"
                    value={editingTeam.short_name || ''}
                    onChange={(e) => setEditingTeam({ ...editingTeam, short_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-bg-subtle border border-white/10 text-white uppercase focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-text-secondary font-semibold mb-1">Owner / Manager Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Balasaheb Patil"
                    value={editingTeam.owner_name || ''}
                    onChange={(e) => setEditingTeam({ ...editingTeam, owner_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-bg-subtle border border-white/10 text-white focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              {/* Team Logo Photo Upload / URL */}
              <div>
                <label className="block text-text-secondary font-semibold mb-1">Team Logo Photo</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-bg-subtle border border-white/10 flex items-center justify-center shrink-0">
                    {editingTeam.logo_url ? (
                      <img src={editingTeam.logo_url} alt="Logo Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-6 h-6 text-text-muted" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-subtle hover:bg-gold/15 border border-white/10 hover:border-gold/30 text-text-secondary hover:text-gold cursor-pointer transition-colors text-xs font-semibold">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploading ? 'Uploading...' : 'Upload Logo Image'}</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
                    </label>

                    <input
                      type="url"
                      placeholder="Or paste direct image URL (https://...)"
                      value={editingTeam.logo_url || ''}
                      onChange={(e) => setEditingTeam({ ...editingTeam, logo_url: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-bg-subtle border border-white/10 text-text-primary text-[11px] focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary font-semibold mb-1">Initial Purse ({tournament.currency})</label>
                  <input
                    type="number"
                    value={editingTeam.initial_purse || 50000}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditingTeam({ 
                        ...editingTeam, 
                        initial_purse: val, 
                        remaining_purse: val - (editingTeam.spent_amount || 0) 
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-bg-subtle border border-white/10 text-white focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-text-secondary font-semibold mb-1">Max Squad Size</label>
                  <input
                    type="number"
                    value={editingTeam.max_squad_size || 15}
                    onChange={(e) => setEditingTeam({ ...editingTeam, max_squad_size: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-bg-subtle border border-white/10 text-white focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-gold font-medium">{saveStatus}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-bg-subtle text-text-muted hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-light text-bg-main font-bold font-display tracking-wider"
                  >
                    SAVE TEAM
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Roster Modal with Full Franchise Switcher */}
      <TeamRosterModal
        team={inspectTeam}
        teams={localTeams}
        squadPlayers={squadPlayers}
        currency={tournament.currency}
        onClose={() => setInspectTeam(null)}
        onSelectTeam={(t) => setInspectTeam(t)}
      />
    </div>
  );
};
