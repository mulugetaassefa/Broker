import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api, { apiInstance } from '../../services/api';

const ManageProperties = () => {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');

  // Build absolute URL for images served from server '/uploads/'
  const getUploadsUrl = (imgObj) => {
    try {
      if (!imgObj) return '';
      
      // If it's already a full URL, return as is
      if (typeof imgObj === 'string' && (imgObj.startsWith('http://') || imgObj.startsWith('https://'))) {
        return imgObj;
      }
      
      // Handle different image object structures
      let rawPath = '';
      if (typeof imgObj === 'string') {
        rawPath = imgObj;
      } else if (imgObj?.url) {
        rawPath = imgObj.url;
      } else if (imgObj?.path) {
        rawPath = imgObj.path;
      } else if (imgObj?.originalname) {
        return URL.createObjectURL(imgObj);
      }
      
      // If we still don't have a path, return empty
      if (!rawPath) return '';
      
      // Normalize path and handle different formats
      let cleanPath = rawPath
        .replace(/\\/g, '/')
        .replace(/^\/\/+/, '')
        .replace(/^public\//, '');
      
      // If it's not already a full URL, construct it
      if (!cleanPath.startsWith('http')) {
        const base = (apiInstance?.defaults?.baseURL || window.location.origin).replace(/\/$/, '');
        const origin = base.endsWith('/api') ? base.slice(0, -4) : base;
        
        // Handle different path patterns
        if (!cleanPath.startsWith('uploads/') && !cleanPath.startsWith('http')) {
          cleanPath = `uploads/${cleanPath.includes('interests') ? '' : 'interests/'}${cleanPath}`
            .replace('uploads//', 'uploads/');
        }
        
        const finalUrl = `${origin}/${cleanPath}`.replace(/([^:]\/)\/+/g, '$1');
        console.log('Generated image URL:', finalUrl);
        return finalUrl;
      }
      
      return cleanPath;
    } catch (error) {
      console.error('Error generating image URL:', error, 'Image object:', imgObj);
      return '';
    }
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
        console.log('[ManageInterests] /api/interests/all response:', response);

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
        <ul className="divide-y divide-gray-200">
          {filteredInterests.length > 0 ? (
            filteredInterests.map((it) => (
              <li key={it._id}>
                <div className="px-4 py-4 grid grid-cols-12 gap-4 items-stretch">
                  {/* Images */}
                  <div className="col-span-12 md:col-span-3">
                    {Array.isArray(it.images) && it.images.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {it.images.slice(0, 4).map((img, idx) => {
                          const url = getUploadsUrl(img);
                          if (!url) return null;
                          
                          return (
                            <div key={idx} className="relative group w-16 h-16 sm:w-20 sm:h-20">
                              <a 
                                href={url} 
                                target="_blank" 
                                rel="noreferrer noopener"
                                className="block w-full h-full"
                              >
                                <div className="relative w-full h-full overflow-hidden rounded-md border border-gray-200 bg-gray-50 hover:border-blue-300 transition-colors">
                                  <img
                                    src={url}
                                    alt={img.originalname || `Property image ${idx + 1}`}
                                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                    loading="lazy"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzljYTVhYSI+PHBhdGggZD0iTTE5IDV2MTRINVY1aDhtMC0ySDVjLTEuMSAwLTIgLjktMiAydjE0YzAgMS4xLjkgMiAyIDJoMTRjMS4xIDAgMi0uOSAyLTJWNWMwLTEuMS0uOS0yLTItMnoiLz48cGF0aCBkPSJNMTAuODQgOS45OEg4LjgyTjcgMTNoMS41djVoMnYtNWgxLjY3TDEyIDkuOTh6Ii8+PC9zdmc+';
                                      e.target.className = 'w-full h-full object-contain p-2';
                                    }}
                                  />
                                </div>
                                {it.images.length > 4 && idx === 3 && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 text-white text-xs font-semibold">
                                    +{it.images.length - 4}
                                  </div>
                                )}
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 h-full flex items-center">No images</div>
                    )}
                  </div>

                  {/* Main info */}
                  <div className="col-span-12 md:col-span-7 min-w-0 flex flex-col">
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      {it.type?.toUpperCase?.()} • {it.transactionType}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {it.user?.firstName} {it.user?.lastName} • {it.user?.email} • {it.user?.phone}
                    </p>
                    <p className="text-sm text-gray-500">
                      Budget: {it.priceRange?.currency || 'ETB'} {it.priceRange?.min?.toLocaleString?.()} - {it.priceRange?.max?.toLocaleString?.()}
                    </p>
                    {it.notes && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{it.notes}</p>
                    )}

                    {/* Rejection reason */}
                    {it.status === 'rejected' && it.rejectionReason && (
                      <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
                        <div className="font-semibold">Rejection reason</div>
                        <div>{it.rejectionReason}</div>
                        {it.rejectedAt && (
                          <div className="text-[10px] text-red-500 mt-1">Rejected: {new Date(it.rejectedAt).toLocaleString?.()}</div>
                        )}
                      </div>
                    )}

                    {/* Type specific details */}
                    <div className="mt-2 text-xs text-gray-500 space-y-1">
                      {it.type === 'house' && (
                        <div>
                          Rooms: {it.houseDetails?.numRooms ?? '-'}, Bath: {it.houseDetails?.numBathrooms ?? '-'}, Parking: {it.houseDetails?.hasParking ? 'Yes' : 'No'}, Garden: {it.houseDetails?.hasGarden ? 'Yes' : 'No'}
                        </div>
                      )}
                      {it.type === 'car' && (
                        <div>
                          Model: {it.carDetails?.model || '-'}, Year: {it.carDetails?.year || '-'}, Mileage: {it.carDetails?.mileage || '-'} km, Transmission: {it.carDetails?.transmission || '-'}
                        </div>
                      )}
                      {it.type === 'other' && (
                        <div>
                          Item: {it.otherDetails?.itemType || '-'}, Condition: {it.otherDetails?.condition || '-'}
                        </div>
                      )}
                      <div>Submitted: {it.createdAtFormatted || new Date(it.createdAt).toLocaleString?.()}</div>
                    </div>
                  </div>

                  {/* Actions and status */}
                  <div className="col-span-12 md:col-span-2 flex md:flex-col gap-2 items-stretch md:items-end justify-between md:text-right h-full">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      it.status === 'completed' ? 'bg-green-100 text-green-800' :
                      it.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      it.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {it.status}
                    </span>
                    <div className="flex gap-2 md:flex-col md:w-auto w-full md:items-end">
                      <button
                        className="px-3 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 w-full md:w-auto"
                        onClick={() => handleUpdateStatus(it._id, 'in_progress')}
                        disabled={it.status === 'in_progress' || it.status === 'completed'}
                        title="Approve"
                      >
                        Approve
                      </button>
                      <button
                        className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 w-full md:w-auto"
                        onClick={() => handleUpdateStatus(it._id, 'rejected')}
                        disabled={it.status === 'rejected'}
                        title="Reject"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-4 text-center text-gray-500">
              No interests found
            </li>
          )}
        </ul>
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
