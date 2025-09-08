import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiImage } from 'react-icons/fi';
import api from '../../services/api';
import InterestForm from '../../components/interests/InterestForm';

// Helper function to safely get image URL
const getImageUrl = (image) => {
  if (!image) {
    console.warn('No image provided to getImageUrl');
    return '';
  }
  
  console.log('Processing image:', image);
  
  try {
    // If it's already a full URL, return as is
    if (typeof image === 'string') {
      // If it's already a full URL or data URL
      if (image.startsWith('http') || image.startsWith('blob:') || image.startsWith('data:')) {
        return image;
      }
      // If it's a relative path, make it absolute
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const cleanPath = image.replace(/^[\/]+/, ''); // Remove leading slashes
      return `${baseUrl}/${cleanPath}`;
    }
    
    // Handle file objects (from file input)
    if (image instanceof File || image?.originalname) {
      try {
        return URL.createObjectURL(image);
      } catch (e) {
        console.warn('Failed to create object URL:', e);
        return '';
      }
    }
    
    // Handle image objects with url/path/filename
    if (image?.url) {
      const url = image.url.startsWith('http') ? image.url : 
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${image.url.replace(/^[\/]+/, '')}`;
      console.log('Using URL from image object:', url);
      return url;
    }
    
    // Handle path or filename
    const path = image?.path || image?.filename || '';
    if (path) {
      if (path.startsWith('http')) {
        console.log('Using full HTTP path:', path);
        return path;
      }
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const cleanPath = path.replace(/^[\/]+/, '');
      const fullUrl = `${baseUrl}/${cleanPath}`;
      console.log('Constructed URL from path:', { baseUrl, path, cleanPath, fullUrl });
      return fullUrl;
    }
    
    return '';
  } catch (error) {
    console.error('Error getting image URL:', error);
    return '';
  }
};

const statusBadges = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const MyInterests = () => {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editingInterest, setEditingInterest] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: '',
  });

  const fetchInterests = async () => {
    try {
      setLoading(true);
      const response = await api.interests.getMine(filters);
      console.log('Interests data:', response.data); // debug
      setInterests(response.data || []);
    } catch (error) {
      console.error('Error fetching interests:', error);
      toast.error('Failed to load interests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterests();
  }, [filters]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this interest?')) return;

    try {
      setIsDeleting(true);
      await api.interests.delete(id);
      toast.success('Interest deleted successfully');
      fetchInterests();
    } catch (error) {
      console.error('Error deleting interest:', error);
      toast.error('Failed to delete interest');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (interest) => {
    setEditingInterest(interest);
  };

  const handleUpdateSuccess = () => {
    setEditingInterest(null);
    fetchInterests();
  };

  const handleInterestCreated = () => {
    setShowForm(false);
    fetchInterests();
  };

  // 🔹 Render create form
  if (showForm) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Create New Interest</h1>
          <button onClick={() => setShowForm(false)} className="text-gray-600 hover:text-gray-800">
            ← Back to My Interests
          </button>
        </div>
        <InterestForm onSuccess={handleInterestCreated} />
      </div>
    );
  }

  // 🔹 Render edit form
  if (editingInterest) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Edit Interest</h1>
          <button onClick={() => setEditingInterest(null)} className="text-gray-600 hover:text-gray-800">
            ← Back to My Interests
          </button>
        </div>
        <InterestForm interest={editingInterest} onSuccess={handleUpdateSuccess} />
      </div>
    );
  }

  // 🔹 Render interests list
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Interests</h1>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <FiPlus className="mr-2" /> Create Interest
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            name="status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="input"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            name="type"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="input"
          >
            <option value="">All Types</option>
            <option value="house">House</option>
            <option value="car">Car</option>
            <option value="other">Other</option>
          </select>

          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search..."
              className="input pl-10"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : interests.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">No interests found</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <FiPlus className="mr-2" /> Create Your First Interest
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {interests.map((interest) => (
            <div key={interest._id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="w-full">
                {/* Details */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">
                        {interest.type || 'Untitled Interest'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {interest.notes || 'No additional notes'}
                      </p>

                      {/* Extra fields */}
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        {interest.priceRange?.min > 0 && (
                          <div className="flex items-center">
                            <span className="font-medium text-gray-700">Min Price:</span>
                            <span className="ml-2">ETB {interest.priceRange.min.toLocaleString()}</span>
                          </div>
                        )}
                        {interest.priceRange?.max > 0 && (
                          <div className="flex items-center">
                            <span className="font-medium text-gray-700">Max Price:</span>
                            <span className="ml-2">ETB {interest.priceRange.max.toLocaleString()}</span>
                          </div>
                        )}
                        {interest.budget && (
                          <div className="flex items-center">
                            <span className="font-medium text-gray-700">Budget:</span>
                            <span className="ml-2">ETB {interest.budget.toLocaleString()}</span>
                          </div>
                        )}
                        {interest.location && (
                          <div className="flex items-center">
                            <span className="font-medium text-gray-700">Location:</span>
                            <span className="ml-2">{interest.location}</span>
                          </div>
                        )}
                        {interest.preferredContact && (
                          <div className="flex items-center">
                            <span className="font-medium text-gray-700">Contact:</span>
                            <span className="ml-2">{interest.preferredContact}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <span className="font-medium text-gray-700">Status:</span>
                          <span
                            className={`ml-2 px-2 py-1 rounded-full text-xs ${
                              statusBadges[interest.status] || 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {interest.status ? interest.status.replace('_', ' ') : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Rejection info */}
                      {interest.status === 'rejected' && interest.rejectionReason && (
                        <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
                          <div className="font-semibold">Rejection reason</div>
                          <div className="mt-1 whitespace-pre-wrap">{interest.rejectionReason}</div>
                          {interest.rejectedAt && (
                            <div className="text-xs text-red-500 mt-1">
                              Rejected: {new Date(interest.rejectedAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(interest)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                        title="Edit"
                        disabled={isDeleting}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(interest._id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                        title="Delete"
                        disabled={isDeleting}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="mt-3 text-xs text-gray-500">
                    Created: {new Date(interest.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyInterests;
