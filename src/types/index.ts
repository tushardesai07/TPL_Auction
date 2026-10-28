export type UserRole = 'admin' | 'auctioneer' | 'manager' | 'viewer';

export type PlayerRole = 'Icon Player' | 'Batsman' | 'Bowler' | 'All Rounder' | 'Wicket Keeper';

export type PlayerStatus = 'available' | 'active' | 'sold' | 'unsold';

export type AuctionStatus = 'waiting' | 'active' | 'paused' | 'sold' | 'unsold' | 'completed';

export interface IncrementRule {
  min: number;
  max: number;
  step: number;
}

export interface Tournament {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  total_purse: number;
  max_players_per_team: number;
  bid_timer_seconds: number;
  currency: string;
  min_bid: number;
  increment_rules: IncrementRule[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  tournament_id: string;
  name: string;
  short_name: string;
  logo_url?: string;
  owner_name?: string;
  owner_user_id?: string;
  initial_purse: number;
  remaining_purse: number;
  spent_amount: number;
  max_squad_size: number;
  squad_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  tournament_id: string;
  name: string;
  photo_url?: string;
  age?: number;
  village?: string;
  role: PlayerRole;
  is_icon?: boolean;
  batting_style?: string;
  bowling_style?: string;
  base_price: number;
  status: PlayerStatus;
  order_index: number;
  team_id?: string | null;
  sold_price?: number | null;
  sold_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuctionSession {
  id: string;
  tournament_id: string;
  status: AuctionStatus;
  current_player_id?: string | null;
  current_bid: number;
  highest_bid_team_id?: string | null;
  timer_started_at?: string | null;
  timer_seconds: number;
  round_number: number;
  last_bid_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Bid {
  id: string;
  auction_session_id: string;
  player_id: string;
  team_id: string;
  bidder_user_id?: string;
  amount: number;
  created_at: string;
  team?: Team;
  player?: Player;
}

export interface SquadPlayer {
  id: string;
  tournament_id: string;
  team_id: string;
  player_id: string;
  purchase_price: number;
  purchased_at: string;
  player?: Player;
  team?: Team;
}

export interface AuctionEvent {
  id: string;
  auction_session_id: string;
  event_type: 'auction_started' | 'auction_paused' | 'auction_resumed' | 'player_started' | 'bid_placed' | 'timer_updated' | 'player_sold' | 'player_unsold' | 'sale_undone' | 'auction_completed' | 'team_updated' | 'auction_message';
  message: string;
  team_id?: string | null;
  player_id?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  created_at: string;
}
