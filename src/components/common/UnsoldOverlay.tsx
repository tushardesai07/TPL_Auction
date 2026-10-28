import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ban, X } from 'lucide-react';

interface UnsoldOverlayProps {
  data: { playerName: string } | null;
  onClose: () => void;
}

export const UnsoldOverlay: React.FC<UnsoldOverlayProps> = ({ data, onClose }) => {
  useEffect(() => {
    if (!data) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [data, onClose]);

  if (!data) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-main/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="relative max-w-sm w-full bg-bg-card border border-status-danger/40 rounded-2xl p-6 text-center shadow-danger-glow"
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-text-muted hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-status-danger/10 border border-status-danger/30 flex items-center justify-center text-status-danger">
            <Ban className="w-6 h-6" />
          </div>

          <h1 className="text-3xl font-display font-bold text-status-danger tracking-wider">
            UNSOLD
          </h1>

          <p className="text-text-primary font-medium mt-2 text-base">
            {data.playerName}
          </p>

          <p className="text-xs text-text-secondary mt-1">
            Returned to pool. Can be re-auctioned in later rounds.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
