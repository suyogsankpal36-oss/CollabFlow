import React from 'react';
import { useBoardStore } from '../../store/boardStore';
import { Copy, X, Check } from 'lucide-react';

export const MultiTabBanner: React.FC = () => {
  const { isBannerDismissed, setBannerDismissed, addToast } = useBoardStore();
  const [copied, setCopied] = React.useState(false);

  if (isBannerDismissed) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    addToast({
      type: 'success',
      title: 'Board link copied!',
      description: 'Paste into a 2nd incognito window or browser to test live multiplayer sync.',
    });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-emerald-950/80 border-b border-emerald-500/30 px-3 sm:px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 z-20 shadow-lg shadow-emerald-950/20 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2 text-zinc-200 flex-1 min-w-0">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
        <p className="truncate text-[11px] sm:text-xs">
          <span className="font-bold text-emerald-300">⚡ Live Multiplayer Active:</span>{' '}
          <span className="text-zinc-300">
            Open this board in a 2nd incognito tab or browser window to see real-time card moves & presence sync instantly!
          </span>
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 font-semibold text-[11px] transition-all active:scale-95 shadow-sm"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : '📋 Copy Board Link'}</span>
        </button>

        <button
          onClick={() => setBannerDismissed(true)}
          className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80 transition-colors"
          title="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
