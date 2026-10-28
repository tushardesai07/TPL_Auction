import React, { useState } from 'react';
import { 
  Play, Pause, SkipForward, CheckCircle, Ban, 
  RotateCcw, RefreshCw, AlertTriangle, Users, Volume2
} from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { sound } from '../../lib/audio';

interface AuctionControlsProps {
  onSelectSpecificPlayer?: () => void;
}

export const AuctionControls: React.FC<AuctionControlsProps> = ({ onSelectSpecificPlayer }) => {
  const { 
    session, 
    currentPlayer, 
    highestBidTeam, 
    startNextPlayer, 
    markSold, 
    markUnsold, 
    pauseAuction, 
    resumeAuction, 
    undoLastSale,
    resetAuction,
    tournament 
  } = useAuction();

  const [isLoading, setIsLoading] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAction = async (actionFn: () => Promise<{ success?: boolean; error?: string } | void>) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await actionFn();
      if (res && res.error) {
        setErrorMsg(res.error);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const isAuctionActive = session.status === 'active';
  const isAuctionPaused = session.status === 'paused';
  const isPlayerSold = session.status === 'sold' || (currentPlayer?.status === 'sold');
  const isPlayerUnsold = session.status === 'unsold' || (currentPlayer?.status === 'unsold');
  const hasCurrentPlayer = Boolean(currentPlayer);
  const hasValidBid = Boolean(highestBidTeam && session.current_bid > 0);

  return (
    <div className="bg-bg-card border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <h3 className="font-display font-semibold text-sm tracking-wide text-text-primary">
            AUCTIONEER COMMAND CENTER
          </h3>
          <p className="text-[11px] text-text-muted">
            Authoritative broadcast master controls
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => sound.playGavelStrike()}
            className="p-1.5 rounded-lg bg-bg-subtle hover:bg-gold/20 text-gold transition-colors text-xs flex items-center gap-1 border border-white/5"
            title="Sound Test: Double Gavel"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gavel</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-status-danger/10 border border-status-danger/30 text-status-danger text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-white font-bold ml-2">×</button>
        </div>
      )}

      {/* Main Action Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* NEXT PLAYER */}
        <button
          onClick={() => handleAction(() => startNextPlayer())}
          disabled={isLoading || (isAuctionActive && hasCurrentPlayer && hasValidBid)}
          className={`col-span-2 sm:col-span-1 p-3.5 rounded-xl font-display font-bold text-sm tracking-wide flex flex-col items-center justify-center gap-1 transition-all shadow-gold-glow hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none ${
            isPlayerSold || isPlayerUnsold || !hasCurrentPlayer
              ? 'bg-gold hover:bg-gold-light text-bg-main ring-2 ring-gold/60 animate-pulse'
              : 'bg-gold hover:bg-gold-light text-bg-main'
          }`}
          title={isPlayerSold ? 'Player is sold! Click to bring next player to the block' : 'Bring next player to the block'}
        >
          <SkipForward className="w-5 h-5" />
          <span>{isPlayerSold ? 'NEXT PLAYER →' : 'NEXT PLAYER'}</span>
        </button>

        {/* SOLD */}
        <button
          onClick={() => handleAction(() => markSold())}
          disabled={isLoading || !hasCurrentPlayer || !hasValidBid || isPlayerSold || isPlayerUnsold}
          className="p-3.5 rounded-xl bg-status-success hover:bg-emerald-400 text-bg-main font-display font-bold text-sm tracking-wide flex flex-col items-center justify-center gap-1 transition-all shadow-success-glow hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
        >
          <CheckCircle className="w-5 h-5" />
          <span>SOLD</span>
        </button>

        {/* UNSOLD */}
        <button
          onClick={() => handleAction(() => markUnsold())}
          disabled={isLoading || !hasCurrentPlayer || isPlayerSold || isPlayerUnsold}
          className="p-3.5 rounded-xl bg-status-danger/20 hover:bg-status-danger/30 text-status-danger border border-status-danger/40 font-display font-bold text-sm tracking-wide flex flex-col items-center justify-center gap-1 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
        >
          <Ban className="w-5 h-5" />
          <span>UNSOLD</span>
        </button>

        {/* PAUSE / RESUME / STATUS */}
        {isAuctionActive ? (
          <button
            onClick={() => handleAction(pauseAuction)}
            disabled={isLoading}
            className="p-3.5 rounded-xl bg-status-warning/20 hover:bg-status-warning/30 text-status-warning border border-status-warning/40 font-display font-bold text-sm tracking-wide flex flex-col items-center justify-center gap-1 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Pause the live auction timer"
          >
            <Pause className="w-5 h-5" />
            <span>PAUSE</span>
          </button>
        ) : isAuctionPaused ? (
          <button
            onClick={() => handleAction(resumeAuction)}
            disabled={isLoading || !hasCurrentPlayer || isPlayerSold}
            className="p-3.5 rounded-xl bg-blue-500/25 hover:bg-blue-500/40 text-blue-400 border border-blue-500/50 font-display font-bold text-sm tracking-wide flex flex-col items-center justify-center gap-1 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none ring-2 ring-blue-500/40"
            title="Resume the paused auction timer"
          >
            <Play className="w-5 h-5" />
            <span>RESUME</span>
          </button>
        ) : isPlayerSold ? (
          <div
            className="p-3.5 rounded-xl bg-status-success/10 border border-status-success/30 font-display font-bold text-xs tracking-wide flex flex-col items-center justify-center gap-1 text-status-success"
            title="Round finished: Player has been sold"
          >
            <CheckCircle className="w-5 h-5 text-status-success" />
            <span>SOLD (DONE)</span>
          </div>
        ) : isPlayerUnsold ? (
          <div
            className="p-3.5 rounded-xl bg-status-danger/10 border border-status-danger/30 font-display font-bold text-xs tracking-wide flex flex-col items-center justify-center gap-1 text-status-danger"
            title="Round finished: Player unsold"
          >
            <Ban className="w-5 h-5 text-status-danger" />
            <span>UNSOLD (DONE)</span>
          </div>
        ) : (
          <button
            disabled
            className="p-3.5 rounded-xl bg-white/5 border border-white/5 font-display font-bold text-xs tracking-wide flex flex-col items-center justify-center gap-1 text-text-muted opacity-50 cursor-not-allowed"
          >
            <Play className="w-5 h-5 opacity-40" />
            <span>READY</span>
          </button>
        )}
      </div>

      {/* Secondary Controls Bar: UNDO, PICK SPECIFIC, RESET */}
      <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAction(undoLastSale)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-bg-subtle hover:bg-white/10 text-text-secondary hover:text-white text-xs font-medium flex items-center gap-1.5 border border-white/5 transition-colors disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Undo Last Sale
          </button>

          {onSelectSpecificPlayer && (
            <button
              onClick={onSelectSpecificPlayer}
              className="px-3 py-1.5 rounded-lg bg-bg-subtle hover:bg-white/10 text-gold text-xs font-medium flex items-center gap-1.5 border border-gold/20 transition-colors"
            >
              Pick Player from List
            </button>
          )}
        </div>

        {/* Safe Auction Reset */}
        <div>
          {confirmReset ? (
            <div className="flex items-center gap-1.5 bg-status-danger/10 border border-status-danger/40 p-1 rounded-lg">
              <span className="text-[11px] text-status-danger font-medium pl-1">Confirm Reset?</span>
              <button
                onClick={() => {
                  handleAction(resetAuction);
                  setConfirmReset(false);
                }}
                className="px-2 py-0.5 bg-status-danger text-white rounded text-[11px] font-bold"
              >
                Yes, Reset All
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-2 py-0.5 bg-bg-subtle text-text-muted rounded text-[11px]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="text-[11px] text-text-muted hover:text-status-danger flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Reset Auction
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
