import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import api from '../../services/api';
import { FiSend, FiPaperclip, FiImage, FiFile, FiSmile, FiChevronDown, FiMessageSquare } from 'react-icons/fi';
import { format } from 'date-fns';

const Messages = () => {
  const { user } = useAuth();
  const { socket, joinConversation, leaveConversation, sendMessage } = useSocket();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch conversations on component mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const { data } = await api.messages.getConversations();
        setConversations(data);
        if (data.length > 0 && !selectedConversation) {
          setSelectedConversation(data[0]);
        }
      } catch (err) {
        setError('Failed to load conversations');
        console.error('Error fetching conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // Fetch messages when selected conversation changes
  useEffect(() => {
    if (selectedConversation) {
      const fetchMessages = async () => {
        try {
          setLoading(true);
          const { data } = await api.messages.getMessages(selectedConversation._id);
          setMessages(data);
          scrollToBottom();
        } catch (err) {
          setError('Failed to load messages');
          console.error('Error fetching messages:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchMessages();
    }
  }, [selectedConversation?._id]);

  // Handle new messages from WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
      if (newMessage.sender._id !== user.id) {
        markAsRead(newMessage._id);
      }
      scrollToBottom();
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, user.id]);

  // Join conversation room when selected
  useEffect(() => {
    if (selectedConversation?._id && socket) {
      joinConversation(selectedConversation._id);
      markMessagesAsRead();
      
      return () => {
        leaveConversation(selectedConversation._id);
      };
    }
  }, [selectedConversation?._id, socket, joinConversation, leaveConversation]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedConversation) return;

    let optimisticMessage;
    
    try {
      const newMessage = {
        content: message,
        conversationId: selectedConversation._id,
        receiver: selectedConversation.participant._id
      };

      // Optimistic UI update
      optimisticMessage = {
        ...newMessage,
        _id: Date.now().toString(),
        sender: { _id: user.id, firstName: user.firstName, lastName: user.lastName },
        receiver: selectedConversation.participant._id,
        createdAt: new Date().toISOString(),
        isRead: false,
        isOptimistic: true
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setMessage('');
      scrollToBottom();

      // Try to send via WebSocket first
      try {
        await sendMessage(newMessage);
      } catch (wsError) {
        console.warn('WebSocket send failed, falling back to HTTP:', wsError);
        // Fallback to HTTP if WebSocket fails
        await api.messages.sendMessage(newMessage);
      }
      
      // Refresh conversations to update last message
      const { data } = await api.messages.getConversations();
      setConversations(data);
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      // Remove the optimistic message if sending failed
      if (optimisticMessage) {
        setMessages(prev => prev.filter(m => !m.isOptimistic || m._id !== optimisticMessage._id));
      }
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await api.messages.markAsRead(messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const markMessagesAsRead = async () => {
    const unreadMessages = messages.filter(
      msg => !msg.isRead && msg.receiver === user.id
    );
    
    if (unreadMessages.length > 0) {
      try {
        await Promise.all(
          unreadMessages.map(msg => markAsRead(msg._id))
        );
        // Update local state to reflect read status
        setMessages(prev => 
          prev.map(msg => ({
            ...msg,
            isRead: true
          }))
        );
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Handle file upload logic here
    console.log('File selected:', file);
    // You'll need to implement the actual file upload logic
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim()) {
        handleSendMessage(e);
      }
    }
  };

  const renderMessage = (msg) => {
    const isCurrentUser = msg.sender._id === user.id;
    const messageDate = new Date(msg.createdAt);
    const formattedTime = format(messageDate, 'h:mm a');

    return (
      <div 
        key={msg._id} 
        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex max-w-xs lg:max-w-md ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
          {!isCurrentUser && (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center mr-2">
              {msg.sender.firstName?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            {!isCurrentUser && (
              <div className="text-xs text-gray-500 mb-1">
                {msg.sender.firstName} {msg.sender.lastName}
              </div>
            )}
            <div
              className={`px-4 py-2 rounded-lg ${
                isCurrentUser
                  ? 'bg-blue-500 text-white rounded-tr-none'
                  : 'bg-gray-200 text-gray-800 rounded-tl-none'
              }`}
            >
              <p className="break-words">{msg.content}</p>
              <div className="flex items-center justify-end mt-1">
                <span className="text-xs opacity-75">
                  {formattedTime}
                </span>
                {isCurrentUser && (
                  <span className="ml-1">
                    {msg.isRead ? '✓✓' : '✓'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !selectedConversation) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar with conversations */}
      <div className="w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No conversations yet
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv._id}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 flex items-center ${
                  selectedConversation?._id === conv._id ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedConversation(conv)}
              >
                <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center mr-3">
                  {conv.participant.firstName?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium truncate">
                      {conv.participant.firstName} {conv.participant.lastName}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {conv.lastMessage?.createdAt 
                        ? format(new Date(conv.lastMessage.createdAt), 'MMM d')
                        : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500 truncate">
                      {conv.lastMessage?.content || 'No messages yet'}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="hidden md:flex flex-col flex-1">
        {selectedConversation ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-gray-200 bg-white flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center mr-3">
                {selectedConversation.participant.firstName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-medium">
                  {selectedConversation.participant.firstName}{' '}
                  {selectedConversation.participant.lastName}
                </h2>
                <p className="text-xs text-gray-500">
                  {isTyping ? 'typing...' : 'Online'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div 
              className="flex-1 overflow-y-auto p-4 bg-gray-50"
              onClick={markMessagesAsRead}
            >
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map(renderMessage)}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="w-full border border-gray-300 rounded-full pl-4 pr-12 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FiPaperclip className="h-5 w-5" />
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className={`ml-2 p-2 rounded-full ${
                    message.trim() 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <FiSend className="h-5 w-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center p-6 max-w-md">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                <FiMessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
              <p className="text-gray-500">
                Select a conversation or start a new one to begin messaging.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
