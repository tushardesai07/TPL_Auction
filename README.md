# Village Premier League (VPL) Auction 🏏
### *Bid. Build. Battle.*

A production-ready, real-time cricket player auction platform inspired by the mechanics of an IPL auction, engineered specifically for local and village tournaments. Built with **React 19**, **Vite**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, and **Supabase (PostgreSQL + RLS + Realtime)**.

---

## 🌟 Key Highlights

- **Authoritative Database State**: All bidding, squad limits, purse reservations, and timer triggers are strictly validated server-side.
- **Race Condition Prevention**: Database transactions utilize row-level locks (`SELECT ... FOR UPDATE`) in PostgreSQL RPCs (`place_bid`) to eliminate concurrency races when multiple managers bid at the same millisecond.
- **Real-Time Synchronized Broadcast**: Full WebSocket synchronization via Supabase Realtime across Auctioneer, Team Managers, and Public Spectator screens.
- **Dynamic Bid Increments**: Default graduated increments (₹0–299: +₹25, ₹300–499: +₹50, ₹500–999: +₹100, ₹1000+: +₹200) fully configurable from the admin console.
- **Zero-Latency Audio Synthesizer**: Native Web Audio API sound generator for double gavel hammer strikes, countdown urgency ticks, and sold fanfare.
- **Cinematic Celebration**: Full-screen gold particle confetti overlay displaying winning franchise and price.
- **Mobile-First Manager Experience**: Designed for fast 1-tap mobile bidding with instant tactile feedback.
- **Configurable Tournament Engine**: Easily rebranded for any village or tournament from the admin dashboard.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + TypeScript + Vite |
| **Styling** | Tailwind CSS (Custom Dark Luxury Sports Broadcast theme) |
| **Animations** | Framer Motion & Canvas Confetti |
| **Routing** | React Router DOM |
| **Icons** | Lucide React |
| **Database** | Supabase PostgreSQL with Row Level Security (RLS) |
| **Realtime** | Supabase Realtime Channels (Postgres Changes & Broadcast) |
| **Audio** | Web Audio API (Double Gavel, Urgency Tick, Bid Chime, Fanfare) |
| **Storage** | Supabase Storage Buckets (`player-photos`, `team-logos`, `avatars`) |

---

## 📱 User Roles & Dashboards

1. **Auctioneer / Chief Admin (`/admin/auction`, `/admin`)**:
   - Master auction console designed for laptop / TV projector display.
   - Controls: Next Player, Call Specific Player, Sold (Hammer Down), Unsold, Pause, Resume, Undo Last Sale, Reset Auction.
   - Live connected managers monitor and franchise purse table.
2. **Team Manager (`/manager`)**:
   - Mobile-first terminal for team owners bidding from smartphones.
   - Huge, high-contrast 1-Tap **BID** button with instant feedback (`Bid accepted`, `Insufficient purse`, `Squad full`, `Leading bid`).
   - Live remaining purse, spent amount, squad count, and roster preview.
3. **Public Spectator (`/live`)**:
   - Big-screen projector / spectator mode.
   - Giant countdown ring, player spotlight, leading bidder, recent sales ticker, and team purse leaderboard. No manager controls exposed.

---

## 🚀 Quick Start (Local Development)

### 1. Start the Dev Server
The app has a built-in interactive demo engine that works out-of-the-box for instant preview:

```bash
npm run dev
```

Open **`http://localhost:5174`** in your browser.

---

## ⚡ Connecting to Your Supabase Backend

Your Supabase project is set to:
`https://vmadxuchrjmlnmzywjdr.supabase.co`

### Step 1: Execute SQL Migrations
1. Open your [Supabase Dashboard](https://supabase.com/dashboard/project/vmadxuchrjmlnmzywjdr).
2. Navigate to **SQL Editor** in the left sidebar.
3. Copy the contents of [`supabase/schema.sql`](file:///home/tushar/TPL_auction/supabase/schema.sql) and click **Run**.
   - This creates all 9 tables, indexes, RLS policies, atomic stored procedures (`place_bid`, `mark_player_sold`, `mark_player_unsold`, `start_player_auction`, `undo_last_sale`, `reset_auction`), and Realtime publication.
4. Copy the contents of [`supabase/seed.sql`](file:///home/tushar/TPL_auction/supabase/seed.sql) and click **Run**.
   - This seeds 8 teams (Tikkewadi Tigers, Shivneri Warriors, Raigad Royals, etc.) and 80 realistic Indian village cricketers across all 4 roles.

### Step 2: Set your Supabase Anon Public Key
1. In your Supabase Dashboard, go to **Project Settings** → **API**.
2. Copy your **`anon public`** key (`Project API keys` section).
3. Open or create `.env` in the root of this project:

```env
VITE_SUPABASE_URL=https://vmadxuchrjmlnmzywjdr.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ACTUAL_ANON_KEY_HERE
```

4. Restart Vite (`npm run dev`). The header badge will change to **Supabase Live** with real-time WebSocket synchronization!

---

## 🛡️ Database Schema & Atomic Bidding Logic

### Stored Procedure: `place_bid`
```sql
SELECT public.place_bid(
    p_auction_session_id => '...',
    p_team_id => '...',
    p_bid_amount => 3500
);
```

**Validation Sequence Executed Inside Postgres Transaction:**
1. Acquires a row lock on `auction_sessions` (`FOR UPDATE`) to serialize all incoming bids and eliminate race conditions.
2. Checks auction is `active` and player is on the block.
3. Verifies bidder is not bidding against themselves.
4. Checks team membership / admin authorization.
5. Verifies team has not exceeded `max_squad_size`.
6. Calculates required reserve purse to ensure the team can fill all remaining squad slots at least at `min_bid`.
7. Checks if bid amount meets or exceeds `calculate_next_bid()` rules.
8. Inserts bid into `bids` history, resets `timer_started_at` to configured duration, updates `highest_bid_team_id`, and emits an `auction_events` broadcast record.

---

## 🎨 Color System & Broadcast Aesthetics

| Color Token | Hex Code | Purpose |
|---|---|---|
| **Background** | `#08090B` | Broadcast studio deep black |
| **Card / Surface** | `#111318` | Dark luxury sports terminal card |
| **Primary Accent** | `#D6B36A` | Premium gold / champagne accent |
| **Secondary Text** | `#A7ADB8` | High readability secondary text |
| **Success** | `#32D583` | Winning bid / Sold indicator |
| **Danger** | `#FF5C5C` | Timer urgency & unsold status |
| **Display Font** | `Space Grotesk` | High contrast pricing & headings |
| **UI Font** | `Inter` | Clean sports broadcast UI |

---

## 📊 CSV Export & Printable Reports

- **Results CSV**: Exports final team standings, money spent, and purse left.
- **Player Purchases CSV**: Exports player names, acquiring team, role, and sale price.
- **Printable Summary**: Optimized for print / PDF generation via the `Print Report` button on `/results`.
