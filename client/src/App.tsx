import React, { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useBoardStore } from './store/boardStore';
import { useSocket } from './hooks/useSocket';
import { AuthModal } from './components/auth/AuthModal';
import { Navbar } from './components/common/Navbar';
import { MultiTabBanner } from './components/common/MultiTabBanner';
import { FilterBar } from './components/common/FilterBar';
import { ActivityDrawer } from './components/common/ActivityDrawer';
import { CommandPalette } from './components/common/CommandPalette';
import { ToastContainer } from './components/common/Toast';
import { KanbanBoard } from './components/board/KanbanBoard';
import { TaskDetailModal } from './components/board/TaskDetailModal';
import { CreateTaskModal } from './components/board/CreateTaskModal';

export const App: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading, checkAuth } = useAuthStore();
  const { currentBoard, fetchBoards, fetchUsers } = useBoardStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBoards();
      fetchUsers();
    }
  }, [isAuthenticated, fetchBoards, fetchUsers]);

  // Hook for live WebSockets multiplayer sync & active presence
  useSocket(currentBoard?.id);

  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-xs font-mono tracking-wider uppercase text-zinc-500">
            Initializing CollabFlow...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <AuthModal />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="h-screen w-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden select-none">
      {/* Top Navigation */}
      <Navbar />

      {/* Multi-Tab Real-Time Sync Testing Banner */}
      <MultiTabBanner />

      {/* Quick Filters & Instant Search */}
      <FilterBar />

      {/* Main Workspace: Kanban Columns & Optional Activity Drawer */}
      <main className="flex-1 flex overflow-hidden relative">
        <KanbanBoard />
        <ActivityDrawer />
      </main>

      {/* Modals & Overlays */}
      <TaskDetailModal />
      <CreateTaskModal />
      <CommandPalette />
      <ToastContainer />
    </div>
  );
};

export default App;
