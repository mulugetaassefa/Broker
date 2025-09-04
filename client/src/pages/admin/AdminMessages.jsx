import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSend, FiPaperclip, FiMessageSquare, FiUser, FiArrowLeft, FiMail, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [attachments, setAttachments] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const { socket, joinConversation, leaveConversation } = useSocket();
  const navigate = useNavigate();

  // Fetch all conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        console.log('Fetching conversations...');
        
        const response = await api.messages.getConversations();
        console.log('Conversations API response:', response);
        
        if (response && response.data) {
          setConversations(response.data);
          
          // Select the first conversation by default if none is selected
          if (response.data.length > 0 && !selectedConversation) {
            console.log('Setting initial conversation:', response.data[0]);
            setSelectedConversation(response.data[0]);
            await fetchMessages(response.data[0]._id);
          }
        } else {
          console.error('Invalid response format:', response);
          toast.error('Failed to load conversations: Invalid response format');
        }
      } catch (error) {
        console.error('Error fetching conversations:', {
          message: error.message,
          response: error.response?.data,
          stack: error.stack
        });
        
        const errorMessage = error.response?.data?.message || 'Failed to load conversations';
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const fetchMessages = async (conversationId) => {
    if (!conversationId) {
      console.error('No conversation ID provided');
      return;
    }
    
    try {
      console.log('Fetching messages for conversation:', conversationId);
      const response = await api.messages.getMessages(conversationId);
      console.log('Messages API response:', response);
      
      if (response && response.data) {
        setMessages(Array.isArray(response.data) ? response.data : []);
        scrollToBottom();
      } else {
        console.error('Invalid messages response format:', response);
        toast.error('Failed to load messages: Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching messages:', {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      
      const errorMessage = error.response?.data?.message || 'Failed to load messages';
      toast.error(errorMessage);
    }
  };

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    await fetchMessages(conversation._id);
    
    // Join the conversation room
    joinConversation(conversation._id);
    
    // Set up WebSocket listener for new messages
    const handleNewMessage = (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
      scrollToBottom();
    };
    
    socket?.on('new_message', handleNewMessage);
    
    // Clean up
    return () => {
      leaveConversation(conversation._id);
      socket?.off('new_message', handleNewMessage);
    };
  };

  // Handle new incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      // Only add the message if it belongs to the current conversation
      if (selectedConversation?._id === newMessage.conversationId) {
        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();
      }
      
      // Update conversations list to show new message preview
      setConversations(prev => 
        prev.map(conv => {
          if (conv._id === newMessage.conversationId) {
            return {
              ...conv,
              lastMessage: newMessage,
              unreadCount: conv._id === selectedConversation?._id 
                ? 0 
                : (conv.unreadCount || 0) + 1
            };
          }
          return conv;
        })
      );
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, selectedConversation]);

  // Join conversation room when selected
  useEffect(() => {
    if (selectedConversation?._id && socket) {
      joinConversation(selectedConversation._id);
      
      // Mark messages as read when conversation is selected
      const markMessagesAsRead = async () => {
        try {
          await api.messages.markAsRead(selectedConversation._id);
          
          // Update local state to reflect read status
          setMessages(prev => 
            prev.map(msg => ({
              ...msg,
              isRead: true
            }))
          );
          
          // Update conversations list to reset unread count
          setConversations(prev => 
            prev.map(conv => 
              conv._id === selectedConversation._id 
                ? { ...conv, unreadCount: 0 }
                : conv
            )
          );
          
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      };
      
      markMessagesAsRead();
      
      return () => {
        leaveConversation(selectedConversation._id);
      };
    }
  }, [selectedConversation?._id, socket, joinConversation, leaveConversation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && attachments.length === 0) || sending) return;

    let optimisticMessage;
    
    try {
      setSending(true);
      
      // Handle file uploads if any
      const uploadedAttachments = [];
      
      if (attachments.length > 0) {
        const formData = new FormData();
        attachments.forEach(file => {
          formData.append('files', file);
        });
        
        const { data } = await api.upload.uploadImages(formData);
        uploadedAttachments.push(...data);
      }

      // Create optimistic message
      optimisticMessage = {
        _id: `temp-${Date.now()}`,
        content: newMessage.trim(),
        sender: {
          _id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        },
        attachments: uploadedAttachments,
        conversationId: selectedConversation._id,
        receiver: selectedConversation.participant._id,
        isAdminReply: true,
        isRead: true,
        createdAt: new Date().toISOString()
      };

      // Update UI optimistically
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');
      setAttachments([]);
      scrollToBottom();

      // Send the actual message
      await api.messages.sendAdminReply({
        content: newMessage.trim(),
        conversationId: selectedConversation._id,
        receiverId: selectedConversation.participant._id,
        attachments: uploadedAttachments
      });

      // Refresh conversations list to update last message
      const { data } = await api.messages.getConversations();
      setConversations(data);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      
      // Remove optimistic message on error
      if (optimisticMessage) {
        setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
      }
      
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchQuery.toLowerCase();
    const userName = `${conv.participant?.firstName || ''} ${conv.participant?.lastName || ''}`.toLowerCase();
    const lastMessage = conv.lastMessage?.content?.toLowerCase() || '';
    const email = conv.participant?.email?.toLowerCase() || '';
    
    return userName.includes(searchLower) || 
           lastMessage.includes(searchLower) || 
           email.includes(searchLower);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-full flex bg-white rounded-lg shadow overflow-hidden">
      {/* Sidebar */}
      <div className={`${selectedConversation ? 'hidden md:block md:w-1/3' : 'w-full md:w-1/3'} border-r border-gray-200 flex flex-col`}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Messages</h2>
          <div className="mt-2 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No conversations found</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredConversations.map((conversation) => (
                <li 
                  key={conversation._id}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                    selectedConversation?._id === conversation._id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSelectConversation(conversation)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <FiUser className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.participant?.firstName} {conversation.participant?.lastName}
                        </p>
                        <span className="text-xs text-gray-500">
                          {conversation.lastMessage && formatDate(conversation.lastMessage.createdAt)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600 truncate max-w-[180px]">
                          {conversation.lastMessage?.content || 'No messages yet'}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 text-white text-xs font-medium">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Message Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          <div className="border-b border-gray-200 px-4 py-4 sm:px-6 flex items-center bg-white sticky top-0 z-10">
            <button 
              onClick={() => setSelectedConversation(null)} 
              className="md:hidden mr-2 p-1 rounded-full hover:bg-gray-100"
            >
              <FiArrowLeft className="h-5 w-5 text-gray-500" />
            </button>
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FiUser className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-base font-medium text-gray-900">
                  {selectedConversation.participant?.firstName} {selectedConversation.participant?.lastName}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedConversation.participant?.email}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <p>No messages in this conversation yet.</p>
              </div>
            ) : (
              messages.map((message) => (
                <div 
                  key={message._id} 
                  className={`flex ${message.sender._id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg px-4 py-2 ${
                      message.sender._id === user.id 
                        ? 'bg-blue-500 text-white rounded-br-none' 
                        : 'bg-white border border-gray-200 rounded-bl-none'
                    }`}
                  >
                    <div className="text-sm">{message.content}</div>
                    
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((file, idx) => (
                          <div key={idx} className="bg-black bg-opacity-10 p-2 rounded">
                            <a 
                              href={file.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline break-all"
                            >
                              {file.fileName || `Attachment ${idx + 1}`}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className={`text-xs mt-1 text-right ${
                      message.sender._id === user.id ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {new Date(message.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200 p-4 bg-white">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {attachments.map((file, index) => (
                  <div 
                    key={index}
                    className="flex items-center bg-gray-50 rounded border border-gray-200 px-2 py-1 text-xs"
                  >
                    <span className="truncate max-w-xs">{file.name}</span>
                    <button 
                      onClick={() => removeAttachment(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <form onSubmit={handleSendMessage} className="flex items-center">
              <div className="relative flex-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Attach file"
                >
                  <FiPaperclip className="h-5 w-5" />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple
                  />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={(!newMessage.trim() && attachments.length === 0) || sending}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {sending ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  <>
                    <FiSend className="h-5 w-5" />
                    <span className="sr-only">Send</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center">
            <FiMessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No conversation selected</h3>
            <p className="mt-1 text-sm text-gray-500">
              Select a conversation from the list to view messages
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
