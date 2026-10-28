import { Tournament, Team, Player, AuctionSession } from '../types';

export const INITIAL_TOURNAMENT: Tournament = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Village Premier League 2026',
  slug: 'vpl-2026',
  description: 'Annual Grand Village Cricket Championship Auction. Bid. Build. Battle.',
  status: 'active',
  total_purse: 50000,
  max_players_per_team: 15,
  bid_timer_seconds: 15,
  currency: '₹',
  min_bid: 100,
  increment_rules: [
    { min: 0, max: 299, step: 25 },
    { min: 300, max: 499, step: 50 },
    { min: 500, max: 999, step: 100 },
    { min: 1000, max: 9999999, step: 200 }
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Clean empty teams - populated exclusively by you via UI or Supabase
export const INITIAL_TEAMS: Team[] = [];

// Clean empty players - populated exclusively by you via UI or Supabase
export const INITIAL_PLAYERS: Player[] = [];

export const INITIAL_AUCTION_SESSION: AuctionSession = {
  id: '44444444-4444-4444-4444-444444444444',
  tournament_id: INITIAL_TOURNAMENT.id,
  status: 'waiting',
  current_player_id: null,
  current_bid: 0,
  highest_bid_team_id: null,
  timer_started_at: null,
  timer_seconds: 15,
  round_number: 1,
  last_bid_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};
