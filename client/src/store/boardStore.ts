import { create } from 'zustand';
import { Board, Task, User, ActivityLog, PresenceUser, FilterState, ToastMessage, Column, ConnectionStatus } from '../types';
import { api } from '../services/api';

interface BoardState {
  boards: Board[];
  currentBoard: Board | null;
  users: User[];
  activeUsers: PresenceUser[];
  activities: ActivityLog[];
  selectedTask: Task | null;
  isTaskModalOpen: boolean;
  isCreateModalOpen: boolean;
  createModalColumnId: string | null;
  isCommandPaletteOpen: boolean;
  isActivityDrawerOpen: boolean;
  isLoading: boolean;
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  isBannerDismissed: boolean;
  filters: FilterState;
  toasts: ToastMessage[];

  // Actions
  fetchBoards: () => Promise<void>;
  fetchBoard: (boardId: string) => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchActivity: (boardId: string) => Promise<void>;
  createBoard: (title: string, description?: string) => Promise<Board>;
  setIsConnected: (connected: boolean) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setBannerDismissed: (dismissed: boolean) => void;

  // Task Actions
  createTask: (payload: {
    columnId: string;
    title: string;
    description?: string;
    priority?: string;
    dueDate?: string | null;
    assigneeId?: string | null;
    tags?: string[];
    subtasks?: { id: string; title: string; completed: boolean }[];
  }) => Promise<void>;

