import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const socketRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = parseInt(process.env.REACT_APP_WS_RECONNECT_ATTEMPTS || '5', 10);
  const reconnectDelay = parseInt(process.env.REACT_APP_WS_RECONNECT_DELAY || '1000', 10);
  const wsTimeout = parseInt(process.env.REACT_APP_WS_TIMEOUT || '20000', 10);
  const activeConversations = useRef([]);

  const connectSocket = useCallback(() => {
    if (!user || !token) return;

    // Close existing connection if any
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    console.log('Attempting to connect to WebSocket...');
    
    // Initialize new socket connection
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    socketRef.current = io(socketUrl, {
      withCredentials: true,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: reconnectDelay,
      reconnectionDelayMax: 5000,
      timeout: wsTimeout,
      transports: ['websocket', 'polling']
    });

    // Connection events
    socketRef.current.on('connect', () => {
      console.log('WebSocket connected');
      reconnectAttempts.current = 0;
      setupMessageHandlers();
      
      // Rejoin any active conversations
      if (activeConversations.current.length > 0) {
        activeConversations.current.forEach(conversationId => {
          socketRef.current.emit('join_conversation', conversationId);
        });
      }
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message);
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = reconnectDelay * Math.pow(2, reconnectAttempts.current);
        console.log(`Reconnection attempt ${reconnectAttempts.current + 1} in ${delay}ms`);
        reconnectAttempts.current++;
      }
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('WebSocket disconnected. Reason:', reason);
    });

    // Error handling
    socketRef.current.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, token]);

  // Add message event handlers
  const setupMessageHandlers = useCallback(() => {
    if (!socketRef.current) return;

    const handleNewMessage = (message) => {
      // This will be handled by the components that use the socket
      console.log('New message received:', message);
    };

    const handleMessageRead = (data) => {
      console.log('Message read:', data);
    };

    socketRef.current.on('new_message', handleNewMessage);
    socketRef.current.on('message_read', handleMessageRead);

    return () => {
      socketRef.current?.off('new_message', handleNewMessage);
      socketRef.current?.off('message_read', handleMessageRead);
    };
  }, []);

  // Connect on mount and when user/token changes
  useEffect(() => {
    connectSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [connectSocket]);

  const joinConversation = useCallback((conversationId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_conversation', conversationId);
      activeConversations.current.push(conversationId);
    } else {
      console.warn('Cannot join conversation: WebSocket not connected');
    }
  }, []);

  const leaveConversation = useCallback((conversationId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_conversation', conversationId);
      activeConversations.current = activeConversations.current.filter(id => id !== conversationId);
    }
  }, []);

  const sendMessage = useCallback((messageData) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        return reject(new Error('WebSocket not connected'));
      }
      
      socketRef.current.emit('send_message', messageData, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }, []);

  const markAsRead = useCallback((messageId) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('mark_as_read', { messageId });
  }, []);

  const value = {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
    joinConversation,
    leaveConversation,
    sendMessage,
    markAsRead,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
