import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  FiHome, 
  FiTruck, 
  FiPackage, 
  FiUser, 
  FiPhone, 
  FiMail, 
  FiMessageSquare, 
  FiSearch,
  FiCheck,
  FiX,
  FiAlertCircle
} from 'react-icons/fi';
import api from '../../services/api';

const AdminInterests = () => {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ 
    status: '', 
    type: '', 
    search: '', 
    page: 1, 
    limit: 10 
  });
  const [pagination, setPagination] = useState({ 
    totalPages: 1, 
    currentPage: 1, 
    totalItems: 0 
  });
  const [selectedInterest, setSelectedInterest] = useState(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const navigate = useNavigate();

  // Fetch interests with current filters
  const fetchInterests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare query parameters
      const params = {
        ...filters,
        populate: 'user', // Ensure user data is populated
        sort: '-createdAt' // Sort by newest first
      };

      const response = await api.interests.getAll(params);
      
      if (response && response.data) {
        setInterests(response.data);
        setPagination({
          totalPages: response.totalPages || 1,
          currentPage: response.currentPage || 1,
          totalItems: response.count || 0
        });
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching interests:', error);
      setError('Failed to load interests. Please try again later.');
      toast.error('Failed to load interests');
    } finally {
      setLoading(false);
    }
  };

  // Fetch interests when filters change
  useEffect(() => { 
    fetchInterests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Handle status update
  const handleStatusUpdate = async (id, status) => {
    try {
      await api.interests.updateStatus(id, status);
      toast.success(`Interest marked as ${status.replace('_', ' ')}`);
      fetchInterests(); // Refresh the list
    } catch (error) {
      console.error('Update failed:', error);
      toast.error(`Failed to update status: ${error.message}`);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo(0, 0);
  };

  // Message handling
  const openMessageModal = (interest) => {
    setSelectedInterest(interest);
    setMessage('');
    setShowMessageModal(true);
  };

  const closeMessageModal = () => {
    setShowMessageModal(false);
    setSelectedInterest(null);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      setIsSending(true);
      await api.messages.sendAdminReply({
        to: selectedInterest.user?._id,
        content: message,
        interestId: selectedInterest._id
      });
      
      toast.success('Message sent successfully');
      closeMessageModal();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Status and type configurations
  const statusBadges = {
    pending: { class: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    in_progress: { class: 'bg-blue-100 text-blue-800', label: 'In Progress' },
    completed: { class: 'bg-green-100 text-green-800', label: 'Completed' },
    rejected: { class: 'bg-red-100 text-red-800', label: 'Rejected' }
  };

  const typeIcons = {
    house: { icon: <FiHome className="inline mr-1" />, label: 'House' },
    car: { icon: <FiTruck className="inline mr-1" />, label: 'Car' },
    other: { icon: <FiPackage className="inline mr-1" />, label: 'Other' }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (loading && interests.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4">
          <FiAlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading interests</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={fetchInterests}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">User Interests</h1>
        <div className="text-sm text-gray-500">
          Showing {interests.length} of {pagination.totalItems} total interests
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            {Object.entries(statusBadges).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            {Object.entries(typeIcons).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <div className="relative">
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by user name, email, or interest details..."
              className="w-full p-2 pl-10 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Interests List */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        {interests.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <FiPackage className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No interests found</h3>
            <p className="text-gray-500">
              {Object.values(filters).some(Boolean) 
                ? 'Try adjusting your filters' 
                : 'No interests have been submitted yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {interests.map((interest) => (
                  <tr key={interest._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <FiUser className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {interest.user?.firstName} {interest.user?.lastName}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <FiMail className="mr-1 h-3 w-3" /> {interest.user?.email || 'N/A'}
                          </div>
                          {interest.user?.phone && (
                            <div className="text-sm text-gray-500 flex items-center">
                              <FiPhone className="mr-1 h-3 w-3" /> {interest.user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        {typeIcons[interest.type]?.icon}
                        <span className="font-medium">{typeIcons[interest.type]?.label || 'Other'}</span>
                        <span className="mx-2 text-gray-300">•</span>
                        <span className="capitalize">{interest.transactionType || 'N/A'}</span>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {interest.type === 'house' && (
                          <span>{interest.numRooms ? `${interest.numRooms} rooms` : ''}</span>
                        )}
                        {interest.type === 'car' && interest.carModel && (
                          <span>{interest.carModel} {interest.carYear ? `(${interest.carYear})` : ''}</span>
                        )}
                        {interest.type === 'other' && interest.itemType && (
                          <span>{interest.itemType}</span>
                        )}
                        {interest.priceRange && (
                          <div className="mt-1">
                            {interest.priceRange.currency || 'ETB'} {interest.priceRange.min || '0'} - {interest.priceRange.max || 'Any'}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={interest.status}
                        onChange={(e) => handleStatusUpdate(interest._id, e.target.value)}
                        className={`text-sm rounded px-2 py-1 ${statusBadges[interest.status]?.class || 'bg-gray-100'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      >
                        {Object.entries(statusBadges).map(([value, { label }]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(interest.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => openMessageModal(interest)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                        title="Message User"
                      >
                        <FiMessageSquare className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(interest._id, 'completed')}
                        className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50"
                        title="Mark as Completed"
                      >
                        <FiCheck className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(interest._id, 'rejected')}
                        className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                        title="Reject Interest"
                      >
                        <FiX className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {pagination.currentPage} of {pagination.totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className={`px-3 py-1 border rounded ${pagination.currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className={`px-3 py-1 border rounded ${pagination.currentPage === pagination.totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && selectedInterest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                Message {selectedInterest.user?.firstName} {selectedInterest.user?.lastName}
              </h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeMessageModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isSending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={isSending || !message.trim()}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-white ${
                    isSending || !message.trim()
                      ? 'bg-blue-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {isSending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInterests;
