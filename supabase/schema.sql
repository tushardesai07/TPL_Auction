-- ============================================================================
-- VILLAGE PREMIER LEAGUE AUCTION - PRODUCTION DATABASE SCHEMA
-- Supabase PostgreSQL with Row Level Security, RPCs, & Realtime
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TOURNAMENTS TABLE
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    total_purse NUMERIC(12, 2) NOT NULL DEFAULT 50000.00,
    max_players_per_team INTEGER NOT NULL DEFAULT 15,
    bid_timer_seconds INTEGER NOT NULL DEFAULT 15,
    currency TEXT NOT NULL DEFAULT '₹',
    min_bid NUMERIC(12, 2) NOT NULL DEFAULT 100.00,
    increment_rules JSONB NOT NULL DEFAULT '[
        {"min": 0, "max": 299, "step": 25},
        {"min": 300, "max": 499, "step": 50},
        {"min": 500, "max": 999, "step": 100},
        {"min": 1000, "max": 9999999, "step": 200}
    ]'::jsonb,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'auctioneer', 'manager', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. TEAMS TABLE
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    logo_url TEXT,
    owner_name TEXT,
    owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    initial_purse NUMERIC(12, 2) NOT NULL DEFAULT 50000.00,
    remaining_purse NUMERIC(12, 2) NOT NULL DEFAULT 50000.00,
    spent_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    max_squad_size INTEGER NOT NULL DEFAULT 15,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. PLAYERS TABLE
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    photo_url TEXT,
    age INTEGER CHECK (age >= 12 AND age <= 70),
    village TEXT,
    role TEXT NOT NULL CHECK (role IN ('Icon Player', 'Icon', 'Batsman', 'Bowler', 'All Rounder', 'Wicket Keeper')),
    is_icon BOOLEAN NOT NULL DEFAULT false,
    batting_style TEXT,
    bowling_style TEXT,
    base_price NUMERIC(12, 2) NOT NULL DEFAULT 500.00,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'active', 'sold', 'unsold')),
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure is_icon, team_id, sold_price, sold_at exist on existing tables
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS is_icon BOOLEAN DEFAULT false;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS sold_price NUMERIC(12, 2) DEFAULT NULL;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_players_team_id ON public.players(team_id);

DO $$
BEGIN
    ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_role_check;
    ALTER TABLE public.players ADD CONSTRAINT players_role_check CHECK (role IN ('Icon Player', 'Icon', 'Batsman', 'Bowler', 'All Rounder', 'Wicket Keeper'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 6. AUCTION SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.auction_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL UNIQUE REFERENCES public.tournaments(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'paused', 'sold', 'unsold', 'completed')),
    current_player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    current_bid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    highest_bid_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    timer_started_at TIMESTAMPTZ,
    timer_seconds INTEGER NOT NULL DEFAULT 15,
    round_number INTEGER NOT NULL DEFAULT 1,
    last_bid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. BIDS TABLE
CREATE TABLE IF NOT EXISTS public.bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_session_id UUID NOT NULL REFERENCES public.auction_sessions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    bidder_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. SQUAD PLAYERS TABLE (Finalized roster additions)
CREATE TABLE IF NOT EXISTS public.squad_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    player_id UUID NOT NULL UNIQUE REFERENCES public.players(id) ON DELETE CASCADE,
    purchase_price NUMERIC(12, 2) NOT NULL,
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. AUCTION EVENTS TABLE (Live feed & ticker)
CREATE TABLE IF NOT EXISTS public.auction_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_session_id UUID NOT NULL REFERENCES public.auction_sessions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    message TEXT NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. TEAM MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'manager',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(team_id, user_id)
);

