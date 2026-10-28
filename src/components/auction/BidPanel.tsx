import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Check, AlertCircle, ShieldAlert } from 'lucide-react';
import { Team, Player, AuctionSession } from '../../types';
import { useAuction } from '../../context/AuctionContext';

interface BidPanelProps {
  team: Team;
  player: Player | null;
  session: AuctionSession;
  squadCount: number;
}

export const BidPanel: React.FC<BidPanelProps> = ({
  team,
  player,
  session,
  squadCount,
}) => {
  const { placeBid, calculateNextBid, tournament } = useAuction();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!player) {
    return (
      <div className="bg-bg-card border border-white/10 rounded-2xl p-6 text-center text-text-muted text-sm">
        Waiting for auctioneer to call next player to the block.
      </div>
    );
  }

  if (player.status === 'sold' || session.status === 'sold') {
    return (
      <div className="bg-bg-card border border-status-success/30 rounded-2xl p-6 text-center space-y-2">
        <div className="w-10 h-10 mx-auto rounded-full bg-status-success/15 text-status-success flex items-center justify-center">
          <Check className="w-5 h-5" />
        </div>
        <h4 className="font-display font-bold text-white text-base">
          {player.name} is SOLD!
        </h4>
        <p className="text-xs text-text-muted">
          Round completed. Waiting for auctioneer to bring the next player to the block.
        </p>
      </div>
    );
  }

  const isAuctionActive = session.status === 'active';
  const isHighestBidder = session.highest_bid_team_id === team.id;
  const isSquadFull = squadCount >= team.max_squad_size;

  const nextBidAmount = calculateNextBid(session.current_bid, player.base_price);
  const canAfford = team.remaining_purse >= nextBidAmount;

  // Presets for quick bid increments
  const presetIncrements = [
    nextBidAmount,
    nextBidAmount + 200,
    nextBidAmount + 500,
    nextBidAmount + 1000
  ];

  const handlePlaceBid = async (amount: number) => {
    if (!isAuctionActive) {
      setFeedback({ type: 'error', message: 'Auction is paused' });
      return;
    }
    if (isHighestBidder) {
      setFeedback({ type: 'error', message: 'Your team already holds the highest bid' });
      return;
    }
    if (isSquadFull) {
      setFeedback({ type: 'error', message: 'Your squad is already full' });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);
      const res = await placeBid(team.id, amount);

      if (res.success) {
        setFeedback({ type: 'success', message: `Bid of ${tournament.currency}${amount.toLocaleString()} Accepted!` });
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ type: 'error', message: res.error || 'Bid rejected' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Bid failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-bg-card border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Team Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center font-display font-bold text-gold">
            {team.short_name}
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-text-primary">
              {team.name}
            </h3>
            <p className="text-[11px] text-text-muted">
              Remaining: <strong className="text-gold font-display">{tournament.currency}{team.remaining_purse.toLocaleString()}</strong>
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted block">
            Squad
          </span>
          <span className="text-xs font-mono font-bold text-text-primary">
            {squadCount} / {team.max_squad_size}
          </span>
        </div>
      </div>

      {/* Instant Feedback Alert */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-status-success/15 border border-status-success/30 text-status-success'
              : 'bg-status-danger/15 border border-status-danger/30 text-status-danger'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </motion.div>
      )}

      {/* GIANT PRIMARY BID BUTTON */}
      <div>
        <button
          onClick={() => handlePlaceBid(nextBidAmount)}
          disabled={isSubmitting || !isAuctionActive || isHighestBidder || isSquadFull || !canAfford}
          className={`w-full py-5 px-6 rounded-2xl font-display font-black text-xl sm:text-2xl tracking-wide flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl ${
            isHighestBidder
              ? 'bg-status-success/20 border-2 border-status-success/40 text-status-success cursor-default'
              : isSquadFull || !canAfford
              ? 'bg-bg-subtle text-text-muted border border-white/5 cursor-not-allowed'
              : 'bg-gold hover:bg-gold-light text-bg-main shadow-gold-glow hover:scale-[1.02]'
          }`}
        >
          <ArrowUpRight className="w-7 h-7 stroke-[2.5]" />
          <span>
            {isHighestBidder
              ? 'HIGHEST BIDDER'
              : `BID ${tournament.currency}${nextBidAmount.toLocaleString()}`}
          </span>
        </button>

        {/* Warning messages if disabled */}
        {isHighestBidder && (
          <p className="text-center text-[11px] text-status-success font-medium mt-1.5">
            ✓ Your team is currently leading the bid
          </p>
        )}
        {!canAfford && (
          <p className="text-center text-[11px] text-status-danger font-medium mt-1.5 flex items-center justify-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Insufficient purse for this bid
          </p>
        )}
      </div>

      {/* Quick Jump Bid Increments */}
      <div className="pt-2">
        <div className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-2">
          QUICK JUMP PRESETS
        </div>
        <div className="grid grid-cols-4 gap-2">
          {presetIncrements.map((amt, idx) => (
            <button
              key={idx}
              onClick={() => handlePlaceBid(amt)}
              disabled={isSubmitting || !isAuctionActive || isHighestBidder || amt > team.remaining_purse}
              className="py-2 px-1 rounded-xl bg-bg-subtle hover:bg-gold/15 hover:border-gold/30 border border-white/5 text-text-primary hover:text-gold font-display font-bold text-xs transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              +{tournament.currency}{(amt - session.current_bid).toLocaleString()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
