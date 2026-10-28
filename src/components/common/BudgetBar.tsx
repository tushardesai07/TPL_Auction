import React from 'react';

interface BudgetBarProps {
  spent: number;
  remaining: number;
  initial: number;
  squadCount: number;
  maxSquad: number;
  currency?: string;
  showNumbers?: boolean;
}

export const BudgetBar: React.FC<BudgetBarProps> = ({
  spent,
  remaining,
  initial,
  squadCount,
  maxSquad,
  currency = '₹',
  showNumbers = true
}) => {
  const safeInitial = initial > 0 ? initial : 1;
  const spentPct = Math.min(100, Math.max(0, (spent / safeInitial) * 100));
  const squadPct = Math.min(100, Math.max(0, (squadCount / maxSquad) * 100));

  return (
    <div className="w-full space-y-1.5">
      {showNumbers && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary font-medium">
            Purse: <strong className="text-text-primary font-display font-semibold">{currency}{remaining.toLocaleString()}</strong> left
          </span>
          <span className="text-text-muted font-mono text-[11px]">
            {squadCount}/{maxSquad} Players
          </span>
        </div>
      )}

      {/* Dual indicator: Top is Purse Progress, Bottom is Squad slots */}
      <div className="h-2 w-full bg-bg-subtle rounded-full overflow-hidden flex relative">
        {/* Spent portion */}
        <div 
          className="h-full bg-gold transition-all duration-500 rounded-l-full"
          style={{ width: `${spentPct}%` }}
        />
        {/* Remaining portion */}
        <div 
          className="h-full bg-status-success/30 flex-1 transition-all duration-500"
        />
      </div>

      {/* Mini slots tick marks */}
      <div className="flex items-center justify-between gap-1 pt-0.5">
        {Array.from({ length: maxSquad }).map((_, i) => (
          <div 
            key={i} 
            className={`h-1 flex-1 rounded-sm transition-colors duration-300 ${
              i < squadCount ? 'bg-gold' : 'bg-bg-subtle'
            }`}
            title={`Slot ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