  updateTask: (taskId: string, payload: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTaskOptimistic: (
    taskId: string,
    sourceColId: string,
    destColId: string,
    sourceIndex: number,
    destIndex: number
  ) => Promise<void>;

  // Socket Event Handlers
  onSocketTaskCreated: (task: Task) => void;
  onSocketTaskMoved: (data: {
    taskId: string;
    task: Task;
    sourceColumnId: string;
    sourceOrder: number;
    destinationColumnId: string;
    destinationOrder: number;
  }) => void;
  onSocketTaskUpdated: (task: Task) => void;
  onSocketTaskDeleted: (data: { taskId: string; columnId: string }) => void;
  onSocketPresenceSync: (activeUsers: PresenceUser[]) => void;
  onSocketActivityLogged: (activity: ActivityLog) => void;

  // UI State Actions
  setSelectedTask: (task: Task | null) => void;
  openTaskModal: (task: Task) => void;
  closeTaskModal: () => void;
  openCreateModal: (columnId?: string) => void;
  closeCreateModal: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setActivityDrawerOpen: (open: boolean) => void;
  setFilter: (filter: Partial<FilterState>) => void;
  resetFilters: () => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const initialFilters: FilterState = {
  searchQuery: '',
  onlyMyTasks: false,
  highAndUrgent: false,
  dueThisWeek: false,
  selectedTag: null,
};

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  currentBoard: null,
  users: [],
  activeUsers: [],
  activities: [],
  selectedTask: null,
  isTaskModalOpen: false,
  isCreateModalOpen: false,
  createModalColumnId: null,
  isCommandPaletteOpen: false,
  isActivityDrawerOpen: false,
  isLoading: false,
  isConnected: typeof navigator !== 'undefined' ? navigator.onLine : true,
  connectionStatus: 'CONNECTING',
  isBannerDismissed: localStorage.getItem('collabflow_banner_dismissed') === 'true',
  filters: initialFilters,
  toasts: [],
  setIsConnected: (connected) => set({ isConnected: connected }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setBannerDismissed: (dismissed) => {
    localStorage.setItem('collabflow_banner_dismissed', String(dismissed));
    set({ isBannerDismissed: dismissed });
  },

  fetchBoards: async () => {
    try {
      const data = await api.getBoards();
      set({ boards: data.boards });
      if (data.boards.length > 0 && !get().currentBoard) {
        await get().fetchBoard(data.boards[0].id);
      }
    } catch (error: any) {
      get().addToast({
        type: 'error',
        title: 'Failed to load boards',
        description: error.message,
      });
    }
  },

  fetchBoard: async (boardId: string) => {
    set({ isLoading: true });
    try {
      const data = await api.getBoardById(boardId);
      set({
        currentBoard: data.board,
        activities: data.board.activities || [],
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      get().addToast({
        type: 'error',
        title: 'Failed to load board details',
        description: error.message,
      });
    }
  },

  fetchUsers: async () => {
    try {
      const data = await api.getUsers();
      set({ users: data.users });
    } catch (error: any) {
      console.error('Failed to load users:', error);
    }
  },

  fetchActivity: async (boardId: string) => {
    try {
      const data = await api.getBoardActivity(boardId);
      set({ activities: data.activities });
    } catch (error: any) {
      console.error('Failed to load activities:', error);
    }
  },

  createBoard: async (title: string, description?: string) => {
    const data = await api.createBoard({ title, description });
    set((state) => ({ boards: [data.board, ...state.boards] }));
    await get().fetchBoard(data.board.id);
    get().addToast({
      type: 'success',
      title: 'Board created',
      description: `"${title}" has been created successfully.`,
    });
    return data.board;
  },

  createTask: async (payload) => {
    const board = get().currentBoard;
    if (!board) return;

    try {
      const data = await api.createTask({
        boardId: board.id,
        columnId: payload.columnId,
        title: payload.title,
        description: payload.description,
        priority: payload.priority,
        dueDate: payload.dueDate,
        assigneeId: payload.assigneeId,
        tags: payload.tags,
        subtasks: payload.subtasks,
      });

      // Update local state if not already received from socket
      get().onSocketTaskCreated(data.task);
      get().closeCreateModal();
      get().addToast({
        type: 'success',
        title: 'Task created',
        description: `"${data.task.title}" added to board.`,
      });
    } catch (error: any) {
      get().addToast({
        type: 'error',
        title: 'Failed to create task',
        description: error.message,
      });
    }
  },

  updateTask: async (taskId, payload) => {
    const board = get().currentBoard;
    if (!board) return;

    try {
      const data = await api.updateTask(taskId, payload);
      get().onSocketTaskUpdated(data.task);

      if (get().selectedTask?.id === taskId) {
        set({ selectedTask: data.task });
      }

      get().addToast({
        type: 'success',
        title: 'Task updated',
        description: 'Changes saved successfully.',
      });
    } catch (error: any) {
      get().addToast({
        type: 'error',
        title: 'Failed to update task',
        description: error.message,
      });
    }
  },

  deleteTask: async (taskId) => {
    const board = get().currentBoard;
    if (!board) return;

    // Find column containing task
    let foundColumnId: string | null = null;
    for (const col of board.columns) {
      if (col.tasks.some((t) => t.id === taskId)) {
        foundColumnId = col.id;
        break;
      }
    }

    try {
      await api.deleteTask(taskId);
      if (foundColumnId) {
        get().onSocketTaskDeleted({ taskId, columnId: foundColumnId });
      }
      get().closeTaskModal();
      get().addToast({
        type: 'success',
        title: 'Task deleted',
        description: 'The task has been permanently removed.',
      });
    } catch (error: any) {
      get().addToast({
        type: 'error',
        title: 'Failed to delete task',
        description: error.message,
      });
    }
  },

  moveTaskOptimistic: async (taskId, sourceColId, destColId, sourceIndex, destIndex) => {
    const board = get().currentBoard;
    if (!board) return;

    // 1. Capture snapshot for rollback
    const rollbackColumns: Column[] = JSON.parse(JSON.stringify(board.columns));

    // 2. Perform optimistic local mutation
    const newColumns = JSON.parse(JSON.stringify(board.columns)) as Column[];
    const sourceCol = newColumns.find((c) => c.id === sourceColId);
    const destCol = newColumns.find((c) => c.id === destColId);

    if (!sourceCol || !destCol) return;

    const [movedTask] = sourceCol.tasks.splice(sourceIndex, 1);
    if (!movedTask) return;

    movedTask.columnId = destColId;
    destCol.tasks.splice(destIndex, 0, movedTask);

    // Re-index orders
    sourceCol.tasks.forEach((t, i) => (t.order = i));
    destCol.tasks.forEach((t, i) => (t.order = i));

    set({
      currentBoard: {
        ...board,
        columns: newColumns,
      },
    });

    // 3. Make backend API call
    try {
      await api.moveTask(taskId, {
        destinationColumnId: destColId,
        destinationOrder: destIndex,
      });
    } catch (error: any) {
      // 4. Rollback on failure
      set({
        currentBoard: {
          ...board,
          columns: rollbackColumns,
        },
      });

      get().addToast({
        type: 'error',
        title: 'Move failed (Rolled back)',
        description: error.message || 'Could not update task position on server.',
      });
    }
  },

  // Socket event integrations
  onSocketTaskCreated: (task: Task) => {
    const board = get().currentBoard;
    if (!board || task.boardId !== board.id) return;

    const newColumns = board.columns.map((col) => {
      if (col.id === task.columnId) {
        // Prevent duplicate insertion
        if (col.tasks.some((t) => t.id === task.id)) {
          return {
            ...col,
            tasks: col.tasks.map((t) => (t.id === task.id ? task : t)),
          };
        }
        return {
          ...col,
          tasks: [...col.tasks, task].sort((a, b) => a.order - b.order),
        };
      }
      return col;
    });

    set({ currentBoard: { ...board, columns: newColumns } });
  },

  onSocketTaskMoved: (data) => {
    const board = get().currentBoard;
    if (!board) return;

    const { taskId, task, sourceColumnId, destinationColumnId, destinationOrder } = data;

    const newColumns = board.columns.map((col) => {
      // Remove from old column if different
      if (col.id === sourceColumnId && sourceColumnId !== destinationColumnId) {
        return {
          ...col,
          tasks: col.tasks.filter((t) => t.id !== taskId).map((t, idx) => ({ ...t, order: idx })),
        };
      }

      // Reorder within destination column
      if (col.id === destinationColumnId) {
        const withoutTask = col.tasks.filter((t) => t.id !== taskId);
        withoutTask.splice(destinationOrder, 0, task);
        return {
          ...col,
          tasks: withoutTask.map((t, idx) => ({ ...t, order: idx })),
        };
      }

      return col;
    });

    set({ currentBoard: { ...board, columns: newColumns } });
  },

  onSocketTaskUpdated: (task: Task) => {
    const board = get().currentBoard;
    if (!board || task.boardId !== board.id) return;

    const newColumns = board.columns.map((col) => {
      if (col.id === task.columnId) {
        return {
          ...col,
          tasks: col.tasks.map((t) => (t.id === task.id ? task : t)),
        };
      }
      return col;
    });

    set({
      currentBoard: { ...board, columns: newColumns },
      selectedTask: get().selectedTask?.id === task.id ? task : get().selectedTask,
    });
  },

  onSocketTaskDeleted: (data: { taskId: string; columnId: string }) => {
    const board = get().currentBoard;
    if (!board) return;

    const newColumns = board.columns.map((col) => {
      if (col.id === data.columnId) {
        return {
          ...col,
          tasks: col.tasks.filter((t) => t.id !== data.taskId).map((t, idx) => ({ ...t, order: idx })),
        };
      }
      return col;
    });

    set({
      currentBoard: { ...board, columns: newColumns },
      selectedTask: get().selectedTask?.id === data.taskId ? null : get().selectedTask,
      isTaskModalOpen: get().selectedTask?.id === data.taskId ? false : get().isTaskModalOpen,
    });
  },

  onSocketPresenceSync: (activeUsers: PresenceUser[]) => {
    set({ activeUsers });
  },

  onSocketActivityLogged: (activity: ActivityLog) => {
    set((state) => ({
      activities: [activity, ...state.activities.filter((a) => a.id !== activity.id)].slice(0, 50),
    }));
  },

  setSelectedTask: (task) => set({ selectedTask: task }),
  openTaskModal: (task) => set({ selectedTask: task, isTaskModalOpen: true }),
  closeTaskModal: () => set({ selectedTask: null, isTaskModalOpen: false }),
  openCreateModal: (columnId) => set({ isCreateModalOpen: true, createModalColumnId: columnId || null }),
  closeCreateModal: () => set({ isCreateModalOpen: false, createModalColumnId: null }),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  setActivityDrawerOpen: (open) => set({ isActivityDrawerOpen: open }),
  setFilter: (newFilters) => set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  resetFilters: () => set({ filters: initialFilters }),

  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
