import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, Priority } from '../../types';
import { useBoardStore } from '../../store/boardStore';
import {
  Calendar,
  CheckSquare,
  AlertCircle,
  Clock,
  Flame,
  ArrowDown,
  Trash2,
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

interface TaskCardProps {
  task: Task;
  isOverlay?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, isOverlay = false }) => {
  const { openTaskModal, deleteTask } = useBoardStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
  const subtaskPercent = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'URGENT':
        return {
          label: 'Urgent',
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          icon: AlertCircle,
        };
      case 'HIGH':
        return {
          label: 'High',
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          icon: Flame,
        };
      case 'MEDIUM':
        return {
          label: 'Medium',
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          icon: Clock,
        };
      case 'LOW':
      default:
        return {
          label: 'Low',
          bg: 'bg-zinc-800 text-zinc-400 border-zinc-700/50',
          icon: ArrowDown,
        };
    }
  };

  const priorityInfo = getPriorityBadge(task.priority);
  const PriorityIcon = priorityInfo.icon;

  let formattedDueDate = null;
  let isDuePast = false;
  if (task.dueDate) {
    try {
      const d = new Date(task.dueDate);
      formattedDueDate = isToday(d) ? 'Today' : format(d, 'MMM d');
      isDuePast = isPast(d) && !isToday(d);
    } catch {}
  }

  const handleQuickDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete issue "${task.title}"?`)) {
      deleteTask(task.id);
    }
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 border-2 border-dashed border-emerald-500/50 rounded-xl h-28 bg-emerald-950/10"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => openTaskModal(task)}
      className={`group relative p-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800/80 hover:border-zinc-700/80 shadow-sm transition-all duration-150 cursor-grab active:cursor-grabbing hover:shadow-lg hover:shadow-black/40 ${
        isOverlay ? 'ring-2 ring-emerald-500/80 shadow-2xl scale-105 rotate-1 bg-zinc-900 z-50' : ''
      }`}
    >
      {/* Top row: Priority, Assignee & Quick Delete */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${priorityInfo.bg}`}
          >
            <PriorityIcon className="w-2.5 h-2.5" />
            {priorityInfo.label}
          </span>

          {task.tags?.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {/* Quick Delete icon on hover */}
          {!isOverlay && (
            <button
              onClick={handleQuickDelete}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-all"
              title="Delete Task"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}

          {task.assignee && (
            <img
              src={
                task.assignee.avatarUrl ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(task.assignee.name)}`
              }
              alt={task.assignee.name}
              title={`Assigned to ${task.assignee.name}`}
              className="w-5 h-5 rounded-full object-cover bg-zinc-800 ring-1 ring-zinc-700"
            />
          )}
        </div>
      </div>

      {/* Task Title */}
      <h4 className="text-xs font-semibold text-zinc-100 leading-snug group-hover:text-emerald-300 transition-colors line-clamp-2">
        {task.title}
      </h4>

      {/* Subtasks Progress Bar (if any) */}
      {totalSubtasks > 0 && (
        <div className="mt-2.5 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span className="flex items-center gap-1">
              <CheckSquare className="w-3 h-3 text-zinc-500" />
              <span>
                {completedSubtasks}/{totalSubtasks} subtasks
              </span>
            </span>
            <span className="font-mono text-zinc-500">{Math.round(subtaskPercent)}%</span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                subtaskPercent === 100 ? 'bg-emerald-500' : 'bg-emerald-600/70'
              }`}
              style={{ width: `${subtaskPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer Info: Due date & ID */}
      <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
        <span className="font-mono text-[10px] text-zinc-600 uppercase">
          ISSUE-{task.id.slice(0, 4)}
        </span>

        {formattedDueDate && (
          <span
            className={`flex items-center gap-1 text-[10px] font-medium ${
              isDuePast ? 'text-rose-400' : 'text-zinc-400'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>{formattedDueDate}</span>
          </span>
        )}
      </div>
    </div>
  );
};
