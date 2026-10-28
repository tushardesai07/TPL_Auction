import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ArrowUpRight, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { AuctionEvent, Bid } from '../../types';

interface LiveBidFeedProps {
  events: AuctionEvent[];
  recentBids?: Bid[];
  currency?: string;
  maxItems?: number;
}

export const LiveBidFeed: React.FC<LiveBidFeedProps> = ({
  events,
  currency = '₹',
  maxItems = 12
}) => {
  const displayEvents = events.slice(0, maxItems);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'bid_placed':
        return <ArrowUpRight className="w-3.5 h-3.5 text-gold" />;
      case 'player_sold':
        return <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />;
      case 'player_unsold':
        return <AlertCircle className="w-3.5 h-3.5 text-status-danger" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div className="bg-bg-card border border-white/10 rounded-2xl p-5 flex flex-col h-full overflow-hidden shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-gold animate-pulse" />
          <h3 className="font-display font-semibold text-sm tracking-wide text-text-primary">
            LIVE AUCTION FEED
          </h3>
        </div>
        <span className="text-[10px] text-text-muted font-mono uppercase">
          Realtime
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
        <AnimatePresence initial={false}>
          {displayEvents.length === 0 ? (
            <div className="text-center py-12 text-xs text-text-muted">
              Waiting for live auction events...
            </div>
          ) : (
            displayEvents.map((event) => {
              const isBid = event.event_type === 'bid_placed';
              const isSold = event.event_type === 'player_sold';

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className={`p-3 rounded-xl border transition-all ${
                    isSold
                      ? 'bg-status-success/10 border-status-success/30 text-status-success'
                      : isBid
                      ? 'bg-bg-subtle border-gold/20 hover:border-gold/40'
                      : 'bg-bg-subtle/50 border-white/5 text-text-secondary'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-bg-main/60">
                        {getEventIcon(event.event_type)}
                      </div>
                      <span className={`text-xs ${isSold ? 'font-bold' : isBid ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>
                        {event.message}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-text-muted shrink-0 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
