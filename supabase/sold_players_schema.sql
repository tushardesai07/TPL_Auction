-- ============================================================================
-- TPL AUCTION: SEPARATE SCHEMA FOR SOLD PLAYERS & TEAM SQUAD ROSTERS
-- ============================================================================
-- This schema establishes direct team-to-player relationships upon auction sale:
-- 1. Adds team_id, sold_price, and sold_at directly to the public.players table.
-- 2. Ensures the public.squad_players roster table is strictly maintained.
-- 3. Creates the public.v_team_sold_players view for instant full-data inspection.
-- 4. Updates atomic mark_player_sold and undo_last_sale database functions.
-- ============================================================================

-- 1. ADD DIRECT TEAM ASSOCIATION COLUMNS TO PLAYERS TABLE
ALTER TABLE public.players 
    ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS sold_price NUMERIC(12, 2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for instant team player lookups
CREATE INDEX IF NOT EXISTS idx_players_team_id ON public.players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_status_team ON public.players(status, team_id);

-- 2. ENSURE SQUAD PLAYERS TABLE EXISTS (Finalized Roster Records)
CREATE TABLE IF NOT EXISTS public.squad_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    player_id UUID NOT NULL UNIQUE REFERENCES public.players(id) ON DELETE CASCADE,
    purchase_price NUMERIC(12, 2) NOT NULL,
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for rapid squad queries
CREATE INDEX IF NOT EXISTS idx_squad_players_team ON public.squad_players(team_id);
CREATE INDEX IF NOT EXISTS idx_squad_players_player ON public.squad_players(player_id);
CREATE INDEX IF NOT EXISTS idx_squad_players_tournament ON public.squad_players(tournament_id);

-- 3. COMPREHENSIVE VIEW: SOLD PLAYERS DIRECTORY WITH COMPLETE TEAM DATA
CREATE OR REPLACE VIEW public.v_team_sold_players AS
SELECT 
    sp.id AS squad_record_id,
    sp.tournament_id,
    sp.purchase_price,
    sp.purchased_at,
    -- Team Details
    t.id AS team_id,
    t.name AS team_name,
    t.short_name AS team_short_name,
    t.logo_url AS team_logo_url,
    t.owner_name AS team_owner_name,
    t.remaining_purse AS team_remaining_purse,
    t.spent_amount AS team_spent_amount,
    t.max_squad_size AS team_max_squad_size,
    -- Player Details
    p.id AS player_id,
    p.name AS player_name,
    p.photo_url AS player_photo_url,
    p.role AS player_role,
    p.is_icon AS player_is_icon,
    p.age AS player_age,
    p.village AS player_village,
    p.batting_style AS player_batting_style,
    p.bowling_style AS player_bowling_style,
    p.base_price AS player_base_price,
    p.order_index AS player_order_index,
    p.status AS player_status
FROM public.squad_players sp
JOIN public.teams t ON t.id = sp.team_id
JOIN public.players p ON p.id = sp.player_id;

-- 4. ATOMIC FUNCTION: MARK PLAYER SOLD & POPULATE TEAM SQUAD
CREATE OR REPLACE FUNCTION public.mark_player_sold(
    p_auction_session_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_session RECORD;
    v_player RECORD;
    v_team RECORD;
    v_tournament RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    -- Lock auction session
    SELECT * INTO v_session
    FROM public.auction_sessions
    WHERE id = p_auction_session_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction session not found');
    END IF;

    IF v_session.current_player_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No player currently on the block');
    END IF;

    IF v_session.highest_bid_team_id IS NULL OR v_session.current_bid <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot sell without a valid winning bid');
    END IF;

    SELECT * INTO v_player FROM public.players WHERE id = v_session.current_player_id;
    SELECT * INTO v_team FROM public.teams WHERE id = v_session.highest_bid_team_id FOR UPDATE;
    SELECT * INTO v_tournament FROM public.tournaments WHERE id = v_session.tournament_id;

    -- 1. Deduct winning team's purse & record spent amount
    UPDATE public.teams
    SET remaining_purse = remaining_purse - v_session.current_bid,
        spent_amount = spent_amount + v_session.current_bid,
        updated_at = v_now
    WHERE id = v_team.id;

    -- 2. Update player: Mark sold and link directly to winning team
    UPDATE public.players
    SET status = 'sold',
        team_id = v_team.id,
        sold_price = v_session.current_bid,
        sold_at = v_now,
        updated_at = v_now
    WHERE id = v_player.id;

    -- 3. Upsert into squad_players roster table
    INSERT INTO public.squad_players (tournament_id, team_id, player_id, purchase_price, purchased_at)
    VALUES (v_session.tournament_id, v_team.id, v_player.id, v_session.current_bid, v_now)
    ON CONFLICT (player_id) DO UPDATE SET 
        team_id = EXCLUDED.team_id,
        purchase_price = EXCLUDED.purchase_price,
        purchased_at = EXCLUDED.purchased_at;

    -- 4. Update auction session status
    UPDATE public.auction_sessions
    SET status = 'sold',
        timer_started_at = NULL,
        updated_at = v_now
    WHERE id = p_auction_session_id;

    -- 5. Broadcast auction event
    INSERT INTO public.auction_events (auction_session_id, event_type, message, team_id, player_id, metadata)
    VALUES (
        p_auction_session_id,
        'player_sold',
        '🏆 ' || v_player.name || ' SOLD to ' || v_team.name || ' (' || v_team.short_name || ') for ' || v_tournament.currency || v_session.current_bid || '!',
        v_team.id,
        v_player.id,
        jsonb_build_object(
            'player_name', v_player.name,
            'player_role', v_player.role,
            'team_id', v_team.id,
            'team_name', v_team.name,
            'team_short_name', v_team.short_name,
            'purchase_price', v_session.current_bid,
            'remaining_purse', (v_team.remaining_purse - v_session.current_bid)
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'player_id', v_player.id,
        'player_name', v_player.name,
        'team_id', v_team.id,
        'team_name', v_team.name,
        'purchase_price', v_session.current_bid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ATOMIC FUNCTION: UNDO LAST SALE (Reverts Team & Player State)
CREATE OR REPLACE FUNCTION public.undo_last_sale(
    p_auction_session_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_session RECORD;
    v_last_sale RECORD;
    v_player RECORD;
    v_team RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    SELECT * INTO v_session
    FROM public.auction_sessions
    WHERE id = p_auction_session_id
    FOR UPDATE;

    -- Find most recent squad entry in this tournament
    SELECT * INTO v_last_sale
    FROM public.squad_players
    WHERE tournament_id = v_session.tournament_id
    ORDER BY purchased_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'No recent sale found to undo');
    END IF;

    SELECT * INTO v_player FROM public.players WHERE id = v_last_sale.player_id;
    SELECT * INTO v_team FROM public.teams WHERE id = v_last_sale.team_id FOR UPDATE;

    -- 1. Refund team purse
    UPDATE public.teams
    SET remaining_purse = remaining_purse + v_last_sale.purchase_price,
        spent_amount = spent_amount - v_last_sale.purchase_price,
        updated_at = v_now
    WHERE id = v_team.id;

    -- 2. Remove squad entry
    DELETE FROM public.squad_players WHERE id = v_last_sale.id;

    -- 3. Reset player to available and clear team link
    UPDATE public.players
    SET status = 'available',
        team_id = NULL,
        sold_price = NULL,
        sold_at = NULL,
        updated_at = v_now
    WHERE id = v_player.id;

    -- 4. Revert auction session to paused
    UPDATE public.auction_sessions
    SET status = 'paused',
        current_player_id = v_player.id,
        current_bid = 0,
        highest_bid_team_id = NULL,
        timer_started_at = NULL,
        updated_at = v_now
    WHERE id = p_auction_session_id;

    INSERT INTO public.auction_events (auction_session_id, event_type, message, team_id, player_id)
    VALUES (
        p_auction_session_id,
        'sale_undone',
        'Sale undone: ' || v_player.name || ' returned to auction pool, refunded ' || v_last_sale.purchase_price || ' to ' || v_team.name,
        v_team.id,
        v_player.id
    );

    RETURN jsonb_build_object(
        'success', true, 
        'player_name', v_player.name, 
        'refunded_team', v_team.name,
        'refunded_amount', v_last_sale.purchase_price
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. HELPER FUNCTION: GET TEAM ROSTER WITH FULL PLAYER DATA
CREATE OR REPLACE FUNCTION public.get_team_roster(p_team_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_roster JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'squad_id', sp.id,
            'purchase_price', sp.purchase_price,
            'purchased_at', sp.purchased_at,
            'player', jsonb_build_object(
                'id', p.id,
                'name', p.name,
                'photo_url', p.photo_url,
                'role', p.role,
                'is_icon', p.is_icon,
                'age', p.age,
                'village', p.village,
                'batting_style', p.batting_style,
                'bowling_style', p.bowling_style,
                'base_price', p.base_price,
                'order_index', p.order_index
            )
        )
    ) INTO v_roster
    FROM public.squad_players sp
    JOIN public.players p ON p.id = sp.player_id
    WHERE sp.team_id = p_team_id;

    RETURN COALESCE(v_roster, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. ROW LEVEL SECURITY POLICIES FOR SQUAD DATA
ALTER TABLE public.squad_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Squad players viewable by everyone" ON public.squad_players;
CREATE POLICY "Squad players viewable by everyone" ON public.squad_players
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage squad players" ON public.squad_players;
CREATE POLICY "Admins can manage squad players" ON public.squad_players
    FOR ALL USING (public.is_admin());
