import React from 'react';
import { useBoardStore } from '../../store/boardStore';
import { RefreshCw } from 'lucide-react';

export const PresenceAvatars: React.FC = () => {
  const { activeUsers, connectionStatus } = useBoardStore();

  return (
    <div className="flex items-center gap-2">
      {/* Connection Lifecycle Status Badge */}
      {connectionStatus === 'DISCONNECTED' && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="hidden sm:inline">Offline — Reconnecting in 3s...</span>
          <span className="sm:hidden">Offline</span>
        </div>
      )}

      {(connectionStatus === 'CONNECTING' || connectionStatus === 'RECONNECTING') && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium animate-pulse">
          <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
          <span className="hidden sm:inline">Reconnecting...</span>
          <span className="sm:hidden">Connecting</span>
        </div>
      )}

      {connectionStatus === 'CONNECTED' && (
        <>
          {/* Active Collaborators Avatars */}
          {activeUsers.length > 0 && (
            <div className="flex -space-x-2 overflow-hidden items-center">
              {activeUsers.slice(0, 5).map((presence, idx) => (
                <div
                  key={presence.socketId || idx}
                  className="relative group inline-block"
                  title={`${presence.user.name} (${presence.user.role}) — Active`}
                >
                  <img
                    src={
                      presence.user.avatarUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(presence.user.name)}`
                    }
                    alt={presence.user.name}
                    className="w-7 h-7 rounded-full ring-2 ring-zinc-950 object-cover bg-zinc-800 transition-transform group-hover:scale-110 group-hover:z-10"
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-zinc-950 animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {activeUsers.length > 5 && (
            <span className="text-xs text-zinc-400 font-medium px-1.5 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/50">
              +{activeUsers.length - 5}
            </span>
          )}

          {/* Live Sync Active Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="hidden sm:inline">
              {activeUsers.length > 1 ? `${activeUsers.length} Live Sync Active` : 'Live Sync Active'}
            </span>
            <span className="sm:hidden font-mono">{activeUsers.length} Live</span>
          </div>
        </>
      )}
    </div>
  );
};
