import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, Trophy, X } from 'lucide-react';

interface SoldOverlayProps {
  data: {
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
  } | null;
  onClose: () => void;
}

export const SoldOverlay: React.FC<SoldOverlayProps> = ({ data, onClose }) => {
  useEffect(() => {
    if (!data) return;
    // Auto close after 7 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 7000);
    return () => clearTimeout(timer);
  }, [data, onClose]);

  if (!data) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-main/90 backdrop-blur-md overflow-hidden">
        {/* Radiating background spotlight */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/20 via-bg-main/70 to-bg-main pointer-events-none" />

        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative max-w-lg w-full bg-bg-card border-2 border-gold/40 shadow-gold-glow rounded-3xl p-7 text-center overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-primary rounded-xl hover:bg-bg-subtle transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Gavel icon with bounce */}
          <motion.div 
            initial={{ rotate: -45, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold shadow-lg"
          >
            <Gavel className="w-7 h-7" />
          </motion.div>

          {/* Top Label */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[11px] font-bold tracking-[0.3em] uppercase text-status-success mb-1"
          >
            AUCTION HAMMER DOWN
          </motion.div>

          <motion.h1
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25, type: 'spring' }}
            className="text-5xl font-display font-extrabold tracking-wider text-gold mb-2"
          >
            SOLD!
          </motion.h1>

          {/* Player details */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="py-3 px-4 rounded-2xl bg-bg-subtle/80 border border-white/10 my-3 flex items-center justify-center gap-4 text-left"
          >
            {data.playerPhoto && (
              <img 
                src={data.playerPhoto} 
                alt={data.playerName} 
                className="w-14 h-14 rounded-xl object-cover border border-white/20 shrink-0"
                onError={(e) => { 
                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80'; 
                }}
              />
            )}
            <div>
              <h2 className="text-xl font-display font-bold text-white">
                {data.playerName}
              </h2>
              <p className="text-xs text-gold font-semibold mt-0.5">
                {data.playerRole}
              </p>
            </div>
          </motion.div>

          {/* Amount */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="my-3"
          >
            <div className="text-[11px] uppercase font-semibold tracking-widest text-text-muted mb-1">
              WINNING PURCHASE PRICE
            </div>
            <div className="text-4xl font-display font-extrabold text-white tracking-tight">
              {data.currency}{data.price.toLocaleString()}
            </div>
          </motion.div>

          {/* Winner Team Squad & Purse Deduction Impact Box */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="mt-4 p-4 rounded-2xl bg-bg-subtle border border-gold/20 text-left space-y-2.5"
          >
            <div className="flex items-center gap-3">
              {data.teamLogo ? (
                <img 
                  src={data.teamLogo} 
                  alt={data.teamName} 
                  className="w-11 h-11 rounded-xl object-cover border border-gold/40 shadow-sm"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold font-display font-bold">
                  {data.teamShortName}
                </div>
              )}
              <div>
                <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                  OFFICIALLY GONE TO
                </div>
                <div className="text-lg font-display font-bold text-gold">
                  {data.teamName}
                </div>
              </div>
            </div>

            {/* Financial Impact Breakdown */}
            <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-bg-main/60 p-2 rounded-xl border border-white/5">
                <span className="text-[10px] text-text-muted uppercase block">Purse Deducted</span>
                <span className="font-mono font-bold text-status-danger">
                  -{data.currency}{data.price.toLocaleString()}
                </span>
              </div>

              <div className="bg-bg-main/60 p-2 rounded-xl border border-white/5">
                <span className="text-[10px] text-text-muted uppercase block">Remaining Purse</span>
                <span className="font-mono font-bold text-emerald-400">
                  {data.currency}{(data.remainingPurse ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

            {data.squadCount !== undefined && (
              <div className="text-center text-[11px] text-text-muted">
                Squad Capacity: <strong className="text-white">{data.squadCount} / {data.maxSquadSize || 15}</strong> players filled
              </div>
            )}
          </motion.div>

          {/* Action to dismiss */}
          <div className="mt-5">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-light text-bg-main font-bold font-display text-xs tracking-wider transition-all shadow-md"
            >
              CONTINUE AUCTION →
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
