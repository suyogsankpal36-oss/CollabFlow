import React, { useState, useEffect } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { useDebounce } from '../../hooks/useDebounce';
import { Search, UserCheck, Flame, Calendar, X, Filter } from 'lucide-react';

export const FilterBar: React.FC = () => {
  const { filters, setFilter, resetFilters, currentBoard } = useBoardStore();
  const [searchInput, setSearchInput] = useState(filters.searchQuery);
  const debouncedSearch = useDebounce(searchInput, 250);

  useEffect(() => {
    setFilter({ searchQuery: debouncedSearch });
  }, [debouncedSearch, setFilter]);

  const allTags = React.useMemo(() => {
    if (!currentBoard) return [];
    const tagSet = new Set<string>();
    currentBoard.columns.forEach((col) => {
      col.tasks.forEach((t) => {
        t.tags?.forEach((tag) => tagSet.add(tag));
      });
    });
    return Array.from(tagSet);
  }, [currentBoard]);

  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.onlyMyTasks ||
    filters.highAndUrgent ||
    filters.dueThisWeek ||
    filters.selectedTag !== null;

  return (
    <div className="px-3 sm:px-6 py-2.5 border-b border-zinc-800/60 bg-zinc-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
      {/* Search Input & Horizontal Scrolling Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {/* Search Input */}
        <div className="relative w-44 sm:w-60 flex-shrink-0">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter tasks..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-all"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('');
                setFilter({ searchQuery: '' });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* My Tasks Toggle */}
        <button
          onClick={() => setFilter({ onlyMyTasks: !filters.onlyMyTasks })}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex-shrink-0 ${
            filters.onlyMyTasks
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold'
              : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>My Tasks</span>
        </button>

        {/* High & Urgent Toggle */}
        <button
          onClick={() => setFilter({ highAndUrgent: !filters.highAndUrgent })}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex-shrink-0 ${
            filters.highAndUrgent
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 font-semibold'
              : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>High Priority</span>
        </button>

        {/* Due This Week */}
        <button
          onClick={() => setFilter({ dueThisWeek: !filters.dueThisWeek })}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex-shrink-0 ${
            filters.dueThisWeek
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 font-semibold'
              : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Due This Week</span>
        </button>

        {/* Tags Pills */}
        {allTags.slice(0, 4).map((tag) => (
          <button
            key={tag}
            onClick={() => setFilter({ selectedTag: filters.selectedTag === tag ? null : tag })}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all flex-shrink-0 ${
              filters.selectedTag === tag
                ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold'
                : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
            }`}
          >
            #{tag}
          </button>
        ))}

        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearchInput('');
              resetFilters();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Total Task Count Summary (Desktop) */}
      <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500 font-medium flex-shrink-0">
        <Filter className="w-3.5 h-3.5" />
        <span>
          {currentBoard?.columns.reduce((sum, c) => sum + c.tasks.length, 0) || 0} issues total
        </span>
      </div>
    </div>
  );
};
