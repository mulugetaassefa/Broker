import React, { useState, useEffect } from 'react';
import { FiBell, FiCheck, FiTrash2, FiClock } from 'react-icons/fi';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('unread');
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    // Simulate API call to fetch notifications
    const fetchNotifications = () => {
      setTimeout(() => {
        setNotifications([
          {
            id: 1,
            title: 'New message from John',
            message: 'Hi there! I\'m interested in your property in Bole.',
            type: 'message',
            read: false,
            date: '2023-08-15T10:30:00',
            sender: 'John Doe'
          },
          {
            id: 2,
            title: 'Property approved',
            message: 'Your property listing has been approved and is now live.',
            type: 'approval',
            read: false,
            date: '2023-08-14T15:45:00'
          },
          {
            id: 3,
            title: 'New feature available',
            message: 'Check out our new property comparison tool!',
            type: 'announcement',
            read: true,
            date: '2023-08-12T09:15:00'
          },
          {
            id: 4,
            title: 'Viewing scheduled',
            message: 'A viewing has been scheduled for your property on Aug 20th at 2:00 PM.',
            type: 'viewing',
            read: true,
            date: '2023-08-10T11:20:00'
          }
        ]);
        setLoading(false);
      }, 800);
    };

    fetchNotifications();
  }, []);

  const markAsRead = (id) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
    setSelected(selected.filter(item => item !== id));
  };

  const markSelectedAsRead = () => {
    setNotifications(notifications.map(notification => 
      selected.includes(notification.id) ? { ...notification, read: true } : notification
    ));
    setSelected([]);
  };

  const deleteSelected = () => {
    setNotifications(notifications.filter(notification => 
      !selected.includes(notification.id)
    ));
    setSelected([]);
  };

  const toggleSelect = (id) => {
    setSelected(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const filteredNotifications = notifications.filter(notification => 
    activeTab === 'all' || 
    (activeTab === 'unread' && !notification.read) ||
    (activeTab === 'read' && notification.read)
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          <FiBell className="h-5 w-5" />
        </div>;
      case 'approval':
        return <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
          <FiCheck className="h-5 w-5" />
        </div>;
      case 'viewing':
        return <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
          <FiClock className="h-5 w-5" />
        </div>;
      default:
        return <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
          <FiBell className="h-5 w-5" />
        </div>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your notification preferences</p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="border-b border-gray-200">
          <div className="px-4 py-4 sm:px-6 flex justify-between items-center">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'all' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'unread' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Unread
              </button>
              <button
                onClick={() => setActiveTab('read')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'read' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Read
              </button>
            </div>
            
            {selected.length > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={markSelectedAsRead}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiCheck className="mr-2 h-4 w-4" />
                  Mark as read
                </button>
                <button
                  onClick={deleteSelected}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <FiTrash2 className="mr-2 h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <FiBell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === 'all' 
                  ? 'You don\'t have any notifications yet.'
                  : `You don't have any ${activeTab} notifications.`}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <li key={notification.id} className={`hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-center px-4 py-4 sm:px-6">
                    <div className="min-w-0 flex-1 flex items-center">
                      <div className="flex-shrink-0">
                        <input
                          id={`notification-${notification.id}`}
                          name="notification"
                          type="checkbox"
                          checked={selected.includes(notification.id)}
                          onChange={() => toggleSelect(notification.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          {getNotificationIcon(notification.type)}
                          <div className="ml-3">
                            <p className={`text-sm font-medium ${
                              !notification.read ? 'text-gray-900' : 'text-gray-500'
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {notification.message}
                            </p>
                            <div className="mt-1 flex items-center text-xs text-gray-500">
                              <FiClock className="mr-1 h-3 w-3" />
                              {formatDate(notification.date)}
                              {notification.sender && (
                                <span className="ml-2">• From: {notification.sender}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="ml-4">
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
                        >
                          Mark as read
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
