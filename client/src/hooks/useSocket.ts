import { useEffect } from 'react';
import { getSocket } from '../services/socket';
import { useAuthStore } from '../store/authStore';
import { useBoardStore } from '../store/boardStore';

export function useSocket(boardId: string | undefined) {
  const { user, isAuthenticated } = useAuthStore();
  const {
    setIsConnected,
    setConnectionStatus,
    fetchBoard,
    addToast,
    onSocketTaskCreated,
    onSocketTaskMoved,
    onSocketTaskUpdated,
    onSocketTaskDeleted,
    onSocketPresenceSync,
    onSocketActivityLogged,
  } = useBoardStore();

  useEffect(() => {
    if (!isAuthenticated || !user || !boardId) return;

    const socket = getSocket();

    const handleConnect = () => {
      setIsConnected(true);
      setConnectionStatus('CONNECTED');
      socket.emit('join_board', { boardId, user });
    };

    const handleDisconnect = (reason: string) => {
      setIsConnected(false);
      setConnectionStatus('DISCONNECTED');
      console.warn(`[Socket] Disconnected: ${reason}`);
    };

    const handleConnectError = (error: Error) => {
      setIsConnected(false);
      setConnectionStatus('RECONNECTING');
      console.warn('[Socket] Connection error:', error.message);
    };

    const handleReconnectAttempt = () => {
      setConnectionStatus('RECONNECTING');
    };

    const handleReconnect = () => {
      setIsConnected(true);
      setConnectionStatus('CONNECTED');
      socket.emit('join_board', { boardId, user });
      fetchBoard(boardId);
    };

    const handleOnline = () => {
      setConnectionStatus('CONNECTING');
      if (!socket.connected) {
        socket.connect();
      }
      fetchBoard(boardId);
      addToast({
        type: 'success',
        title: 'Connection Restored',
        description: 'Live multiplayer sync is active.',
      });
    };

    const handleOffline = () => {
      setIsConnected(false);
      setConnectionStatus('DISCONNECTED');
      addToast({
        type: 'warning',
        title: 'You are offline',
        description: 'Multiplayer sync paused until connection is restored.',
      });
    };

    // Attach browser online/offline listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Attach socket listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.io.on('reconnect_attempt', handleReconnectAttempt);
    socket.io.on('reconnect', handleReconnect);

    if (socket.connected) {
      handleConnect();
    } else {
      setConnectionStatus('CONNECTING');
      socket.connect();
    }

    socket.on('presence:sync', (data) => {
      if (data.boardId === boardId) {
        onSocketPresenceSync(data.activeUsers);
      }
    });

    socket.on('task:created', (data) => {
      onSocketTaskCreated(data.task);
    });

    socket.on('task:moved', (data) => {
      onSocketTaskMoved(data);
    });

    socket.on('task:updated', (data) => {
      onSocketTaskUpdated(data.task);
    });

    socket.on('task:deleted', (data) => {
      onSocketTaskDeleted(data);
    });

    socket.on('activity:logged', (data) => {
      onSocketActivityLogged(data.activity);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      socket.emit('leave_board', { boardId });
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
      socket.io.off('reconnect', handleReconnect);
      socket.off('presence:sync');
      socket.off('task:created');
      socket.off('task:moved');
      socket.off('task:updated');
      socket.off('task:deleted');
      socket.off('activity:logged');
    };
  }, [boardId, isAuthenticated, user]);
}