-- ============================================================================
-- INDEXES FOR MAXIMUM REAL-TIME QUERY PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_teams_tournament ON public.teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_players_tournament ON public.players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_players_status ON public.players(status);
CREATE INDEX IF NOT EXISTS idx_bids_session ON public.bids(auction_session_id);
CREATE INDEX IF NOT EXISTS idx_bids_player ON public.bids(player_id);
CREATE INDEX IF NOT EXISTS idx_bids_created_at ON public.bids(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_squad_players_team ON public.squad_players(team_id);
CREATE INDEX IF NOT EXISTS idx_auction_events_session ON public.auction_events(auction_session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Helper to check if user is admin/auctioneer
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- If no admin profile exists yet in the database, allow the initial admin setup
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role IN ('admin', 'auctioneer')) THEN
        RETURN true;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'auctioneer')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create a profile when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Tournament User'),
        COALESCE(new.raw_user_meta_data->>'role', 'admin')
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profiles: Anyone can view, user can edit own, admin can edit all
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
CREATE POLICY "Admins can manage profiles" ON public.profiles
    FOR ALL USING (public.is_admin());

-- Tournaments: Everyone can read, Admin can insert/update/delete
DROP POLICY IF EXISTS "Tournaments are viewable by everyone" ON public.tournaments;
CREATE POLICY "Tournaments are viewable by everyone" ON public.tournaments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage tournaments" ON public.tournaments;
CREATE POLICY "Admins can manage tournaments" ON public.tournaments
    FOR ALL USING (public.is_admin());

-- Teams: Everyone can read, Admin can manage
DROP POLICY IF EXISTS "Teams are viewable by everyone" ON public.teams;
CREATE POLICY "Teams are viewable by everyone" ON public.teams
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage teams" ON public.teams;
CREATE POLICY "Admins can manage teams" ON public.teams
    FOR ALL USING (public.is_admin());

-- Players: Everyone can read, Admin can manage
DROP POLICY IF EXISTS "Players are viewable by everyone" ON public.players;
CREATE POLICY "Players are viewable by everyone" ON public.players
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage players" ON public.players;
CREATE POLICY "Admins can manage players" ON public.players
    FOR ALL USING (public.is_admin());

-- Auction Sessions: Everyone can read, Admin can manage directly (managers interact via RPC)
DROP POLICY IF EXISTS "Auction sessions viewable by everyone" ON public.auction_sessions;
CREATE POLICY "Auction sessions viewable by everyone" ON public.auction_sessions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage auction sessions" ON public.auction_sessions;
CREATE POLICY "Admins can manage auction sessions" ON public.auction_sessions
    FOR ALL USING (public.is_admin());

-- Bids: Everyone can read, Insert via secure RPC
DROP POLICY IF EXISTS "Bids viewable by everyone" ON public.bids;
CREATE POLICY "Bids viewable by everyone" ON public.bids
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert bids directly" ON public.bids;
CREATE POLICY "Admins can insert bids directly" ON public.bids
    FOR INSERT WITH CHECK (public.is_admin());

-- Squad Players: Everyone can read, Admin can manage directly
DROP POLICY IF EXISTS "Squad players viewable by everyone" ON public.squad_players;
CREATE POLICY "Squad players viewable by everyone" ON public.squad_players
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage squad players" ON public.squad_players;
CREATE POLICY "Admins can manage squad players" ON public.squad_players
    FOR ALL USING (public.is_admin());

-- Auction Events: Everyone can read, Admin can manage
DROP POLICY IF EXISTS "Events viewable by everyone" ON public.auction_events;
CREATE POLICY "Events viewable by everyone" ON public.auction_events
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert events" ON public.auction_events;
CREATE POLICY "Admins can insert events" ON public.auction_events
    FOR INSERT WITH CHECK (public.is_admin());

-- Team Members: Viewable by everyone, Admin can manage
DROP POLICY IF EXISTS "Team members viewable by everyone" ON public.team_members;
CREATE POLICY "Team members viewable by everyone" ON public.team_members
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;
CREATE POLICY "Admins can manage team members" ON public.team_members
    FOR ALL USING (public.is_admin());

-- ============================================================================
-- ATOMIC AUCTION FUNCTIONS (RPCs)
-- ============================================================================

-- Function to compute next minimum bid based on current bid and increment rules
CREATE OR REPLACE FUNCTION public.calculate_next_bid(
    p_current_bid NUMERIC,
    p_base_price NUMERIC,
    p_rules JSONB
)
RETURNS NUMERIC AS $$
DECLARE
    r JSONB;
    v_step NUMERIC := 100.00;
