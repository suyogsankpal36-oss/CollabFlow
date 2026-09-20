import React, { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column, Task } from '../../types';
import { TaskCard } from './TaskCard';
import { useBoardStore } from '../../store/boardStore';
import { Plus, X, CornerDownLeft, CheckCircle2 } from 'lucide-react';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, tasks }) => {
  const { openCreateModal, createTask, currentBoard } = useBoardStore();
  const [isInlineAdding, setIsInlineAdding] = useState(false);
  const [inlineTitle, setInlineTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  useEffect(() => {
    if (isInlineAdding) {
      inputRef.current?.focus();
    }
  }, [isInlineAdding]);

  const taskIds = React.useMemo(() => tasks.map((t) => t.id), [tasks]);

  // Calculate total board tasks and completion metrics
  const totalBoardTasks = React.useMemo(() => {
    if (!currentBoard) return 0;
    return currentBoard.columns.reduce((sum, col) => sum + col.tasks.length, 0);
  }, [currentBoard]);

  const isCompletedColumn =
    column.title.toLowerCase().includes('done') ||
    column.title.toLowerCase().includes('completed') ||
    column.order === (currentBoard ? currentBoard.columns.length - 1 : 3);

  const completionPercentage =
    totalBoardTasks > 0 ? Math.round((tasks.length / totalBoardTasks) * 100) : 0;

  const handleInlineSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inlineTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createTask({
        columnId: column.id,
        title: inlineTitle.trim(),
        priority: 'MEDIUM',
        tags: [],
        subtasks: [],
      });
      setInlineTitle('');
      setIsInlineAdding(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInlineSubmit();
    } else if (e.key === 'Escape') {
      setIsInlineAdding(false);
      setInlineTitle('');
    }
  };

  return (
    <div
      ref={setNodeRef}
      id={`column-${column.id}`}
      className={`flex flex-col w-[85vw] min-w-[85vw] sm:w-80 sm:min-w-[20rem] sm:max-w-[20rem] h-full rounded-2xl bg-zinc-950/60 border border-zinc-800/80 transition-all snap-center flex-shrink-0 ${
        isOver ? 'ring-2 ring-emerald-500/50 bg-zinc-900/40' : ''
      }`}
    >
      {/* Column Header */}
      <div className="p-3.5 pb-2.5 border-b border-zinc-800/40 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full ring-2 ring-zinc-900 flex-shrink-0"
              style={{ backgroundColor: column.color || '#64748b' }}
            />
            <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider truncate">
              {column.title}
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-semibold flex-shrink-0">
              {tasks.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => openCreateModal(column.id)}
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Add task via modal"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Mini Progress Bar for Done/Completed Column */}
        {isCompletedColumn && totalBoardTasks > 0 && (
          <div className="pt-1 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Sprint Completion</span>
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                {tasks.length}/{totalBoardTasks} ({completionPercentage}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Task List (Droppable & Sortable) */}
      <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto min-h-[150px]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isInlineAdding && (
          <div className="h-28 border border-dashed border-zinc-800/80 rounded-xl flex items-center justify-center text-xs text-zinc-600">
            No issues here
          </div>
        )}

        {/* Inline Quick-Add Form inside column */}
        {isInlineAdding && (
          <form
            onSubmit={handleInlineSubmit}
            className="p-3 rounded-xl bg-zinc-900 border border-emerald-500/50 shadow-xl space-y-2.5 animate-in fade-in zoom-in-95 duration-150"
          >
            <textarea
              ref={inputRef}
              rows={2}
              required
              value={inlineTitle}
              onChange={(e) => setInlineTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What needs to be done? Press Enter to save..."
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/80 resize-none font-sans leading-relaxed"
            />
            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center gap-1.5">
                <button
                  type="submit"
                  disabled={!inlineTitle.trim() || isSubmitting}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1 active:scale-95"
                >
                  <CornerDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isSubmitting ? 'Adding...' : 'Save'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsInlineAdding(false);
                    setInlineTitle('');
                  }}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                  title="Cancel (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono hidden xs:inline">
                Enter ↵ to save • Esc
              </span>
            </div>
          </form>
        )}
      </div>

      {/* Quick Add Button at bottom of column */}
      {!isInlineAdding && (
        <div className="p-2 pt-0">
          <button
            onClick={() => setIsInlineAdding(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-transparent hover:border-zinc-800 hover:bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 text-xs font-semibold transition-all group"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
            <span>Add issue</span>
          </button>
        </div>
      )}
    </div>
  );
};
