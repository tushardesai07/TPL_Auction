import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { sound } from '../lib/audio';
import { 
  Tournament, Team, Player, AuctionSession, Bid, AuctionEvent, SquadPlayer 
} from '../types';
import { 
  INITIAL_TOURNAMENT, INITIAL_TEAMS, INITIAL_PLAYERS, INITIAL_AUCTION_SESSION 
} from '../lib/mockData';

interface SoldOverlayData {
  playerName: string;
  playerRole: string;
  playerPhoto?: string;
  teamName: string;
  teamShortName: string;
  teamLogo?: string;
  price: number;
  currency: string;
  remainingPurse?: number;
  spentAmount?: number;
  squadCount?: number;
  maxSquadSize?: number;
}

interface AuctionContextType {
  tournament: Tournament;
  teams: Team[];
  players: Player[];
  session: AuctionSession;
  currentPlayer: Player | null;
  highestBidTeam: Team | null;
  recentBids: Bid[];
  events: AuctionEvent[];
  squadPlayers: SquadPlayer[];
  remainingTime: number;
  connectionStatus: 'connected' | 'reconnecting' | 'demo';
  soldOverlay: SoldOverlayData | null;
  closeSoldOverlay: () => void;
  unsoldOverlay: { playerName: string } | null;
  closeUnsoldOverlay: () => void;
  // Authoritative actions
  placeBid: (teamId: string, customAmount?: number) => Promise<{ success: boolean; error?: string }>;
  startNextPlayer: (playerId?: string) => Promise<{ success: boolean; error?: string }>;
  markSold: () => Promise<{ success: boolean; error?: string }>;
  markUnsold: () => Promise<{ success: boolean; error?: string }>;
  pauseAuction: () => Promise<{ success: boolean; error?: string }>;
  resumeAuction: () => Promise<{ success: boolean; error?: string }>;
  undoLastSale: () => Promise<{ success: boolean; error?: string }>;
  resetAuction: () => Promise<void>;
  clearAllData: () => Promise<void>;
  updateTournamentSettings: (settings: Partial<Tournament>) => Promise<void>;
  calculateNextBid: (currentBid: number, basePrice: number) => number;
}

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

