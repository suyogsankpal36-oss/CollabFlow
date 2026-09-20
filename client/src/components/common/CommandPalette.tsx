import React, { useState, useEffect, useRef } from 'react';
import { useBoardStore } from '../../store/boardStore';
import {
  Search,
  Plus,
  Flame,
  UserCheck,
  History,
  ArrowRight,
} from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    currentBoard,
    openTaskModal,
    openCreateModal,
    setFilter,
    setActivityDrawerOpen,
    isActivityDrawerOpen,
  } = useBoardStore();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keydown handler for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      } else if (e.key === 'Escape' && isCommandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  // Collect all tasks
  const allTasks = currentBoard ? currentBoard.columns.flatMap((c) => c.tasks) : [];

  const filteredTasks = query
    ? allTasks.filter(
        (t) =>
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(query.toLowerCase())) ||
          t.priority.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const actions = [
    {
      id: 'create_task',
      title: 'Create new issue...',
      icon: Plus,
      category: 'Actions',
      action: () => {
        setCommandPaletteOpen(false);
        openCreateModal();
      },
    },
    {
      id: 'filter_my_tasks',
      title: 'Filter: Show only my assigned tasks',
      icon: UserCheck,
      category: 'Filters',
      action: () => {
        setCommandPaletteOpen(false);
        setFilter({ onlyMyTasks: true });
      },
    },
    {
      id: 'filter_urgent',
      title: 'Filter: Show High & Urgent priority issues',
      icon: Flame,
      category: 'Filters',
      action: () => {
        setCommandPaletteOpen(false);
        setFilter({ highAndUrgent: true });
      },
    },
    {
      id: 'toggle_activity',
      title: isActivityDrawerOpen ? 'Close Activity History' : 'Open Activity History',
      icon: History,
      category: 'View',
      action: () => {
        setCommandPaletteOpen(false);
        setActivityDrawerOpen(!isActivityDrawerOpen);
      },
    },
  ];

  const handleSelectTask = (task: any) => {
    setCommandPaletteOpen(false);
    openTaskModal(task);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800 bg-zinc-900/90">
          <Search className="w-5 h-5 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search issues..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          <kbd className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-4">
          {/* Matched Tasks */}
          {query && filteredTasks.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Matching Issues ({filteredTasks.length})
              </div>
              <div className="mt-1 space-y-0.5">
                {filteredTasks.slice(0, 8).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleSelectTask(task)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs hover:bg-zinc-800 text-zinc-200 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          task.priority === 'URGENT'
                            ? 'bg-rose-500'
                            : task.priority === 'HIGH'
                            ? 'bg-amber-500'
                            : 'bg-blue-500'
                        }`}
                      />
                      <span className="font-medium truncate text-zinc-200 group-hover:text-white">
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pl-3 flex-shrink-0">
                      {task.tags && task.tags[0] && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                          #{task.tags[0]}
                        </span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && filteredTasks.length === 0 && (
            <div className="py-8 text-center text-xs text-zinc-500">
              No matching issues found for "{query}"
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <div className="px-2 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Navigation & Actions
            </div>
            <div className="mt-1 space-y-0.5">
              {actions.map((act) => {
                const Icon = act.icon;
                return (
                  <button
                    key={act.id}
                    onClick={act.action}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 transition-colors group"
                  >
                    <Icon className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                    <span className="flex-1">{act.title}</span>
                    <span className="text-[10px] text-zinc-500 uppercase">{act.category}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-zinc-950/60 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-3">
            <span>Navigation: <kbd className="font-mono text-zinc-400">↑</kbd> <kbd className="font-mono text-zinc-400">↓</kbd></span>
            <span>Select: <kbd className="font-mono text-zinc-400">↵</kbd></span>
          </div>
          <span className="text-emerald-500/80 font-medium">CollabFlow Quick Navigation</span>
        </div>
      </div>
    </div>
  );
};
