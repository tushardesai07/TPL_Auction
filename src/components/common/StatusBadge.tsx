import React from 'react';
import { PlayerStatus, AuctionStatus } from '../../types';

interface StatusBadgeProps {
  status: PlayerStatus | AuctionStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const configs: Record<string, { label: string; bg: string; text: string; dot: string; border: string }> = {
    available: {
      label: 'AVAILABLE',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      dot: 'bg-blue-400',
      border: 'border-blue-500/20'
    },
    active: {
      label: 'ON THE BLOCK',
      bg: 'bg-gold/15',
      text: 'text-gold',
      dot: 'bg-gold animate-ping',
      border: 'border-gold/40'
    },
    sold: {
      label: 'SOLD',
      bg: 'bg-status-success/15',
      text: 'text-status-success',
      dot: 'bg-status-success',
      border: 'border-status-success/40'
    },
    unsold: {
      label: 'UNSOLD',
      bg: 'bg-status-danger/15',
      text: 'text-status-danger',
      dot: 'bg-status-danger',
      border: 'border-status-danger/40'
    },
    waiting: {
      label: 'WAITING',
      bg: 'bg-zinc-500/15',
      text: 'text-zinc-400',
      dot: 'bg-zinc-400',
      border: 'border-zinc-500/30'
    },
    paused: {
      label: 'PAUSED',
      bg: 'bg-status-warning/15',
      text: 'text-status-warning',
      dot: 'bg-status-warning',
      border: 'border-status-warning/30'
    },
    completed: {
      label: 'AUCTION COMPLETE',
      bg: 'bg-purple-500/15',
      text: 'text-purple-400',
      dot: 'bg-purple-400',
      border: 'border-purple-500/30'
    }
  };

  const current = configs[status] || configs.waiting;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold tracking-wider uppercase rounded-full border ${current.bg} ${current.text} ${current.border} ${padding}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {current.label}
    </span>
  );
};
