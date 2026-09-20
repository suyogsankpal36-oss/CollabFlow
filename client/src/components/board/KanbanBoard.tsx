import React, { useState, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useBoardStore } from '../../store/boardStore';
import { useAuthStore } from '../../store/authStore';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { Task } from '../../types';
import { isThisWeek } from 'date-fns';

export const KanbanBoard: React.FC = () => {
  const { currentBoard, moveTaskOptimistic, filters } = useBoardStore();
  const { user } = useAuthStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedMobileColId, setSelectedMobileColId] = useState<string | null>(null);
  const boardScrollRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 250ms press delay to differentiate between page scrolling and card dragging
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!currentBoard) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs">Loading board workspace...</p>
        </div>
      </div>
    );
  }

  // Filter tasks based on global filter state
  const filterTask = (task: Task) => {
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchTags = task.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTags) return false;
    }

    if (filters.onlyMyTasks && user) {
      if (task.assigneeId !== user.id) return false;
    }

    if (filters.highAndUrgent) {
      if (task.priority !== 'HIGH' && task.priority !== 'URGENT') return false;
    }

    if (filters.dueThisWeek) {
      if (!task.dueDate) return false;
      try {
        if (!isThisWeek(new Date(task.dueDate))) return false;
      } catch {
        return false;
      }
    }

    if (filters.selectedTag) {
      if (!task.tags?.includes(filters.selectedTag)) return false;
    }

    return true;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = currentBoard.columns
      .flatMap((c) => c.tasks)
      .find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    let sourceColId: string | null = null;
    let sourceIndex = -1;

    for (const col of currentBoard.columns) {
      const idx = col.tasks.findIndex((t) => t.id === activeId);
      if (idx !== -1) {
        sourceColId = col.id;
        sourceIndex = idx;
        break;
      }
    }

    if (!sourceColId || sourceIndex === -1) return;

    let destColId: string | null = null;
    let destIndex = 0;

    const isOverAColumn = currentBoard.columns.some((c) => c.id === overId);
    if (isOverAColumn) {
      destColId = overId;
      const targetColumn = currentBoard.columns.find((c) => c.id === overId);
      destIndex = targetColumn ? targetColumn.tasks.length : 0;
    } else {
      for (const col of currentBoard.columns) {
        const idx = col.tasks.findIndex((t) => t.id === overId);
        if (idx !== -1) {
          destColId = col.id;
          destIndex = idx;
          break;
        }
      }
    }

    if (!destColId) return;

    moveTaskOptimistic(activeId, sourceColId, destColId, sourceIndex, destIndex);
  };

  const scrollToColumn = (columnId: string) => {
    setSelectedMobileColId(columnId);
    const element = document.getElementById(`column-${columnId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Mobile Column Quick Switcher Bar */}
      <div className="sm:hidden px-3 py-2 bg-zinc-950/80 border-b border-zinc-800/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {currentBoard.columns.map((col) => {
          const isSelected = selectedMobileColId === col.id;
          const count = col.tasks.filter(filterTask).length;
          return (
            <button
              key={col.id}
              onClick={() => scrollToColumn(col.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                isSelected
                  ? 'bg-zinc-100 text-zinc-950 font-semibold shadow'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: col.color || '#64748b' }}
              />
              <span>{col.title}</span>
              <span className="text-[10px] opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={boardScrollRef}
          className="flex-1 overflow-x-auto overflow-y-hidden p-3 sm:p-6 snap-x snap-mandatory sm:snap-none"
        >
          <div className="flex items-start gap-4 sm:gap-5 h-[calc(100vh-10rem)] sm:h-[calc(100vh-9.5rem)] min-w-max pb-4">
            {currentBoard.columns.map((column) => {
              const filteredTasks = column.tasks.filter(filterTask);
              return (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={filteredTasks}
                />
              );
            })}
          </div>
        </div>

        {/* Floating Drag Preview */}
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
