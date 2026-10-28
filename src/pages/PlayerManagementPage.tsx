import React, { useState, useEffect } from 'react';
import { 
  User, Plus, Search, Filter, Download, Upload, 
  Edit2, Trash2, X, MapPin, Image, Shield, Zap, Sparkles, Check
} from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { useAuth } from '../context/AuthContext';
import { Player, PlayerRole } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  apiCreatePlayer, apiUpdatePlayer, apiDeletePlayer, 
  apiBatchCreatePlayers, uploadMedia, apiListBucketFiles 
} from '../services/auctionApi';

const CATEGORIES: { role: PlayerRole; label: string; icon: string; desc: string; badgeColor: string }[] = [
  { role: 'Icon Player', label: 'Icon Players', icon: '👑', desc: 'Marquee superstars & core village franchise anchors', badgeColor: 'border-amber-400/50 text-amber-300 bg-amber-400/15' },
  { role: 'Batsman', label: 'Batsmen', icon: '🏏', desc: 'Top order, openers & middle order anchors', badgeColor: 'border-blue-500/40 text-blue-400 bg-blue-500/10' },
  { role: 'Bowler', label: 'Bowlers', icon: '⚡', desc: 'Fast pacers, swing bowlers & spin maestros', badgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' },
  { role: 'All Rounder', label: 'All Rounders', icon: '🌟', desc: 'Dual-threat impact match winners', badgeColor: 'border-gold/40 text-gold bg-gold/10' },
  { role: 'Wicket Keeper', label: 'Wicket Keepers', icon: '🧤', desc: 'Glove specialists & explosive finishers', badgeColor: 'border-purple-500/40 text-purple-400 bg-purple-500/10' },
];

export const PlayerManagementPage: React.FC = () => {
  const { tournament, players, squadPlayers } = useAuction();
  const { role } = useAuth();
  const isAdmin = role === 'admin' || role === 'auctioneer';

  const [localPlayers, setLocalPlayers] = useState<Player[]>(players);

  // Keep local players reactive to changes in AuctionContext / Supabase realtime
  useEffect(() => {
    setLocalPlayers(players);
  }, [players]);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'order' | 'price-asc' | 'price-desc' | 'name'>('order');

  const [editingPlayer, setEditingPlayer] = useState<Partial<Player> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [bucketPhotos, setBucketPhotos] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Load photos from player-photos storage bucket
  const loadBucketPhotos = async () => {
    try {
      const urls = await apiListBucketFiles('player-photos');
      setBucketPhotos(urls);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadBucketPhotos();
  }, []);

  // Category counts
  const categoryCounts = {
    all: localPlayers.length,
    'Icon Player': localPlayers.filter(p => p.role === 'Icon Player' || p.is_icon).length,
    Batsman: localPlayers.filter(p => p.role === 'Batsman').length,
    Bowler: localPlayers.filter(p => p.role === 'Bowler').length,
    'All Rounder': localPlayers.filter(p => p.role === 'All Rounder').length,
    'Wicket Keeper': localPlayers.filter(p => p.role === 'Wicket Keeper').length,
  };

  // Filter & Sort logic
  const filteredPlayers = localPlayers
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          (p.village && p.village.toLowerCase().includes(search.toLowerCase()));
      const matchCategory = activeCategory === 'all' || p.role === activeCategory || (activeCategory === 'Icon Player' && p.is_icon);
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'price-desc') return b.base_price - a.base_price;
      if (sortBy === 'price-asc') return a.base_price - b.base_price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return a.order_index - b.order_index;
    });

  const handleOpenAdd = (defaultRole: PlayerRole = 'Batsman') => {
    setEditingPlayer({
      id: '',
      tournament_id: tournament.id,
      name: '',
      photo_url: '',
      age: 24,
      village: '',
      role: defaultRole,
      batting_style: 'Right Hand Bat (Top Order)',
      bowling_style: defaultRole === 'Bowler' ? 'Right Arm Fast' : 'None',
      base_price: 1000,
      status: 'available',
      order_index: localPlayers.length + 1
    });
    setUploadSuccessMsg(null);
    setIsModalOpen(true);
    loadBucketPhotos();
  };

  const handleOpenEdit = (player: Player) => {
    setEditingPlayer({ ...player });
    setUploadSuccessMsg(null);
    setIsModalOpen(true);
    loadBucketPhotos();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPlayer) return;

    try {
      setIsUploadingPhoto(true);
      setUploadSuccessMsg(null);
      const res = await uploadMedia(file, 'player-photos');
      if (res.error) {
        alert('Photo upload failed: ' + res.error);
        return;
      }
      if (res.url) {
        setEditingPlayer(prev => prev ? ({ ...prev, photo_url: res.url }) : null);
        setBucketPhotos(prev => [res.url!, ...prev.filter(u => u !== res.url)]);
        setUploadSuccessMsg('Photo uploaded and stored in Supabase bucket!');
      }
    } catch (err: any) {
      alert(err.message || 'Photo upload failed');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer || !editingPlayer.name) return;

    const chosenRole = editingPlayer.role || 'Batsman';
    setSaveStatus('Saving player...');

    try {
      if (editingPlayer.id && localPlayers.some(p => p.id === editingPlayer.id)) {
        // Update
        const res = await apiUpdatePlayer(editingPlayer.id, editingPlayer);
        if (res.error) {
          alert('Failed to update player: ' + res.error);
          setSaveStatus(null);
          return;
        }
        setLocalPlayers(prev => prev.map(p => p.id === editingPlayer.id ? { ...p, ...editingPlayer } as Player : p));
      } else {
        // Create
        const res = await apiCreatePlayer({
          tournament_id: tournament.id,
          name: editingPlayer.name!,
          photo_url: editingPlayer.photo_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
          age: editingPlayer.age || 24,
          village: editingPlayer.village || 'Local',
          role: chosenRole,
          batting_style: editingPlayer.batting_style || 'Right Hand',
          bowling_style: editingPlayer.bowling_style || 'None',
          base_price: editingPlayer.base_price || 1000,
          status: 'available',
          order_index: editingPlayer.order_index || (localPlayers.length + 1)
        });

        if (res.error) {
          alert('Failed to create player: ' + res.error);
          setSaveStatus(null);
          return;
        }

        if (res.data) {
          setLocalPlayers(prev => [...prev, res.data!]);
        }
      }

      // Automatically switch to the category of the added player so user immediately sees them!
      if (activeCategory !== 'all' && activeCategory !== chosenRole) {
        setActiveCategory(chosenRole);
      }

      setSaveStatus('Saved!');
      setTimeout(() => {
        setIsModalOpen(false);
        setEditingPlayer(null);
        setSaveStatus(null);
      }, 500);
    } catch (err: any) {
      alert(err.message || 'Failed to save player');
      setSaveStatus(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this player from auction database?')) {
      await apiDeletePlayer(id);
      setLocalPlayers(prev => prev.filter(p => p.id !== id));
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Order', 'Name', 'Category/Role', 'Age', 'Village', 'Base Price', 'Status', 'Batting', 'Bowling'];
    const rows = filteredPlayers.map(p => [
      p.order_index,
      `"${p.name}"`,
      p.role,
      p.age || '',
      `"${p.village || ''}"`,
      p.base_price,
      p.status,
      `"${p.batting_style || ''}"`,
      `"${p.bowling_style || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VPL_2026_Players_${activeCategory}_Category.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Bulk Import with API persistence
  const handleBulkImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      if (lines.length <= 1) return;

      const newBatch: Omit<Player, 'id' | 'created_at' | 'updated_at'>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(s => s.replace(/"/g, '').trim());
        if (parts[1]) {
          const rawRole = parts[2] || 'Batsman';
          const validRole: PlayerRole = 
            rawRole.toLowerCase().includes('bowl') ? 'Bowler' :
            rawRole.toLowerCase().includes('round') ? 'All Rounder' :
            rawRole.toLowerCase().includes('keep') ? 'Wicket Keeper' : 'Batsman';

          newBatch.push({
            tournament_id: tournament.id,
            order_index: Number(parts[0]) || (localPlayers.length + i),
            name: parts[1],
            role: validRole,
            age: Number(parts[3]) || 25,
            village: parts[4] || 'Local',
            base_price: Number(parts[5]) || 1000,
            status: 'available',
            batting_style: parts[7] || 'Right Hand',
            bowling_style: parts[8] || (validRole === 'Bowler' ? 'Right Arm Fast' : 'None'),
            photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'
          });
        }
      }

      await apiBatchCreatePlayers(newBatch);
      const mapped = newBatch.map((p, idx) => ({
        ...p,
        id: `imp-${Date.now()}-${idx}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      setLocalPlayers(prev => [...prev, ...mapped]);
      alert(`Successfully imported ${newBatch.length} players categorized into Batsmen, Bowlers, All Rounders & Keepers!`);
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-gold mb-1">
            CRICKETER ROSTER BY CATEGORY
          </div>
          <h1 className="text-3xl font-display font-extrabold text-white">
            Player Registry & Categorization
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Total {localPlayers.length} registered cricketers divided into 4 official IPL-style category sets
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <label className="px-3.5 py-2 rounded-xl bg-bg-card hover:bg-bg-subtle text-text-secondary hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
              <input type="file" accept=".csv" onChange={handleBulkImportCSV} className="hidden" />
            </label>
          )}

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-bg-card hover:bg-bg-subtle text-text-secondary hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {isAdmin ? (
            <button
              onClick={() => handleOpenAdd(activeCategory !== 'all' ? (activeCategory as PlayerRole) : 'Batsman')}
              className="px-4 py-2 rounded-xl bg-gold hover:bg-gold-light text-bg-main font-display font-bold text-xs tracking-wider flex items-center gap-2 shadow-gold-glow transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              ADD PLAYER
            </button>
          ) : (
            <span className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-text-muted text-xs font-semibold">
              Registry • Public View
            </span>
          )}
        </div>
      </div>

      {/* 5 PROMINENT CATEGORY TABS + ALL */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setActiveCategory('all')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeCategory === 'all'
              ? 'bg-gold/15 border-gold/50 shadow-gold-glow'
              : 'bg-bg-card border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-lg">🏏</span>
            <span className="text-xs font-mono font-bold text-text-muted">{categoryCounts.all}</span>
          </div>
          <div className="font-display font-bold text-sm text-white mt-1">All Categories</div>
          <div className="text-[11px] text-text-muted">Complete player pool</div>
        </button>

        {CATEGORIES.map(cat => (
          <button
            key={cat.role}
            onClick={() => setActiveCategory(cat.role)}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              activeCategory === cat.role
                ? `${cat.badgeColor} border-opacity-100 shadow-md font-bold`
                : 'bg-bg-card border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg">{cat.icon}</span>
              <span className="text-xs font-mono font-bold text-white">
                {categoryCounts[cat.role]}
              </span>
            </div>
            <div className="font-display font-bold text-sm text-white mt-1">
              {cat.label}
            </div>
            <div className="text-[11px] text-text-muted truncate">
              {cat.desc.slice(0, 24)}...
            </div>
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-bg-card border border-white/10 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-lg">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by player name or village..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-bg-subtle border border-white/10 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-bg-subtle border border-white/10 text-xs text-text-primary focus:outline-none focus:border-gold"
        >
          <option value="all">All Statuses (Available, Active, Sold, Unsold)</option>
          <option value="available">Available in Pool</option>
          <option value="active">Active On Block</option>
          <option value="sold">Sold to Franchise</option>
          <option value="unsold">Marked Unsold</option>
        </select>

        {/* Sorting */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 rounded-xl bg-bg-subtle border border-white/10 text-xs text-text-primary focus:outline-none focus:border-gold"
        >
          <option value="order">Sort: Auction Lot Order</option>
          <option value="price-desc">Sort: Highest Base Price</option>
          <option value="price-asc">Sort: Lowest Base Price</option>
          <option value="name">Sort: Name (A-Z)</option>
        </select>
      </div>

      {/* Players Table */}
      <div className="bg-bg-card border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-bg-subtle/60 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                <th className="py-3 px-4">Lot</th>
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Village</th>
                <th className="py-3 px-4">Styles</th>
                <th className="py-3 px-4 text-right font-display">Base Price</th>
                <th className="py-3 px-4 text-center">Status</th>
                {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-12 text-center text-text-muted">
                    {isAdmin
                      ? 'No players found in this category. Click "+ ADD PLAYER" to register cricketers in this set.'
                      : 'No players registered yet in this category.'}
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player) => (
                  <tr key={player.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gold">
                      #{player.order_index}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-bg-subtle border border-white/10 shrink-0">
                          <img
                            src={player.photo_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80'}
                            alt={player.name}
                            onError={(e) => { 
                              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80'; 
                            }}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-text-primary text-sm flex items-center gap-1.5">
                            {player.name}
                            {player.role === 'Icon Player' && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40">
                                👑 ICON
                              </span>
                            )}
                          </div>
                          {player.age && (
                            <div className="text-[11px] text-text-muted">
                              Age: {player.age} yrs
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-semibold">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] border font-bold ${
                        player.role === 'Icon Player' ? 'bg-amber-400/15 border-amber-400/50 text-amber-300 shadow-sm' :
                        player.role === 'Batsman' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                        player.role === 'Bowler' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                        player.role === 'All Rounder' ? 'bg-gold/10 border-gold/30 text-gold' :
                        'bg-purple-500/10 border-purple-500/30 text-purple-400'
                      }`}>
                        {player.role === 'Icon Player' && '👑 '}
                        {player.role === 'Batsman' && '🏏 '}
                        {player.role === 'Bowler' && '⚡ '}
                        {player.role === 'All Rounder' && '🌟 '}
                        {player.role === 'Wicket Keeper' && '🧤 '}
                        {player.role}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-text-secondary">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gold" />
                        {player.village || 'Local'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-[11px] text-text-muted">
                      <div>Bat: {player.batting_style || 'RHB'}</div>
                      <div>Bowl: {player.bowling_style || 'None'}</div>
                    </td>

                    <td className="py-3 px-4 text-right font-display font-bold text-text-primary text-sm">
                      {tournament.currency}{player.base_price.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <StatusBadge status={player.status} size="sm" />
                        {(() => {
                          const squad = squadPlayers.find(sp => sp.player_id === player.id);
                          if (squad && squad.team) {
                            return (
                              <span className="text-[10px] font-bold text-status-success bg-status-success/10 border border-status-success/30 px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap" title={`Sold to ${squad.team.name} for ${tournament.currency}${squad.purchase_price.toLocaleString()}`}>
                                🏆 {squad.team.short_name} • {tournament.currency}{squad.purchase_price.toLocaleString()}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </td>

                    {isAdmin && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(player)}
                            className="p-1.5 rounded-lg bg-bg-subtle hover:bg-gold/20 text-text-secondary hover:text-gold transition-colors"
                            title="Edit Player"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(player.id)}
                            className="p-1.5 rounded-lg bg-bg-subtle hover:bg-status-danger/20 text-text-secondary hover:text-status-danger transition-colors"
                            title="Delete Player"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Player Modal with PROMINENT CATEGORY SELECTION */}
      {isModalOpen && editingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-main/80 backdrop-blur-md">
          <div className="relative max-w-xl w-full bg-bg-card border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-white">
                  {editingPlayer.id && localPlayers.some(p => p.id === editingPlayer.id) ? 'Edit Cricketer Profile' : 'Register Cricketer'}
                </h3>
                <p className="text-xs text-text-muted">
                  Specify category, photo, village, base price, and play style
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* STEP 1: PROMINENT CATEGORY SELECTOR */}
              <div>
                <label className="block text-text-secondary font-bold uppercase tracking-wider mb-2">
                  1. SELECT PLAYER CATEGORY / ROLE *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {CATEGORIES.map(cat => {
                    const isSelected = editingPlayer.role === cat.role;
                    return (
                      <button
                        type="button"
                        key={cat.role}
                        onClick={() => setEditingPlayer(prev => prev ? ({ 
                          ...prev, 
                          role: cat.role,
                          bowling_style: cat.role === 'Bowler' ? (prev.bowling_style && prev.bowling_style !== 'None' ? prev.bowling_style : 'Right Arm Fast') : cat.role === 'All Rounder' ? 'Right Arm Med' : 'None'
                        }) : null)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-gold/20 border-gold shadow-gold-glow text-white font-bold'
                            : 'bg-bg-subtle border-white/10 text-text-secondary hover:border-white/20'
                        }`}
                      >
                        <div className="text-xl mb-1">{cat.icon}</div>
                        <div className="text-xs font-display">{cat.role}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Player Name */}
              <div>
                <label className="block text-text-secondary font-semibold mb-1">
                  2. Full Player Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jasprit Jadhav"
                  value={editingPlayer.name || ''}
                  onChange={(e) => setEditingPlayer(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                  className="w-full px-3 py-2 rounded-xl bg-bg-subtle border border-white/10 text-white text-sm focus:outline-none focus:border-gold font-medium"
                />
              </div>

              {/* Photo Upload or Bucket Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-text-secondary font-semibold">
                    3. Player Photo (Supabase Storage Bucket)
                  </label>
                  {editingPlayer.photo_url && (
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Photo linked
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-bg-subtle border border-white/10 flex items-center justify-center shrink-0 relative group">
                    {editingPlayer.photo_url ? (
                      <img 
                        src={editingPlayer.photo_url} 
                        alt="Player Preview" 
                        onError={(e) => { 
                          (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80'; 
                        }}
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <Image className="w-6 h-6 text-text-muted" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-subtle hover:bg-gold/15 border border-white/10 hover:border-gold/30 text-text-secondary hover:text-gold cursor-pointer transition-colors text-xs font-semibold">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploadingPhoto ? 'Uploading to Bucket...' : 'Upload Image from Computer'}</span>
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={isUploadingPhoto} />
                      </label>

                      {uploadSuccessMsg && (
                        <span className="text-[11px] text-emerald-400 font-medium truncate">
                          {uploadSuccessMsg}
                        </span>
                      )}
                    </div>

                    <input
                      type="url"
                      placeholder="Or paste direct image URL (https://...)"
                      value={editingPlayer.photo_url || ''}
                      onChange={(e) => setEditingPlayer(prev => prev ? ({ ...prev, photo_url: e.target.value }) : null)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-bg-subtle border border-white/10 text-text-primary text-[11px] focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>

                {/* Bucket Photos Quick Select Gallery */}
                {bucketPhotos.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between text-[11px] text-text-muted mb-1.5">
                      <span>Available photos stored in bucket ({bucketPhotos.length}):</span>
                      <button 
                        type="button" 
                        onClick={loadBucketPhotos}
                        className="text-gold hover:underline text-[10px]"
                      >
                        Refresh Bucket
                      </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {bucketPhotos.map((url, idx) => {
                        const isCurrent = editingPlayer.photo_url === url;
                        return (
                          <button
                            type="button"
                            key={url}
                            onClick={() => {
                              setEditingPlayer(prev => prev ? ({ ...prev, photo_url: url }) : null);
                              setUploadSuccessMsg('Selected from bucket!');
                            }}
                            className={`w-11 h-11 rounded-lg overflow-hidden border shrink-0 transition-all ${
                              isCurrent 
                                ? 'border-gold ring-2 ring-gold/50 scale-105' 
                                : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
                            }`}
                            title={`Bucket photo #${idx + 1}`}
                          >
                            <img src={url} alt={`Bucket #${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-text-secondary font-semibold mb-1">Village / City</label>
                  <input
                    type="text"
                    placeholder="e.g. Village or City"
                    value={editingPlayer.village || ''}
                    onChange={(e) => setEditingPlayer(prev => prev ? ({ ...prev, village: e.target.value }) : null)}
                    className="w-full px-3 py-2 rounded-xl bg-bg-subtle border border-white/10 text-white focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-text-secondary font-semibold mb-1">Age</label>
                  <input
                    type="number"
                    value={editingPlayer.age || 24}
                    onChange={(e) => setEditingPlayer(prev => prev ? ({ ...prev, age: Number(e.target.value) }) : null)}
                    className="w-full px-3 py-2 rounded-xl bg-bg-subtle border border-white/10 text-white focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-text-secondary font-semibold mb-1">Base Price ({tournament.currency})</label>
                  <input
                    type="number"
                    value={editingPlayer.base_price || 1000}
                    onChange={(e) => setEditingPlayer(prev => prev ? ({ ...prev, base_price: Number(e.target.value) }) : null)}
                    className="w-full px-3 py-2 rounded-xl bg-bg-subtle border border-white/10 text-white font-display font-bold focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              {/* Styles */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary font-semibold mb-1">Batting Style</label>
                  <input
                    type="text"
                    placeholder="Right Hand (Opener / Middle order)"
                    value={editingPlayer.batting_style || ''}
                    onChange={(e) => setEditingPlayer(prev => prev ? ({ ...prev, batting_style: e.target.value }) : null)}
                    className="w-full px-3 py-2 rounded-xl bg-bg-subtle border border-white/10 text-white focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-text-secondary font-semibold mb-1">Bowling Style</label>
                  <input
                    type="text"
                    placeholder={editingPlayer.role === 'Bowler' ? 'Right Arm Fast / Leg Break' : 'None / Part-time'}
                    value={editingPlayer.bowling_style || ''}
                    onChange={(e) => setEditingPlayer(prev => prev ? ({ ...prev, bowling_style: e.target.value }) : null)}
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
                    disabled={isUploadingPhoto}
                    className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-light text-bg-main font-bold font-display tracking-wider disabled:opacity-50 transition-all shadow-gold-glow"
                  >
                    {isUploadingPhoto ? 'UPLOADING PHOTO...' : (editingPlayer.id ? 'UPDATE CRICKETER' : 'REGISTER CRICKETER')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
