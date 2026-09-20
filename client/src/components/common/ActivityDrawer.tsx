import React from 'react';
import { useBoardStore } from '../../store/boardStore';
import { X, History, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const ActivityDrawer: React.FC = () => {
  const { isActivityDrawerOpen, setActivityDrawerOpen, activities } = useBoardStore();

  if (!isActivityDrawerOpen) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 sm:hidden animate-in fade-in duration-150"
        onClick={() => setActivityDrawerOpen(false)}
      />

      <aside className="fixed inset-y-0 right-0 z-40 w-80 max-w-[85vw] sm:relative sm:inset-auto sm:h-[calc(100vh-3.5rem)] border-l border-zinc-800 bg-zinc-950/95 backdrop-blur-xl flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
              Activity Audit Trail
            </h3>
          </div>
          <button
            onClick={() => setActivityDrawerOpen(false)}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Activity Timeline */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activities.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              No recent activity recorded yet.
            </div>
          ) : (
            activities.map((act) => {
              let timeAgo = 'just now';
              try {
                timeAgo = formatDistanceToNow(new Date(act.createdAt), { addSuffix: true });
              } catch {}

              return (
                <div key={act.id} className="flex gap-3 text-xs leading-relaxed group">
                  <img
                    src={
                      act.user?.avatarUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(act.user?.name || 'User')}`
                    }
                    alt={act.user?.name}
                    className="w-6 h-6 rounded-full object-cover bg-zinc-800 flex-shrink-0 mt-0.5 ring-1 ring-zinc-700"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-300 font-normal">
                      <span className="font-semibold text-zinc-100">{act.user?.name}</span>{' '}
                      {act.action}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{timeAgo}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/50 text-[11px] text-zinc-500 flex items-center justify-between">
          <span>Live audit stream</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </aside>
    </>
  );
};