export const AuctionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tournament, setTournament] = useState<Tournament>(INITIAL_TOURNAMENT);
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [session, setSession] = useState<AuctionSession>(INITIAL_AUCTION_SESSION);
  const [recentBids, setRecentBids] = useState<Bid[]>([]);
  const [events, setEvents] = useState<AuctionEvent[]>([]);
  const [squadPlayers, setSquadPlayers] = useState<SquadPlayer[]>([]);
  const [remainingTime, setRemainingTime] = useState<number>(15);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'demo'>(
    isSupabaseConfigured ? 'reconnecting' : 'demo'
  );
  const [soldOverlay, setSoldOverlay] = useState<SoldOverlayData | null>(null);
  const [unsoldOverlay, setUnsoldOverlay] = useState<{ playerName: string } | null>(null);

  const timerRef = useRef<number | null>(null);
  const soundTickRef = useRef<number>(15);

  // Helper to compute next minimum bid from rules
  const calculateNextBid = useCallback((currentBid: number, basePrice: number): number => {
    if (currentBid <= 0) return basePrice;
    const rules = tournament.increment_rules || INITIAL_TOURNAMENT.increment_rules;
    const match = rules.find(r => currentBid >= r.min && currentBid <= r.max);
    const step = match ? match.step : 100;
    return currentBid + step;
  }, [tournament.increment_rules]);

  // Derived current entities
  const currentPlayer = players.find(p => p.id === session.current_player_id) || null;
  const highestBidTeam = teams.find(t => t.id === session.highest_bid_team_id) || null;

  // 1. Initial Load & Supabase Subscription
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setConnectionStatus('demo');
      return;
    }

    const fetchAuthoritativeData = async () => {
      try {
        setConnectionStatus('reconnecting');
        const [
          { data: tourData },
          { data: teamData },
          { data: playerData },
          { data: sessionData },
          { data: bidData },
          { data: eventData },
          { data: squadData }
        ] = await Promise.all([
          supabase.from('tournaments').select('*').limit(1).maybeSingle(),
          supabase.from('teams').select('*').order('name'),
          supabase.from('players').select('*').order('order_index'),
          supabase.from('auction_sessions').select('*').limit(1).maybeSingle(),
          supabase.from('bids').select('*, team:teams(*), player:players(*)').order('created_at', { ascending: false }).limit(25),
          supabase.from('auction_events').select('*').order('created_at', { ascending: false }).limit(30),
          supabase.from('squad_players').select('*, player:players(*), team:teams(*)')
        ]);

        if (tourData) setTournament(tourData as Tournament);
        if (teamData) setTeams(teamData as Team[]);
        if (playerData) setPlayers(playerData as Player[]);
        if (sessionData) setSession(sessionData as AuctionSession);
        if (bidData) setRecentBids(bidData as Bid[]);
        if (eventData) setEvents(eventData as AuctionEvent[]);
        if (squadData) setSquadPlayers(squadData as SquadPlayer[]);

        setConnectionStatus('connected');
      } catch (err) {
        console.warn('Could not sync with Supabase, running in offline fallback mode:', err);
        setConnectionStatus('demo');
      }
    };

    fetchAuthoritativeData();

    // Setup Supabase Realtime Channels
    const channel = supabase.channel('auction_room', {
      config: { broadcast: { self: true } }
    });

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction_sessions' }, payload => {
        if (payload.new) {
          const newSession = payload.new as AuctionSession;
          setSession(newSession);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids' }, payload => {
        if (payload.new) {
          const newBid = payload.new as Bid;
          setRecentBids(prev => [newBid, ...prev.slice(0, 30)]);
          sound.playBidChime();
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'auction_events' }, payload => {
        if (payload.new) {
          const newEvent = payload.new as AuctionEvent;
          setEvents(prev => [newEvent, ...prev.slice(0, 40)]);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        supabase.from('teams').select('*').then(({ data }) => data && setTeams(data as Team[]));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
        supabase.from('players').select('*').then(({ data }) => data && setPlayers(data as Player[]));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'squad_players' }, () => {
        supabase.from('squad_players').select('*, player:players(*), team:teams(*)').then(({ data }) => data && setSquadPlayers(data as SquadPlayer[]));
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setConnectionStatus('reconnecting');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 2. Authoritative Timer Loop
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (session.status !== 'active' || !session.timer_started_at) {
      setRemainingTime(session.timer_seconds || tournament.bid_timer_seconds);
      return;
    }

    const timerStarted = new Date(session.timer_started_at).getTime();
    const duration = session.timer_seconds || tournament.bid_timer_seconds;

    const tick = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - timerStarted) / 1000);
      const remaining = Math.max(0, duration - elapsed);

      setRemainingTime(remaining);

      // Play audio ticks during final 5 seconds
      if (remaining <= 5 && remaining > 0 && soundTickRef.current !== remaining) {
        soundTickRef.current = remaining;
        sound.playTick(remaining <= 2);
      }

      // Timer expired!
      if (remaining === 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        handleTimerExpiration();
      }
    };

    tick();
    timerRef.current = window.setInterval(tick, 250);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session.status, session.timer_started_at, session.timer_seconds, tournament.bid_timer_seconds]);

  // Handle timer reaching 0
  const handleTimerExpiration = useCallback(async () => {
    if (session.status !== 'active') return;

    if (session.highest_bid_team_id && session.current_bid > 0) {
      await markSold();
    } else {
      await markUnsold();
    }
  }, [session.status, session.highest_bid_team_id, session.current_bid]);

  // Trigger Sold Celebration
  const triggerSoldCelebration = (
    team: Team, 
    player: Player, 
    price: number, 
    updatedRemaining?: number, 
    updatedSpent?: number, 
    newSquadCount?: number
  ) => {
    sound.playSoldFanfare();
    confetti({
      particleCount: 120,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#D6B36A', '#F5E2B3', '#32D583', '#FFFFFF']
    });

    setSoldOverlay({
      playerName: player.name,
      playerRole: player.role,
      playerPhoto: player.photo_url,
      teamName: team.name,
      teamShortName: team.short_name,
      teamLogo: team.logo_url,
      price,
      currency: tournament.currency,
      remainingPurse: updatedRemaining !== undefined ? updatedRemaining : (team.remaining_purse - price),
      spentAmount: updatedSpent !== undefined ? updatedSpent : (team.spent_amount + price),
      squadCount: newSquadCount !== undefined ? newSquadCount : ((team.squad_count || 0) + 1),
      maxSquadSize: team.max_squad_size,
    });
  };

  const closeSoldOverlay = () => setSoldOverlay(null);
  const closeUnsoldOverlay = () => setUnsoldOverlay(null);

  // Authoritative Action: Place Bid
  const placeBid = async (teamId: string, customAmount?: number): Promise<{ success: boolean; error?: string }> => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return { success: false, error: 'Team not found' };

    if (session.status !== 'active' || !currentPlayer) {
      return { success: false, error: 'Auction is not active or no player is on the block' };
    }

    if (currentPlayer.status === 'sold') {
      return { success: false, error: 'This player has already been SOLD. No more bids allowed.' };
    }

    if (session.highest_bid_team_id === teamId) {
      return { success: false, error: 'Your team currently holds the highest bid' };
    }

    const nextMin = calculateNextBid(session.current_bid, currentPlayer.base_price);
    const bidAmount = customAmount !== undefined ? customAmount : nextMin;

    if (bidAmount < nextMin) {
      return { success: false, error: `Minimum bid allowed is ${tournament.currency}${nextMin.toLocaleString()}` };
    }

    // Squad size limit check
    const currentSquadCount = squadPlayers.filter(sp => sp.team_id === teamId).length;
    if (currentSquadCount >= team.max_squad_size) {
      return { success: false, error: `Team squad limit of ${team.max_squad_size} reached` };
    }

    // Purse reservation check
    const remainingSlotsNeeded = team.max_squad_size - currentSquadCount - 1;
    const requiredReserve = remainingSlotsNeeded * tournament.min_bid;
    if ((team.remaining_purse - bidAmount) < requiredReserve) {
      return { 
        success: false, 
        error: `Insufficient purse. Must keep ${tournament.currency}${requiredReserve} for remaining ${remainingSlotsNeeded} slots` 
      };
    }

    const nowIso = new Date().toISOString();
    const previousHighestTeam = highestBidTeam;
    const isOutbid = previousHighestTeam && previousHighestTeam.id !== teamId;

    const eventMessage = isOutbid
      ? `⚔️ ${team.name} (${team.short_name}) OUTBID ${previousHighestTeam.name} with ${tournament.currency}${bidAmount.toLocaleString()}!`
      : `⚡ ${team.name} placed opening bid of ${tournament.currency}${bidAmount.toLocaleString()}`;

    // 1. Instant Optimistic Local State Update
    const newBid: Bid = {
      id: `bid-${Date.now()}`,
      auction_session_id: session.id,
      player_id: currentPlayer.id,
      team_id: teamId,
      amount: bidAmount,
      created_at: nowIso,
      team,
      player: currentPlayer,
    };

    setRecentBids(prev => [newBid, ...prev.slice(0, 30)]);
    setSession(prev => ({
      ...prev,
      current_bid: bidAmount,
      highest_bid_team_id: teamId,
      timer_started_at: nowIso,
      timer_seconds: tournament.bid_timer_seconds,
      last_bid_at: nowIso,
    }));

    const event: AuctionEvent = {
      id: `evt-${Date.now()}`,
      auction_session_id: session.id,
      event_type: 'bid_placed',
      message: eventMessage,
      team_id: teamId,
      player_id: currentPlayer.id,
      created_at: nowIso,
    };
    setEvents(prev => [event, ...prev.slice(0, 40)]);
    sound.playBidChime();

    // 2. Persist to Supabase
    if (isSupabaseConfigured) {
      try {
        const { error: rpcError } = await supabase.rpc('place_bid', {
          p_auction_session_id: session.id,
          p_team_id: teamId,
          p_bid_amount: bidAmount
        });

        if (rpcError) {
          console.warn('Supabase place_bid RPC error, updating tables directly:', rpcError);
          await Promise.all([
            supabase.from('auction_sessions').update({
              current_bid: bidAmount,
              highest_bid_team_id: teamId,
              timer_started_at: nowIso,
              last_bid_at: nowIso,
              updated_at: nowIso
            }).eq('id', session.id),
            supabase.from('bids').insert([{
              auction_session_id: session.id,
              player_id: currentPlayer.id,
              team_id: teamId,
              amount: bidAmount
            }]),
            supabase.from('auction_events').insert([{
              auction_session_id: session.id,
              event_type: 'bid_placed',
              message: eventMessage,
              team_id: teamId,
              player_id: currentPlayer.id
            }])
          ]);
        }
      } catch (err: any) {
        console.warn('Supabase place_bid error:', err);
      }
    }

    return { success: true };
  };

  // Authoritative Action: Start Next Player
  const startNextPlayer = async (playerId?: string): Promise<{ success: boolean; error?: string }> => {
    // Gather all sold player IDs from local players list and squad_players
    const soldPlayerIds = new Set<string>([
      ...players.filter(p => p.status === 'sold').map(p => p.id),
      ...squadPlayers.map(sp => sp.player_id)
    ]);

    let targetPlayer: Player | undefined;

    if (playerId) {
      if (soldPlayerIds.has(playerId)) {
        return { 
          success: false, 
          error: 'This player has already been SOLD to a team and cannot be auctioned again.' 
        };
      }
      targetPlayer = players.find(p => p.id === playerId);
      if (!targetPlayer) {
        return { success: false, error: 'Player not found in tournament pool' };
      }
      if (targetPlayer.status === 'sold') {
        return { 
          success: false, 
          error: `${targetPlayer.name} has already been SOLD and cannot be re-auctioned.` 
        };
      }
    } else {
      // Pick next available player in sequence (strictly excluding sold players)
      targetPlayer = players.find(p => p.status === 'available' && !soldPlayerIds.has(p.id));
      
      // If all available players completed, check unsold players (second chance round)
      if (!targetPlayer) {
        targetPlayer = players.find(p => p.status === 'unsold' && !soldPlayerIds.has(p.id));
      }
    }

    if (!targetPlayer) {
      return { 
        success: false, 
        error: 'No more available players in auction pool. All registered players are either sold or completed.' 
      };
    }

    // Absolute guard against sold players
    if (targetPlayer.status === 'sold' || soldPlayerIds.has(targetPlayer.id)) {
      return { 
        success: false, 
        error: `${targetPlayer.name} has already been SOLD to a team and cannot be re-auctioned.` 
      };
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('start_player_auction', {
          p_auction_session_id: session.id,
          p_player_id: targetPlayer.id
        });
        if (error) return { success: false, error: error.message };
        if (data && !data.success) return { success: false, error: data.error };
        return { success: true };
      } catch (err: any) {
        console.warn('Supabase start_player_auction RPC failed, using local fallback:', err);
      }
    }

    const nowIso = new Date().toISOString();
    setPlayers(prev => prev.map(p => p.id === targetPlayer!.id ? { ...p, status: 'active' } : p));
    setSession(prev => ({
      ...prev,
      current_player_id: targetPlayer!.id,
      current_bid: 0,
      highest_bid_team_id: null,
      status: 'active',
      timer_started_at: nowIso,
      timer_seconds: tournament.bid_timer_seconds,
      last_bid_at: nowIso,
    }));

    const event: AuctionEvent = {
      id: `evt-${Date.now()}`,
      auction_session_id: session.id,
      event_type: 'player_started',
      message: `${targetPlayer.name} is now ON THE BLOCK (Base: ${tournament.currency}${targetPlayer.base_price})`,
      player_id: targetPlayer.id,
      created_at: nowIso,
    };
    setEvents(prev => [event, ...prev.slice(0, 40)]);

    return { success: true };
  };

  // Authoritative Action: Mark Sold
  const markSold = async (): Promise<{ success: boolean; error?: string }> => {
    if (!currentPlayer || !highestBidTeam || session.current_bid <= 0) {
      return { success: false, error: 'Cannot mark sold without an active player and a valid bid' };
    }

    if (session.status === 'sold' || currentPlayer.status === 'sold') {
      return { success: false, error: 'This player is already marked as SOLD' };
    }

    const soldPrice = session.current_bid;
    const soldPlayer = currentPlayer;
    const winningTeam = highestBidTeam;
    const nowIso = new Date().toISOString();

    const newRemainingPurse = winningTeam.remaining_purse - soldPrice;
    const newSpentAmount = winningTeam.spent_amount + soldPrice;
    const currentSquadCount = squadPlayers.filter(sp => sp.team_id === winningTeam.id).length;
    const newSquadCount = currentSquadCount + 1;

    // 1. Instant Optimistic State Updates (decreases money immediately!)
    setTeams(prev => prev.map(t => {
      if (t.id === winningTeam.id) {
        return {
          ...t,
          remaining_purse: newRemainingPurse,
          spent_amount: newSpentAmount,
          squad_count: newSquadCount,
        };
      }
      return t;
    }));

    // Mark player sold with team ownership & price
    setPlayers(prev => prev.map(p => p.id === soldPlayer.id ? { 
      ...p, 
      status: 'sold',
      team_id: winningTeam.id,
      sold_price: soldPrice,
      sold_at: nowIso
    } : p));

    // Record squad player with complete player & team snapshot
    const squadEntry: SquadPlayer = {
      id: `squad-${Date.now()}`,
      tournament_id: tournament.id,
      team_id: winningTeam.id,
      player_id: soldPlayer.id,
      purchase_price: soldPrice,
      purchased_at: nowIso,
      player: {
        ...soldPlayer,
        status: 'sold',
        team_id: winningTeam.id,
        sold_price: soldPrice,
        sold_at: nowIso
      },
      team: {
        ...winningTeam,
        remaining_purse: newRemainingPurse,
        spent_amount: newSpentAmount,
        squad_count: newSquadCount,
      }
    };
    setSquadPlayers(prev => [...prev.filter(sp => sp.player_id !== soldPlayer.id), squadEntry]);

    // Update session
    setSession(prev => ({
      ...prev,
      status: 'sold',
      timer_started_at: null,
    }));

    // Add event
    const event: AuctionEvent = {
      id: `evt-${Date.now()}`,
      auction_session_id: session.id,
      event_type: 'player_sold',
      message: `🏆 ${soldPlayer.name} SOLD to ${winningTeam.name} for ${tournament.currency}${soldPrice.toLocaleString()}! (Purse left: ${tournament.currency}${newRemainingPurse.toLocaleString()})`,
      team_id: winningTeam.id,
      player_id: soldPlayer.id,
      created_at: nowIso,
    };
    setEvents(prev => [event, ...prev.slice(0, 40)]);

    // Trigger celebration with deducted purse info
    triggerSoldCelebration(winningTeam, soldPlayer, soldPrice, newRemainingPurse, newSpentAmount, newSquadCount);

    // 2. Persist to Supabase Database (Both via RPC and direct squad_players record)
    if (isSupabaseConfigured) {
      try {
        const { error: rpcError } = await supabase.rpc('mark_player_sold', {
          p_auction_session_id: session.id
        });

        if (rpcError) {
          console.warn('RPC mark_player_sold failed, updating tables directly:', rpcError);
        }

        // Direct table updates to guarantee squad record, player team_id, and team purse
        await Promise.allSettled([
          // Deduct team purse
          supabase.from('teams').update({
            remaining_purse: newRemainingPurse,
            spent_amount: newSpentAmount,
            updated_at: nowIso
          }).eq('id', winningTeam.id),

          // Insert squad player record connecting player to team with price
          supabase.from('squad_players').upsert({
            tournament_id: tournament.id,
            team_id: winningTeam.id,
            player_id: soldPlayer.id,
            purchase_price: soldPrice,
            purchased_at: nowIso
          }),

          // Update player status, team_id, and sold_price (falls back gracefully if columns not yet migrated)
          supabase.from('players').update({
            status: 'sold',
            team_id: winningTeam.id,
            sold_price: soldPrice,
            sold_at: nowIso,
            updated_at: nowIso
          }).eq('id', soldPlayer.id).then(({ error }) => {
            if (error) {
              return supabase.from('players').update({
                status: 'sold',
                updated_at: nowIso
              }).eq('id', soldPlayer.id);
            }
          }),

          // Session status update
          supabase.from('auction_sessions').update({
            status: 'sold',
            timer_started_at: null,
            updated_at: nowIso
          }).eq('id', session.id),

          // Event recording
          supabase.from('auction_events').insert([{
            auction_session_id: session.id,
            event_type: 'player_sold',
            message: `${soldPlayer.name} SOLD to ${winningTeam.name} for ${tournament.currency}${soldPrice.toLocaleString()}!`,
            team_id: winningTeam.id,
            player_id: soldPlayer.id
          }])
        ]);
      } catch (err: any) {
        console.warn('Supabase mark_player_sold error:', err);
      }
    }

    return { success: true };
  };

  // Authoritative Action: Mark Unsold
  const markUnsold = async (): Promise<{ success: boolean; error?: string }> => {
    if (!currentPlayer) return { success: false, error: 'No active player to mark unsold' };

    if (session.status === 'sold' || currentPlayer.status === 'sold') {
      return { success: false, error: 'Cannot mark an already sold player as unsold' };
    }

    const unsoldPlayer = currentPlayer;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('mark_player_unsold', {
          p_auction_session_id: session.id
        });
        if (error) return { success: false, error: error.message };
        if (data && !data.success) return { success: false, error: data.error };
        setUnsoldOverlay({ playerName: unsoldPlayer.name });
        return { success: true };
      } catch (err: any) {
        console.warn('Supabase mark_player_unsold RPC failed, using local fallback:', err);
      }
    }

    const nowIso = new Date().toISOString();
    setPlayers(prev => prev.map(p => p.id === unsoldPlayer.id ? { ...p, status: 'unsold' } : p));
    setSession(prev => ({
      ...prev,
      status: 'unsold',
      timer_started_at: null,
    }));

    const event: AuctionEvent = {
      id: `evt-${Date.now()}`,
      auction_session_id: session.id,
      event_type: 'player_unsold',
      message: `${unsoldPlayer.name} marked UNSOLD`,
      player_id: unsoldPlayer.id,
      created_at: nowIso,
    };
    setEvents(prev => [event, ...prev.slice(0, 40)]);
    setUnsoldOverlay({ playerName: unsoldPlayer.name });

    return { success: true };
  };

  const pauseAuction = async (): Promise<{ success: boolean; error?: string }> => {
    if (session.status !== 'active') {
      return { success: false, error: 'Auction is not active' };
    }

    // Capture remaining seconds at the exact pause moment
    const now = Date.now();
    const timerStarted = session.timer_started_at ? new Date(session.timer_started_at).getTime() : now;
    const initialDuration = session.timer_seconds || tournament.bid_timer_seconds;
    const elapsed = Math.floor((now - timerStarted) / 1000);
    const timeLeft = Math.max(1, initialDuration - elapsed);

    setSession(prev => ({
      ...prev,
      status: 'paused',
      timer_started_at: null,
      timer_seconds: timeLeft,
    }));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('auction_sessions').update({
          status: 'paused',
          timer_started_at: null,
          timer_seconds: timeLeft,
          updated_at: new Date().toISOString()
        }).eq('id', session.id);
      } catch (err) {
        console.warn('Failed to persist paused session to Supabase:', err);
      }
    }

    return { success: true };
  };

  const resumeAuction = async (): Promise<{ success: boolean; error?: string }> => {
    if (session.status !== 'paused') {
      return { success: false, error: 'Auction is not paused. Only paused auctions can be resumed.' };
    }

    if (!currentPlayer || currentPlayer.status === 'sold') {
      return { success: false, error: 'This player is already SOLD. Please click NEXT PLAYER to auction the next player.' };
    }

    const nowIso = new Date().toISOString();
    const duration = session.timer_seconds && session.timer_seconds > 0 
      ? session.timer_seconds 
      : tournament.bid_timer_seconds;

    setSession(prev => ({
      ...prev,
      status: 'active',
      timer_started_at: nowIso,
      timer_seconds: duration
    }));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('auction_sessions').update({
          status: 'active',
          timer_started_at: nowIso,
          timer_seconds: duration,
          updated_at: nowIso
        }).eq('id', session.id);
      } catch (err) {
        console.warn('Failed to persist resumed session to Supabase:', err);
      }
    }

    return { success: true };
  };

  const undoLastSale = async (): Promise<{ success: boolean; error?: string }> => {
    if (squadPlayers.length === 0) {
      return { success: false, error: 'No sold players to undo' };
    }

    const lastSale = squadPlayers[squadPlayers.length - 1];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('undo_last_sale', {
          p_auction_session_id: session.id
        });
        if (error) return { success: false, error: error.message };
        if (data && !data.success) return { success: false, error: data.error };
        return { success: true };
      } catch (err: any) {
        console.warn('Supabase undo_last_sale RPC failed, using local fallback:', err);
      }
    }

    // Refund team purse
    setTeams(prev => prev.map(t => {
      if (t.id === lastSale.team_id) {
        return {
          ...t,
          remaining_purse: t.remaining_purse + lastSale.purchase_price,
          spent_amount: t.spent_amount - lastSale.purchase_price,
          squad_count: Math.max(0, (t.squad_count || 1) - 1)
        };
      }
      return t;
    }));

    // Revert player to available & remove team association
    setPlayers(prev => prev.map(p => p.id === lastSale.player_id ? { 
      ...p, 
      status: 'available',
      team_id: null,
      sold_price: null,
      sold_at: null
    } : p));

    // Remove from squad players
    setSquadPlayers(prev => prev.slice(0, prev.length - 1));

    if (isSupabaseConfigured) {
      // Direct cleanup fallback
      supabase.from('squad_players').delete().eq('id', lastSale.id);
      supabase.from('players').update({
        status: 'available',
        team_id: null,
        sold_price: null,
        sold_at: null,
        updated_at: new Date().toISOString()
      }).eq('id', lastSale.player_id).then(({ error }) => {
        if (error) {
          supabase.from('players').update({
            status: 'available',
            updated_at: new Date().toISOString()
          }).eq('id', lastSale.player_id);
        }
      });
    }

    // Set session
    setSession(prev => ({
      ...prev,
      status: 'paused',
      current_player_id: lastSale.player_id,
      current_bid: 0,
      highest_bid_team_id: null,
      timer_started_at: null
    }));

    return { success: true };
  };

  const resetAuction = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.rpc('reset_auction', { p_tournament_id: tournament.id });
      } catch (err) {
        console.warn('Supabase reset_auction RPC failed, using local fallback:', err);
      }
    }

    setTeams(INITIAL_TEAMS);
    setPlayers(INITIAL_PLAYERS);
    setSession(INITIAL_AUCTION_SESSION);
    setRecentBids([]);
    setEvents([]);
    setSquadPlayers([]);
  };

  const clearAllData = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.rpc('clear_all_auction_data', { p_tournament_id: tournament.id });
      } catch (err) {
        console.warn('Supabase clear_all_auction_data RPC failed, falling back:', err);
      }
    }

    setTeams([]);
    setPlayers([]);
    setSession(INITIAL_AUCTION_SESSION);
    setRecentBids([]);
    setEvents([]);
    setSquadPlayers([]);
  };

  const updateTournamentSettings = async (settings: Partial<Tournament>) => {
    setTournament(prev => ({ ...prev, ...settings, updated_at: new Date().toISOString() }));
    if (isSupabaseConfigured) {
      try {
        await supabase.from('tournaments').update(settings).eq('id', tournament.id);
      } catch (err) {
        console.warn('Supabase tournament update failed:', err);
      }
    }
  };

  return (
    <AuctionContext.Provider
      value={{
        tournament,
        teams,
        players,
        session,
        currentPlayer,
        highestBidTeam,
        recentBids,
        events,
        squadPlayers,
        remainingTime,
        connectionStatus,
        soldOverlay,
        closeSoldOverlay,
        unsoldOverlay,
        closeUnsoldOverlay,
        placeBid,
        startNextPlayer,
        markSold,
        markUnsold,
        pauseAuction,
        resumeAuction,
        undoLastSale,
        resetAuction,
        clearAllData,
        updateTournamentSettings,
        calculateNextBid,
      }}
    >
      {children}
    </AuctionContext.Provider>
  );
};

export const useAuction = () => {
  const context = useContext(AuctionContext);
  if (!context) throw new Error('useAuction must be used within an AuctionProvider');
  return context;
};
