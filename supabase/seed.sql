-- ============================================================================
-- VILLAGE PREMIER LEAGUE - CLEAN TOURNAMENT INITIALIZATION
-- ============================================================================
-- Players are categorized into 5 distinct sets:
--   0. Icon Players (Marquee Category)
--   1. Batsmen (Set A)
--   2. Bowlers (Set B)
--   3. All Rounders (Set C)
--   4. Wicket Keepers (Set D)
-- ============================================================================

DO $$
DECLARE
    -- Fixed tournament UUID
    v_tourn_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
    -- 1. Initialize Tournament
    INSERT INTO public.tournaments (
        id, 
        name, 
        slug, 
        description, 
        status, 
        total_purse, 
        max_players_per_team, 
        bid_timer_seconds, 
        currency, 
        min_bid
    ) VALUES (
        v_tourn_id,
        'Village Premier League 2026',
        'vpl-2026',
        'Annual Grand Village Cricket Championship Auction. Bid. Build. Battle.',
        'active',
        50000.00,
        15,
        15,
        '₹',
        100.00
    ) ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name,
        total_purse = EXCLUDED.total_purse;

    -- 2. Initialize Auction Session
    INSERT INTO public.auction_sessions (
        tournament_id, 
        status, 
        current_player_id, 
        current_bid, 
        highest_bid_team_id, 
        timer_seconds, 
        round_number
    ) VALUES (
        v_tourn_id, 
        'waiting', 
        NULL, 
        0.00, 
        NULL, 
        15, 
        1
    ) ON CONFLICT (tournament_id) DO NOTHING;

    -- 3. Clean Tournament Ready
    -- Franchise teams and player rosters can be added via the Web UI (Admin > Teams, Admin > Players)
    -- or imported via CSV files.
END $$;
