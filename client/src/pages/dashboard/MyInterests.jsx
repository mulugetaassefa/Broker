import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiEdit, FiTrash2, FiPlus, FiSearch } from 'react-icons/fi';
import api from '../../services/api';
import InterestForm from '../../components/interests/InterestForm';

const statusBadges = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

const MyInterests = () => {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInterest, setEditingInterest] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: ''
  });

  const fetchInterests = async () => {
    try {
      setLoading(true);
      const response = await api.interests.getMine(filters);
      console.log('Interests data:', response.data); // Debug log
      setInterests(response.data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load interests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterests();
  }, [filters]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this interest?')) {
      try {
        setIsDeleting(true);
        await api.interests.delete(id);
        toast.success('Interest deleted successfully');
        fetchInterests(); // Refresh the list
      } catch (error) {
        console.error('Error deleting interest:', error);
        toast.error('Failed to delete interest');
      } finally {
        setIsDeleting(false);
      }
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
    fetchInterests(); // Refresh the list
  };

  // If we're showing the form, render just the form
  if (showForm) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Create New Interest</h1>
          <button
            onClick={() => setShowForm(false)}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to My Interests
          </button>
        </div>
        <InterestForm onSuccess={handleInterestCreated} />
      </div>
    );
  }

  // If we're editing an interest, show the edit form
  if (editingInterest) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Edit Interest</h1>
          <button
            onClick={() => setEditingInterest(null)}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to My Interests
          </button>
        </div>
        <InterestForm 
          interest={editingInterest} 
          onSuccess={handleUpdateSuccess} 
        />
      </div>
    );
  }

  // Otherwise, render the interests list
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Interests</h1>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
            onChange={(e) => setFilters({...filters, status: e.target.value})}
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
            onChange={(e) => setFilters({...filters, type: e.target.value})}
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
              onChange={(e) => setFilters({...filters, search: e.target.value})}
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
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiPlus className="mr-2" /> Create Your First Interest
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {interests.map((interest) => (
            <div key={interest._id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Image Section */}
                <div className="w-full md:w-48 flex-shrink-0">
                  {interest.images?.[0] ? (
                    <img 
                      src={typeof interest.images[0] === 'string' 
                        ? interest.images[0] 
                        : interest.images[0].url || interest.images[0].path
                      }
                      alt={interest.type || 'Interest image'}
                      className="h-48 w-full object-cover rounded-lg"
                      onError={(e) => {
                        console.error('Failed to load image:', e.target.src);
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2QxZDVkYiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xOC44NSA5LjQyTDEyIDIuMTIgNS4xNSA5LjQyQzQuMzYgMTAuMTkgNC4zNiAxMS40OSA1LjE1IDEyLjI4TDExLjIyIDE4LjM1QzExLjYyIDE4Ljc1IDEyLjI1IDE4Ljc1IDEyLjY1IDE4LjM1TDE4Ljg1IDEyLjI4QzE5LjY0IDExLjQ5IDE5LjY0IDEwLjE5IDE4Ljg1IDkuNDJaIj48L3BhdGg+PHBhdGggZD0iTTkgMTJIMTUiPjwvcGF0aD48L3N2Zz4=';
                      }}
                    />
                  ) : (
                    <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                      <span>No Image</span>
                    </div>
                  )}
                </div>
                
                {/* Details Section */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">
                        {interest.type || 'Untitled Interest'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {interest.notes || 'No additional notes'}
                      </p>
                      
                      {/* Additional Details */}
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
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${statusBadges[interest.status] || 'bg-gray-100 text-gray-800'}`}>
                            {interest.status ? interest.status.replace('_', ' ') : 'N/A'}
                          </span>
                        </div>
                      </div>
                      {/* Rejection reason (if any) */}
                      {interest.status === 'rejected' && interest.rejectionReason && (
                        <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
                          <div className="font-semibold">Rejection reason</div>
                          <div className="mt-1 whitespace-pre-wrap">{interest.rejectionReason}</div>
                          {interest.rejectedAt && (
                            <div className="text-xs text-red-500 mt-1">Rejected: {new Date(interest.rejectedAt).toLocaleString?.()}</div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
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
