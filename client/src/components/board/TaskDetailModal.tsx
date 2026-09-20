import React, { useState, useEffect } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { Priority, Subtask } from '../../types';
import {
  X,
  Trash2,
  Calendar,
  Tag,
  CheckSquare,
  User as UserIcon,
  Eye,
  Edit3,
  Plus,
  History,
  AlertTriangle,
} from 'lucide-react';

export const TaskDetailModal: React.FC = () => {
  const {
    selectedTask,
    isTaskModalOpen,
    closeTaskModal,
    updateTask,
    deleteTask,
    users,
    activities,
  } = useBoardStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string>('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [previewMarkdown, setPreviewMarkdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (selectedTask) {
      setTitle(selectedTask.title || '');
      setDescription(selectedTask.description || '');
      setPriority(selectedTask.priority || 'MEDIUM');
      setAssigneeId(selectedTask.assigneeId || null);
      setDueDate(selectedTask.dueDate ? selectedTask.dueDate.split('T')[0] : '');
      setSubtasks(selectedTask.subtasks || []);
      setTags(selectedTask.tags || []);
      setShowDeleteConfirm(false);
      setIsDeleting(false);
    }
  }, [selectedTask]);

  if (!isTaskModalOpen || !selectedTask) return null;

  const handleSaveTitle = () => {
    if (title.trim() && title !== selectedTask.title) {
      updateTask(selectedTask.id, { title: title.trim() });
    }
  };

  const handleSaveDescription = () => {
    if (description !== selectedTask.description) {
      updateTask(selectedTask.id, { description });
    }
  };

  const handlePriorityChange = (newPriority: Priority) => {
    setPriority(newPriority);
    updateTask(selectedTask.id, { priority: newPriority });
  };

  const handleAssigneeChange = (newAssigneeId: string) => {
    const val = newAssigneeId === 'unassigned' ? null : newAssigneeId;
    setAssigneeId(val);
    updateTask(selectedTask.id, { assigneeId: val });
  };

  const handleDueDateChange = (newDueDate: string) => {
    setDueDate(newDueDate);
    updateTask(selectedTask.id, { dueDate: newDueDate ? new Date(newDueDate).toISOString() : null });
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const updated = subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    setSubtasks(updated);
    updateTask(selectedTask.id, { subtasks: updated });
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSubtask: Subtask = {
      id: `st-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };

    const updated = [...subtasks, newSubtask];
    setSubtasks(updated);
    setNewSubtaskTitle('');
    updateTask(selectedTask.id, { subtasks: updated });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const updated = subtasks.filter((st) => st.id !== subtaskId);
    setSubtasks(updated);
    updateTask(selectedTask.id, { subtasks: updated });
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      const cleanTag = newTagInput.trim().replace(/^#/, '');
      if (!tags.includes(cleanTag)) {
        const updated = [...tags, cleanTag];
        setTags(updated);
        updateTask(selectedTask.id, { tags: updated });
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = tags.filter((t) => t !== tagToRemove);
    setTags(updated);
    updateTask(selectedTask.id, { tags: updated });
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    setIsDeleting(true);
    try {
      await deleteTask(selectedTask.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const taskActivities = activities.filter((a) => a.taskId === selectedTask.id);
  const completedCount = subtasks.filter((s) => s.completed).length;
  const progressPercent = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

  const renderMarkdown = (text: string) => {
    if (!text) return <p className="text-zinc-500 italic">No description provided.</p>;

    return (
      <div className="space-y-2 text-xs text-zinc-300 leading-relaxed font-sans prose-invert">
        {text.split('\n').map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-sm font-bold text-zinc-100 mt-3 mb-1">
                {line.replace('### ', '')}
              </h3>
            );
          }
          if (line.startsWith('#### ')) {
            return (
              <h4 key={idx} className="text-xs font-bold text-zinc-200 mt-2 mb-1">
                {line.replace('#### ', '')}
              </h4>
            );
          }
          if (line.startsWith('- [x] ')) {
            return (
              <div key={idx} className="flex items-center gap-2 text-emerald-400 line-through">
                <CheckSquare className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{line.replace('- [x] ', '')}</span>
              </div>
            );
          }
          if (line.startsWith('- [ ] ')) {
            return (
              <div key={idx} className="flex items-center gap-2 text-zinc-300">
                <div className="w-3 h-3 border border-zinc-600 rounded flex-shrink-0" />
                <span>{line.replace('- [ ] ', '')}</span>
              </div>
            );
          }
          if (line.startsWith('- ')) {
            return (
              <li key={idx} className="ml-4 list-disc text-zinc-300">
                {line.replace('- ', '')}
              </li>
            );
          }
          if (line.startsWith('```')) {
            return (
              <div key={idx} className="p-2.5 rounded bg-zinc-950 font-mono text-[11px] text-emerald-400 border border-zinc-800 my-1">
                {line.replace(/```/g, '')}
              </div>
            );
          }
          return <p key={idx}>{line}</p>;
        })}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={closeTaskModal}
    >
      <div
        className="w-full max-w-3xl bg-zinc-900 border-t sm:border border-zinc-700/80 rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-800 bg-zinc-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-zinc-500 uppercase font-semibold">
              ISSUE-{selectedTask.id.slice(0, 6)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-200 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
              title="Delete Issue"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Delete</span>
            </button>

            <button
              onClick={closeTaskModal}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {/* Main Column: Title, Markdown Description, Subtasks */}
          <div className="md:col-span-2 space-y-6">
            {/* Title Input */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveTitle}
                className="w-full bg-transparent text-lg font-bold text-zinc-100 border-b border-transparent hover:border-zinc-700 focus:border-emerald-500 focus:outline-none pb-1 transition-all"
                placeholder="Issue title..."
              />
            </div>

            {/* Description with Markdown / Preview Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Description
                </label>
                <button
                  onClick={() => setPreviewMarkdown(!previewMarkdown)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-750 text-xs text-zinc-300 transition-colors"
                >
                  {previewMarkdown ? <Edit3 className="w-3.5 h-3.5 text-emerald-400" /> : <Eye className="w-3.5 h-3.5 text-blue-400" />}
                  <span>{previewMarkdown ? 'Edit Raw' : 'Live Preview'}</span>
                </button>
              </div>

              {previewMarkdown ? (
                <div className="min-h-[140px] p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                  {renderMarkdown(description)}
                </div>
              ) : (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleSaveDescription}
                  rows={6}
                  placeholder="Add detailed markdown description (supports code blocks, checklists, bold, etc.)..."
                  className="w-full p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 font-mono leading-relaxed resize-none transition-all"
                />
              )}
            </div>

            {/* Subtasks Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Subtasks ({completedCount}/{subtasks.length})
                  </label>
                </div>
                {subtasks.length > 0 && (
                  <span className="text-xs font-mono font-semibold text-emerald-400">
                    {Math.round(progressPercent)}%
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {subtasks.length > 0 && (
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}

              {/* Subtask Items */}
              <div className="space-y-1.5">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="group flex items-center justify-between p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                  >
                    <label className="flex items-center gap-2.5 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() => handleToggleSubtask(st.id)}
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <span
                        className={`text-xs ${
                          st.completed ? 'line-through text-zinc-500' : 'text-zinc-200'
                        }`}
                      >
                        {st.title}
                      </span>
                    </label>

                    <button
                      onClick={() => handleDeleteSubtask(st.id)}
                      className="text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Subtask Form */}
              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a subtask..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-zinc-950/60 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                />
                <button
                  type="submit"
                  disabled={!newSubtaskTitle.trim()}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium disabled:opacity-40 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>

            {/* Task Activity Timeline */}
            {taskActivities.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-zinc-800">
                <div className="flex items-center gap-2">
                  <History className="w-3.5 h-3.5 text-zinc-400" />
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Issue Activity
                  </label>
                </div>
                <div className="space-y-2">
                  {taskActivities.map((act) => (
                    <div key={act.id} className="text-[11px] text-zinc-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-zinc-200 font-medium">{act.user.name}</span>
                      <span>{act.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Priority, Assignee, Due Date, Tags, and Delete Button */}
          <div className="space-y-5 bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/80 flex flex-col justify-between">
            <div className="space-y-5">
              {/* Priority Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Priority
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['URGENT', 'HIGH', 'MEDIUM', 'LOW'] as Priority[]).map((p) => {
                    const isSelected = priority === p;
                    let borderClass = 'border-zinc-800 text-zinc-400 hover:border-zinc-700';
                    if (isSelected) {
                      if (p === 'URGENT') borderClass = 'bg-rose-500/20 border-rose-500 text-rose-300 font-semibold';
                      else if (p === 'HIGH') borderClass = 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold';
                      else if (p === 'MEDIUM') borderClass = 'bg-blue-500/20 border-blue-500 text-blue-300 font-semibold';
                      else borderClass = 'bg-zinc-800 border-zinc-600 text-zinc-200 font-semibold';
                    }

                    return (
                      <button
                        key={p}
                        onClick={() => handlePriorityChange(p)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs text-left transition-all ${borderClass}`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assignee Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Assignee</span>
                </label>
                <select
                  value={assigneeId || 'unassigned'}
                  onChange={(e) => handleAssigneeChange(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="unassigned">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date Picker */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Due Date</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => handleDueDateChange(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Tags Manager */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Tags</span>
                </label>

                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs border border-zinc-700"
                    >
                      #{tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-rose-400 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Type tag & press Enter..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            {/* Prominent Destructive Delete Action Section */}
            <div className="pt-4 border-t border-zinc-800/80">
              {showDeleteConfirm ? (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 text-rose-300 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>Delete this issue permanently?</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-tight">
                    This action cannot be undone. All subtasks and logs will be removed.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleDeleteTask}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting...' : 'Yes, Delete Issue'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/50 text-rose-400 hover:text-rose-300 font-semibold text-xs transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Issue</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
