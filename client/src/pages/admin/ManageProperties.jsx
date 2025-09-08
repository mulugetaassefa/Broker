import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const ManageProperties = () => {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleUpdateStatus = async (id, nextStatus) => {
    try {
      let reason;
      if (nextStatus === 'rejected') {
        reason = window.prompt('Enter rejection reason (optional):') || '';
      }
      console.log('[ManageInterests] Update status', { id, nextStatus, reason });
      await api.interests.updateStatus(id, nextStatus, reason);
      // Optimistic update
      setInterests((prev) => prev.map((it) => (
        it._id === id
          ? { ...it, status: nextStatus, rejectionReason: nextStatus === 'rejected' ? reason || null : null, rejectedAt: nextStatus === 'rejected' ? new Date().toISOString() : null }
          : it
      )));
    } catch (err) {
      console.error('Failed to update interest status:', err);
    }
  };

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        setLoading(true);
        const params = {
          page: currentPage,
          limit: 10,
        };
        if (statusFilter !== 'all') params.status = statusFilter; // pending | in_progress | completed | rejected

        console.log('[ManageInterests] Fetch with params:', params);
        const response = await api.interests.getAll(params);
        console.log('[ManageInterests] /interests/all response:', response);

        // interests.getAll returns response.data already (see api.js), not axios response
        const payload = response;
        setInterests(payload?.data || []);
        // No pagination in controller yet; derive simple paging fallback
        setTotalPages(payload?.totalPages || 1);
      } catch (error) {
        console.error('Error fetching interests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInterests();
  }, [currentPage, statusFilter, user?.role]);

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when changing filters
  };

  const filteredInterests = interests.filter((it) => {
    const term = searchTerm.toLowerCase();
    return (
      it?.type?.toLowerCase?.().includes(term) ||
      it?.transactionType?.toLowerCase?.().includes(term) ||
      it?.notes?.toLowerCase?.().includes(term) ||
      it?.user?.firstName?.toLowerCase?.().includes(term) ||
      it?.user?.lastName?.toLowerCase?.().includes(term) ||
      it?.user?.email?.toLowerCase?.().includes(term)
    );
  });

  if (loading) {
    return <div>Loading interests...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Properties</h2>
        <div className="flex space-x-4">
          <select 
            value={statusFilter}
            onChange={handleStatusChange}
            className="border rounded px-3 py-1"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
          <input
            type="text"
            placeholder="Search interests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded px-3 py-1 w-64"
          />
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="divide-y divide-gray-200">
          {filteredInterests.length > 0 ? (
            filteredInterests.map((it) => (
              <div key={it._id} className="bg-white hover:bg-gray-50 transition-colors p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">
                        {it.type || 'Property'}
                      </h3>
                      <span className="px-2.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                        {it.transactionType || 'N/A'}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        it.status === 'completed' ? 'bg-green-100 text-green-800' :
                        it.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        it.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {it.status?.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="space-y-1.5">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Budget:</span> ETB 
                        {it.priceRange?.min?.toLocaleString?.()} - {it.priceRange?.max?.toLocaleString?.()}
                      </p>
                      
                      {it.otherDetails?.itemType && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Item:</span> {it.otherDetails.itemType}
                          {it.otherDetails.condition && ` (${it.otherDetails.condition})`}
                        </p>
                      )}
                      
                      {it.notes && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {it.notes}
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-2">
                        <span className="font-medium">Submitted:</span> {formatDate(it.createdAt)}
                      </p>
                      
                      {it.status === 'rejected' && it.rejectionReason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-sm text-red-700">
                          <span className="font-medium">Rejection Reason:</span> {it.rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-4 sm:mt-0">
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1.5 text-xs rounded bg-green-600 text-white hover:bg-green-700 w-full sm:w-auto"
                        onClick={() => handleUpdateStatus(it._id, 'in_progress')}
                        disabled={it.status === 'in_progress' || it.status === 'completed'}
                        title="Approve"
                      >
                        Approve
                      </button>
                      <button
                        className="px-3 py-1.5 text-xs rounded bg-red-600 text-white hover:bg-red-700 w-full sm:w-auto"
                        onClick={() => handleUpdateStatus(it._id, 'rejected')}
                        disabled={it.status === 'rejected'}
                        title="Reject"
                      >
                        Reject
                      </button>
                    </div>
                    <button
                      className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 w-full sm:w-auto"
                      onClick={() => handleUpdateStatus(it._id, 'completed')}
                      disabled={it.status === 'completed'}
                      title="Mark as Complete"
                    >
                      Complete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              No properties found
            </div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  currentPage === page
                    ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
};

export default ManageProperties;
