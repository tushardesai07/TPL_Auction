-- ============================================================================
-- CLEAR ALL DUMMY DATA FROM SUPABASE
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- It safely deletes all dummy players, dummy teams, squad rosters, bids, and events.
-- ============================================================================

DO $$
BEGIN
    -- 1. Delete all squad allocations & bid transactions
    DELETE FROM public.squad_players;
    DELETE FROM public.bids;
    DELETE FROM public.auction_events;
    DELETE FROM public.team_members;

    -- 2. Delete all dummy players
    DELETE FROM public.players;

    -- 3. Delete all dummy teams
    DELETE FROM public.teams;

    -- 4. Reset the auction session to clean initial state
    UPDATE public.auction_sessions
    SET 
        status = 'waiting',
        current_player_id = NULL,
        highest_bid_team_id = NULL,
        current_bid = 0.00,
        timer_started_at = NULL,
        round_number = 1,
        last_bid_at = NULL,
        updated_at = timezone('utc'::text, now());

    RAISE NOTICE 'All dummy data successfully cleared! You now have a clean slate to create your real teams and players.';
END $$;
