import React, { useState } from 'react';
import { Settings, Save, Plus, Trash2, CheckCircle2, RotateCcw } from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { IncrementRule } from '../types';

export const AuctionSettingsPage: React.FC = () => {
  const { tournament, updateTournamentSettings } = useAuction();

  const [name, setName] = useState(tournament.name);
  const [description, setDescription] = useState(tournament.description || '');
  const [totalPurse, setTotalPurse] = useState(tournament.total_purse);
  const [maxPlayers, setMaxPlayers] = useState(tournament.max_players_per_team);
  const [timerSeconds, setTimerSeconds] = useState(tournament.bid_timer_seconds);
  const [currency, setCurrency] = useState(tournament.currency);
  const [minBid, setMinBid] = useState(tournament.min_bid);
  const [rules, setRules] = useState<IncrementRule[]>(tournament.increment_rules || []);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAddRule = () => {
    setRules(prev => [...prev, { min: 1000, max: 9999999, step: 200 }]);
  };

  const handleRemoveRule = (index: number) => {
    setRules(prev => prev.filter((_, i) => i !== index));
  };

  const handleRuleChange = (index: number, field: keyof IncrementRule, val: number) => {
    setRules(prev => prev.map((r, i) => i === index ? { ...r, [field]: val } : r));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateTournamentSettings({
      name,
      description,
      total_purse: Number(totalPurse),
      max_players_per_team: Number(maxPlayers),
      bid_timer_seconds: Number(timerSeconds),
      currency,
      min_bid: Number(minBid),
      increment_rules: rules
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-white">
            Tournament Configuration
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Global tournament settings, purse rules, countdown timer, and dynamic bid increments
          </p>
        </div>

        {savedSuccess && (
          <div className="px-3.5 py-1.5 rounded-xl bg-status-success/15 border border-status-success/30 text-status-success text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Tournament Identity */}
        <div className="bg-bg-card border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-display font-bold text-gold uppercase tracking-wider">
            1. Tournament Identity & Branding
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-text-secondary font-semibold mb-1">
                Tournament Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Village Premier League 2026"
                className="w-full px-3 py-2 rounded-xl bg-bg-subtle border border-white/10 text-white focus:outline-none focus:border-gold"
              />
              <span className="text-[10px] text-text-muted mt-0.5 block">
                Can be renamed to any village or premier tournament
              </span>
            </div>

            <div>
              <label className="block text-text-secondary font-semibold mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                required
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="₹"
                className="w-full px-3 py-2 rounded-xl bg-bg-subtle border border-white/10 text-white font-mono focus:outline-none focus:border-gold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-text-secondary font-semibold mb-1">
                Tagline / Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Bid. Build. Battle."
                className="w-full px-3 py-2 rounded-xl bg-bg-subtle border border-white/10 text-white focus:outline-none focus:border-gold"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Purse & Squad Limits */}
        <div className="bg-bg-card border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-display font-bold text-gold uppercase tracking-wider">
            2. Franchise Purse & Squad Regulations
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-text-secondary font-semibold mb-1">
                Purse Per Franchise ({currency})
              </label>
              <input
                type="number"
                required
                value={totalPurse}
                onChange={(e) => setTotalPurse(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-bg-subtle border border-white/10 text-white font-display font-bold text-sm focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-text-secondary font-semibold mb-1">
                Max Players Per Squad
              </label>
              <input
                type="number"
                required
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-bg-subtle border border-white/10 text-white font-display font-bold text-sm focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-text-secondary font-semibold mb-1">
                Bid Timer Duration (Seconds)
              </label>
              <input
                type="number"
                required
                value={timerSeconds}
                onChange={(e) => setTimerSeconds(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-bg-subtle border border-white/10 text-white font-display font-bold text-sm focus:outline-none focus:border-gold"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Bid Increments Table */}
        <div className="bg-bg-card border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-display font-bold text-gold uppercase tracking-wider">
                3. Configurable Bid Increments
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Defines minimum bid jump required based on current price bracket
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddRule}
              className="px-3 py-1.5 rounded-lg bg-bg-subtle hover:bg-gold/15 text-gold text-xs font-semibold flex items-center gap-1 border border-gold/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Bracket
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-text-muted uppercase px-2">
              <div className="col-span-4">Bracket Min ({currency})</div>
              <div className="col-span-4">Bracket Max ({currency})</div>
              <div className="col-span-3">Increment Step ({currency})</div>
              <div className="col-span-1 text-center">Action</div>
            </div>

            {rules.map((rule, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-bg-subtle/80 p-2 rounded-xl border border-white/5">
                <div className="col-span-4">
                  <input
                    type="number"
                    value={rule.min}
                    onChange={(e) => handleRuleChange(idx, 'min', Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-bg-card border border-white/10 text-white font-mono focus:outline-none focus:border-gold"
                  />
                </div>

                <div className="col-span-4">
                  <input
                    type="number"
                    value={rule.max}
                    onChange={(e) => handleRuleChange(idx, 'max', Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-bg-card border border-white/10 text-white font-mono focus:outline-none focus:border-gold"
                  />
                </div>

                <div className="col-span-3">
                  <input
                    type="number"
                    value={rule.step}
                    onChange={(e) => handleRuleChange(idx, 'step', Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-bg-card border border-gold/30 text-gold font-mono font-bold focus:outline-none"
                  />
                </div>

                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveRule(idx)}
                    className="p-1 text-text-muted hover:text-status-danger transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-8 py-3 rounded-xl bg-gold hover:bg-gold-light text-bg-main font-display font-bold text-sm tracking-wide shadow-gold-glow flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            SAVE AUCTION CONFIGURATION
          </button>
        </div>
      </form>
    </div>
  );
};
