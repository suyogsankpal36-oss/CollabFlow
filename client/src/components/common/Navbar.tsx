import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { useBoardStore } from '../../store/boardStore';
import { PresenceAvatars } from './PresenceAvatars';
import {
  Kanban,
  Plus,
  Search,
  History,
  LogOut,
  Sparkles,
  Layers,
  ChevronDown,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isDemo, logout } = useAuthStore();
  const {
    boards,
    currentBoard,
    fetchBoard,
    openCreateModal,
    setCommandPaletteOpen,
    setActivityDrawerOpen,
    isActivityDrawerOpen,
    setBannerDismissed,
  } = useBoardStore();

  return (
    <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Brand & Board Switcher */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
            <Kanban className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-950 font-bold" />
          </div>
          <div className="hidden xs:flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm tracking-tight text-zinc-100">CollabFlow</span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/40">
                PRO
              </span>
            </div>
          </div>
        </div>

        <div className="h-4 w-px bg-zinc-800 hidden xs:block flex-shrink-0" />

        {/* Board Dropdown / Title */}
        <div className="relative group min-w-0">
          <button className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-md hover:bg-zinc-900 border border-transparent hover:border-zinc-800 text-xs font-medium text-zinc-200 transition-colors max-w-[130px] sm:max-w-[200px]">
            <Layers className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
            <span className="truncate">{currentBoard?.title || 'Engineering Board'}</span>
            {boards.length > 1 && <ChevronDown className="w-3 h-3 text-zinc-500 flex-shrink-0" />}
          </button>

          {boards.length > 1 && (
            <div className="absolute left-0 top-full mt-1 w-56 p-1 rounded-lg bg-zinc-900 border border-zinc-800 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="px-2 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Workspaces & Boards
              </div>
              {boards.map((b) => (
                <button
                  key={b.id}
                  onClick={() => fetchBoard(b.id)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-between ${
                    b.id === currentBoard?.id ? 'bg-emerald-500/10 text-emerald-400 font-medium' : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <span className="truncate">{b.title}</span>
                  {b.id === currentBoard?.id && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Middle: Command Search Bar (Desktop) */}
      <div className="hidden md:flex items-center">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800/80 hover:border-zinc-700 text-xs text-zinc-400 transition-all shadow-inner w-56 lg:w-64 justify-between group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
            <span>Search or jump to...</span>
          </div>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right: Presence, Quick Actions & User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Mobile Search Icon Button */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="md:hidden p-2 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 text-zinc-300"
          title="Search"
        >
          <Search className="w-3.5 h-3.5" />
        </button>

        {/* Presence Avatars */}
        <PresenceAvatars />

        {/* Activity Drawer Toggle */}
        <button
          onClick={() => setActivityDrawerOpen(!isActivityDrawerOpen)}
          className={`p-2 sm:p-1.5 rounded-lg border text-xs font-medium transition-colors relative ${
            isActivityDrawerOpen
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 text-zinc-300'
          }`}
          title="Toggle Activity Audit Trail"
        >
          <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Quick Create Task */}
        <button
          onClick={() => openCreateModal()}
          className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs transition-all shadow-sm shadow-emerald-500/20 active:scale-95"
          title="Create Issue"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">New Issue</span>
        </button>

        {/* User Info & Demo Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-zinc-800">
          {isDemo && (
            <div className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-medium">
              <Sparkles className="w-3 h-3" />
              <span>Guest Demo</span>
            </div>
          )}

          <div className="relative group">
            <button className="flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-zinc-700 transition-all">
              <img
                src={
                  user?.avatarUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'User')}`
                }
                alt={user?.name}
                className="w-7 h-7 rounded-full object-cover bg-zinc-800 ring-1 ring-zinc-700"
              />
            </button>

            {/* User Dropdown */}
            <div className="absolute right-0 top-full mt-1 w-52 p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="px-2.5 py-2 border-b border-zinc-800 mb-1">
                <p className="text-xs font-semibold text-zinc-100 truncate">{user?.name}</p>
                <p className="text-[11px] text-zinc-500 truncate">{user?.email}</p>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setBannerDismissed(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 transition-colors mb-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Multiplayer Test Mode</span>
              </button>

              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