BEGIN
    IF p_current_bid = 0 OR p_current_bid IS NULL THEN
        RETURN p_base_price;
    END IF;

    FOR r IN SELECT * FROM jsonb_array_elements(p_rules)
    LOOP
        IF p_current_bid >= (r->>'min')::numeric AND p_current_bid <= (r->>'max')::numeric THEN
            v_step := (r->>'step')::numeric;
            EXIT;
        END IF;
    END LOOP;

    RETURN p_current_bid + v_step;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 1. ATOMIC PLACE BID FUNCTION
CREATE OR REPLACE FUNCTION public.place_bid(
    p_auction_session_id UUID,
    p_team_id UUID,
    p_bid_amount NUMERIC
)
RETURNS JSONB AS $$
DECLARE
    v_session RECORD;
    v_team RECORD;
    v_player RECORD;
    v_tournament RECORD;
    v_user_id UUID := auth.uid();
    v_min_required NUMERIC;
    v_current_squad_count INTEGER;
    v_slots_remaining INTEGER;
    v_reserve_required NUMERIC;
    v_is_team_member BOOLEAN := false;
    v_is_admin BOOLEAN := false;
BEGIN
    -- 1. Lock the auction session row to eliminate any concurrency race condition
    SELECT * INTO v_session
    FROM public.auction_sessions
    WHERE id = p_auction_session_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction session not found');
    END IF;

    IF v_session.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction is not currently active');
    END IF;

    IF v_session.current_player_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No player currently on block');
    END IF;

    -- Prevent self-bidding consecutively
    IF v_session.highest_bid_team_id = p_team_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Your team already holds the highest bid');
    END IF;

    -- 2. Fetch Player
    SELECT * INTO v_player
    FROM public.players
    WHERE id = v_session.current_player_id;

    -- 3. Fetch Tournament & rules
    SELECT * INTO v_tournament
    FROM public.tournaments
    WHERE id = v_session.tournament_id;

    -- 4. Check Authorization
    IF v_user_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.profiles WHERE id = v_user_id AND role IN ('admin', 'auctioneer')
        ) INTO v_is_admin;

        SELECT EXISTS (
            SELECT 1 FROM public.team_members WHERE team_id = p_team_id AND user_id = v_user_id
        ) INTO v_is_team_member;

        IF NOT v_is_admin AND NOT v_is_team_member THEN
            RETURN jsonb_build_object('success', false, 'error', 'You are not authorized to bid for this team');
        END IF;
    END IF;

    -- 5. Lock and Check Team Purse and Squad Limits
    SELECT * INTO v_team
    FROM public.teams
    WHERE id = p_team_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Team not found');
    END IF;

    SELECT COUNT(*) INTO v_current_squad_count
    FROM public.squad_players
    WHERE team_id = p_team_id;

    IF v_current_squad_count >= v_team.max_squad_size THEN
        RETURN jsonb_build_object('success', false, 'error', 'Team squad is full');
    END IF;

    -- Calculate next minimum valid bid
    v_min_required := public.calculate_next_bid(v_session.current_bid, v_player.base_price, v_tournament.increment_rules);

    IF p_bid_amount < v_min_required THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bid must be at least ' || v_tournament.currency || v_min_required);
    END IF;

    -- Calculate reserve required for remaining squad slots
    v_slots_remaining := v_team.max_squad_size - v_current_squad_count - 1;
    v_reserve_required := GREATEST(0, v_slots_remaining) * v_tournament.min_bid;

    IF (v_team.remaining_purse - p_bid_amount) < v_reserve_required THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient purse. Must reserve ' || v_tournament.currency || v_reserve_required || ' for remaining ' || v_slots_remaining || ' squad slots');
    END IF;

    -- 6. Validated! Apply atomic updates
    -- Insert Bid
    INSERT INTO public.bids (auction_session_id, player_id, team_id, bidder_user_id, amount)
    VALUES (p_auction_session_id, v_player.id, p_team_id, v_user_id, p_bid_amount);

    -- Update Auction Session: reset timer and update highest bidder
    UPDATE public.auction_sessions
    SET current_bid = p_bid_amount,
        highest_bid_team_id = p_team_id,
        timer_started_at = timezone('utc'::text, now()),
        timer_seconds = v_tournament.bid_timer_seconds,
        last_bid_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_auction_session_id;

    -- Insert Auction Event
    INSERT INTO public.auction_events (auction_session_id, event_type, message, team_id, player_id, metadata)
    VALUES (
        p_auction_session_id,
        'bid_placed',
        v_team.name || ' bid ' || v_tournament.currency || p_bid_amount,
        p_team_id,
        v_player.id,
        jsonb_build_object(
            'amount', p_bid_amount,
            'team_name', v_team.name,
            'team_short_name', v_team.short_name,
            'player_name', v_player.name
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'amount', p_bid_amount,
        'team_id', p_team_id,
        'team_name', v_team.name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ATOMIC MARK PLAYER SOLD
CREATE OR REPLACE FUNCTION public.mark_player_sold(
    p_auction_session_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_session RECORD;
    v_team RECORD;
    v_player RECORD;
    v_tournament RECORD;
BEGIN
    SELECT * INTO v_session
    FROM public.auction_sessions
    WHERE id = p_auction_session_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Session not found');
    END IF;

    IF v_session.current_player_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No player selected');
    END IF;

    IF v_session.highest_bid_team_id IS NULL OR v_session.current_bid <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot sell without a valid winning bid');
    END IF;

    SELECT * INTO v_player FROM public.players WHERE id = v_session.current_player_id;
    SELECT * INTO v_team FROM public.teams WHERE id = v_session.highest_bid_team_id FOR UPDATE;
    SELECT * INTO v_tournament FROM public.tournaments WHERE id = v_session.tournament_id;

    -- Deduct team purse
    UPDATE public.teams
    SET remaining_purse = remaining_purse - v_session.current_bid,
        spent_amount = spent_amount + v_session.current_bid,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_team.id;

    -- Add to squad_players
    INSERT INTO public.squad_players (tournament_id, team_id, player_id, purchase_price)
    VALUES (v_session.tournament_id, v_team.id, v_player.id, v_session.current_bid)
    ON CONFLICT (player_id) DO UPDATE SET purchase_price = EXCLUDED.purchase_price;

    -- Update player status
    UPDATE public.players
    SET status = 'sold',
        updated_at = timezone('utc'::text, now())
    WHERE id = v_player.id;

    -- Update auction session
    UPDATE public.auction_sessions
    SET status = 'sold',
        updated_at = timezone('utc'::text, now())
    WHERE id = p_auction_session_id;

    -- Insert event
    INSERT INTO public.auction_events (auction_session_id, event_type, message, team_id, player_id, metadata)
    VALUES (
        p_auction_session_id,
        'player_sold',
        v_player.name || ' SOLD to ' || v_team.name || ' for ' || v_tournament.currency || v_session.current_bid || '!',
        v_team.id,
        v_player.id,
        jsonb_build_object(
            'player_name', v_player.name,
            'team_name', v_team.name,
            'amount', v_session.current_bid
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'player_name', v_player.name,
        'team_name', v_team.name,
        'amount', v_session.current_bid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ATOMIC MARK PLAYER UNSOLD
CREATE OR REPLACE FUNCTION public.mark_player_unsold(
    p_auction_session_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_session RECORD;
    v_player RECORD;
BEGIN
    SELECT * INTO v_session
    FROM public.auction_sessions
    WHERE id = p_auction_session_id
    FOR UPDATE;

    IF NOT FOUND OR v_session.current_player_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active player');
    END IF;

    SELECT * INTO v_player FROM public.players WHERE id = v_session.current_player_id;

    UPDATE public.players
    SET status = 'unsold',
        updated_at = timezone('utc'::text, now())
    WHERE id = v_player.id;

    UPDATE public.auction_sessions
    SET status = 'unsold',
        updated_at = timezone('utc'::text, now())
    WHERE id = p_auction_session_id;

    INSERT INTO public.auction_events (auction_session_id, event_type, message, player_id)
    VALUES (
        p_auction_session_id,
        'player_unsold',
        v_player.name || ' marked UNSOLD',
        v_player.id
    );

    RETURN jsonb_build_object('success', true, 'player_name', v_player.name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ATOMIC START NEXT PLAYER
CREATE OR REPLACE FUNCTION public.start_player_auction(
    p_auction_session_id UUID,
    p_player_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_session RECORD;
    v_player RECORD;
    v_tournament RECORD;
BEGIN
    SELECT * INTO v_session
    FROM public.auction_sessions
    WHERE id = p_auction_session_id
    FOR UPDATE;

    SELECT * INTO v_player
    FROM public.players
    WHERE id = p_player_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Player not found');
    END IF;

    -- Never allow an already sold player to be auctioned again
    IF v_player.status = 'sold' OR EXISTS (SELECT 1 FROM public.squad_players WHERE player_id = p_player_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Player has already been sold and cannot be auctioned again');
    END IF;

    SELECT * INTO v_tournament
    FROM public.tournaments
    WHERE id = v_session.tournament_id;

    -- Update player status to active
    UPDATE public.players
    SET status = 'active',
        updated_at = timezone('utc'::text, now())
    WHERE id = p_player_id;

    -- Update session
    UPDATE public.auction_sessions
    SET current_player_id = p_player_id,
        current_bid = 0,
        highest_bid_team_id = NULL,
        status = 'active',
        timer_started_at = timezone('utc'::text, now()),
        timer_seconds = v_tournament.bid_timer_seconds,
        last_bid_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_auction_session_id;

    INSERT INTO public.auction_events (auction_session_id, event_type, message, player_id, metadata)
    VALUES (
        p_auction_session_id,
        'player_started',
        v_player.name || ' is now ON THE BLOCK (Base: ' || v_tournament.currency || v_player.base_price || ')',
        p_player_id,
        jsonb_build_object(
            'player_name', v_player.name,
            'role', v_player.role,
            'village', v_player.village,
            'base_price', v_player.base_price
        )
    );

    RETURN jsonb_build_object('success', true, 'player_id', p_player_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ATOMIC UNDO LAST SALE
CREATE OR REPLACE FUNCTION public.undo_last_sale(
    p_auction_session_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_session RECORD;
    v_last_sale RECORD;
    v_player RECORD;
    v_team RECORD;
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

    -- Refund team purse
    UPDATE public.teams
    SET remaining_purse = remaining_purse + v_last_sale.purchase_price,
        spent_amount = spent_amount - v_last_sale.purchase_price,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_team.id;

    -- Delete squad entry
    DELETE FROM public.squad_players WHERE id = v_last_sale.id;

    -- Reset player status to available
    UPDATE public.players
    SET status = 'available',
        updated_at = timezone('utc'::text, now())
    WHERE id = v_player.id;

    -- Set session back to paused/waiting
    UPDATE public.auction_sessions
    SET status = 'paused',
        current_player_id = v_player.id,
        current_bid = 0,
        highest_bid_team_id = NULL,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_auction_session_id;

    INSERT INTO public.auction_events (auction_session_id, event_type, message, team_id, player_id)
    VALUES (
        p_auction_session_id,
        'sale_undone',
        'Sale undone: ' || v_player.name || ' returned to pool, refunded to ' || v_team.name,
        v_team.id,
        v_player.id
    );

    RETURN jsonb_build_object('success', true, 'player_name', v_player.name, 'refunded_team', v_team.name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RESET AUCTION
CREATE OR REPLACE FUNCTION public.reset_auction(
    p_tournament_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_tournament RECORD;
BEGIN
    SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
    END IF;

    -- Reset teams to initial purse
    UPDATE public.teams
    SET remaining_purse = initial_purse,
        spent_amount = 0.00,
        updated_at = timezone('utc'::text, now())
    WHERE tournament_id = p_tournament_id;

    -- Clear squad players
    DELETE FROM public.squad_players WHERE tournament_id = p_tournament_id;

    -- Reset all players to available
    UPDATE public.players
    SET status = 'available',
        updated_at = timezone('utc'::text, now())
    WHERE tournament_id = p_tournament_id;

    -- Clear bids & events
    DELETE FROM public.bids WHERE auction_session_id IN (
        SELECT id FROM public.auction_sessions WHERE tournament_id = p_tournament_id
    );

    DELETE FROM public.auction_events WHERE auction_session_id IN (
        SELECT id FROM public.auction_sessions WHERE tournament_id = p_tournament_id
    );

    -- Reset auction session
    UPDATE public.auction_sessions
    SET status = 'waiting',
        current_player_id = NULL,
        current_bid = 0,
        highest_bid_team_id = NULL,
        timer_started_at = NULL,
        round_number = 1,
        updated_at = timezone('utc'::text, now())
    WHERE tournament_id = p_tournament_id;

    RETURN jsonb_build_object('success', true, 'message', 'Auction reset successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. CLEAR ALL AUCTION DATA (Deletes all players, teams, bids, events, rosters)
CREATE OR REPLACE FUNCTION public.clear_all_auction_data(
    p_tournament_id UUID
)
RETURNS JSONB AS $$
BEGIN
    DELETE FROM public.squad_players WHERE tournament_id = p_tournament_id;

    DELETE FROM public.bids WHERE auction_session_id IN (
        SELECT id FROM public.auction_sessions WHERE tournament_id = p_tournament_id
    );

    DELETE FROM public.auction_events WHERE auction_session_id IN (
        SELECT id FROM public.auction_sessions WHERE tournament_id = p_tournament_id
    );

    DELETE FROM public.team_members WHERE team_id IN (
        SELECT id FROM public.teams WHERE tournament_id = p_tournament_id
    );

    DELETE FROM public.players WHERE tournament_id = p_tournament_id;

    DELETE FROM public.teams WHERE tournament_id = p_tournament_id;

    UPDATE public.auction_sessions
    SET status = 'waiting',
        current_player_id = NULL,
        highest_bid_team_id = NULL,
        current_bid = 0.00,
        timer_started_at = NULL,
        round_number = 1,
        last_bid_at = NULL,
        updated_at = timezone('utc'::text, now())
    WHERE tournament_id = p_tournament_id;

    RETURN jsonb_build_object('success', true, 'message', 'All players, teams, and auction data deleted successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- SUPABASE STORAGE BUCKETS SETUP
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('player-photos', 'player-photos', true),
    ('team-logos', 'team-logos', true),
    ('tournament-assets', 'tournament-assets', true),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Public storage policies for all 4 media buckets
DROP POLICY IF EXISTS "Public media read access" ON storage.objects;
DROP POLICY IF EXISTS "Public photos access" ON storage.objects;
CREATE POLICY "Public media read access" ON storage.objects 
    FOR SELECT USING (bucket_id IN ('player-photos', 'team-logos', 'tournament-assets', 'avatars'));

DROP POLICY IF EXISTS "Media upload access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
CREATE POLICY "Media upload access" ON storage.objects 
    FOR INSERT WITH CHECK (bucket_id IN ('player-photos', 'team-logos', 'tournament-assets', 'avatars'));

DROP POLICY IF EXISTS "Media update access" ON storage.objects;
CREATE POLICY "Media update access" ON storage.objects 
    FOR UPDATE USING (bucket_id IN ('player-photos', 'team-logos', 'tournament-assets', 'avatars'));

DROP POLICY IF EXISTS "Media delete access" ON storage.objects;
CREATE POLICY "Media delete access" ON storage.objects 
    FOR DELETE USING (bucket_id IN ('player-photos', 'team-logos', 'tournament-assets', 'avatars'));

-- ============================================================================
-- ENABLE REALTIME PUBLICATION
-- ============================================================================
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY['auction_sessions', 'bids', 'auction_events', 'teams', 'players', 'squad_players'];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tbl
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
        END IF;
    END LOOP;
END $$;

