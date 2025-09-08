import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiArrowLeft, FiEdit, FiTrash2, FiMessageSquare, FiUser, FiImage } from 'react-icons/fi';
import api from '../../services/api';

const statusBadges = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

const typeLabels = {
  house: 'House',
  car: 'Car',
  other: 'Other'
};

const transactionTypeLabels = {
  buy: 'Buy',
  rent: 'Rent',
  sell: 'Sell',
  lease: 'Lease'
};

const InterestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interest, setInterest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [status, setStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [imageLoading, setImageLoading] = useState({});

  // Format date helper function
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get full image URL
  const getImageUrl = (image) => {
    if (!image) {
      console.warn('No image provided to getImageUrl');
      return '';
    }

    // If it's already a full URL or data URL, return as is
    if (typeof image === 'string' && (image.startsWith('http') || image.startsWith('blob:') || image.startsWith('data:'))) {
      return image;
    }

    // Handle direct URL objects
    if (image?.url) {
      return image.url;
    }

    // Extract filename from different possible locations
    let filename = '';
    
    if (typeof image === 'string') {
      // If it's a full path, extract just the filename
      filename = image.split('/').pop() || image;
    } else if (image?.path) {
      // Handle image objects with path
      filename = image.path.split('/').pop() || image.path.split('\\\\').pop() || '';
    } else if (image?.filename) {
      // Handle image objects with filename
      filename = image.filename;
    } else if (image?.originalname) {
      // For file objects
      return URL.createObjectURL(image);
    }

    // If we have a filename, construct the full URL
    if (filename) {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      // Remove any leading slashes from the filename
      const cleanFilename = filename.replace(/^[\\/]+/, '');
      // Construct the URL without /api prefix
      return `${baseUrl}/uploads/interests/${cleanFilename}`;
    }

    console.warn('Could not determine image URL for:', image);
    return '';
  };

  // Handle image load error
  const handleImageError = (index) => {
    setImageLoading(prev => ({ ...prev, [index]: 'error' }));
  };

  // Handle image load success
  const handleImageLoad = (index) => {
    setImageLoading(prev => ({ ...prev, [index]: 'loaded' }));
  };

  useEffect(() => {
    const fetchInterest = async () => {
      try {
        setLoading(true);
        const [interestRes, userRes] = await Promise.all([
          api.interests.getById(id),
          api.auth.me()
        ]);
        
        setInterest(interestRes.data);
        setStatus(interestRes.data.status);
        setIsAdmin(userRes.data.role === 'admin');
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load interest details');
        navigate('/interests');
      } finally {
        setLoading(false);
      }
    };

    fetchInterest();
  }, [id, navigate]);

  const handleStatusUpdate = async () => {
    if (!isAdmin) return;
    
    try {
      setIsUpdating(true);
      await api.interests.updateStatus(id, status);
      toast.success('Status updated successfully');
      setInterest(prev => ({ ...prev, status }));
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this interest?')) {
      try {
        await api.interests.delete(id);
        toast.success('Interest deleted successfully');
        navigate(isAdmin ? '/admin/interests' : '/interests');
      } catch (error) {
        console.error('Error deleting interest:', error);
        toast.error('Failed to delete interest');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!interest) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Interest not found</p>
        <Link to="/interests" className="mt-4 inline-block text-blue-600 hover:underline">
          Back to My Interests
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <Link 
          to={isAdmin ? '/admin/interests' : '/interests'} 
          className="inline-flex items-center text-blue-600 hover:underline"
        >
          <FiArrowLeft className="mr-1" /> Back to {isAdmin ? 'Interests' : 'My Interests'}
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {typeLabels[interest.type] || 'Interest'} Details
            </h2>
            <div className="mt-1 flex items-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                statusBadges[interest.status] || 'bg-gray-100 text-gray-800'
              }`}>
                {interest.status.replace('_', ' ')}
              </span>
              <span className="ml-2 text-sm text-gray-500">
                Submitted on {formatDate(interest.createdAt)}
              </span>
            </div>
          </div>
          <div className="mt-4 flex space-x-3 sm:mt-0">
            <Link
              to={`/interests/edit/${interest._id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiEdit className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <FiTrash2 className="-ml-1 mr-2 h-5 w-5" />
              Delete
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Interest Information</h3>
              <div className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">{interest.type}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Transaction Type</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">
                    {transactionTypeLabels[interest.transactionType] || interest.transactionType}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Price Range</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {interest.priceRange?.currency || 'ETB'} {interest.priceRange?.min?.toLocaleString() || '0'} - 
                    {interest.priceRange?.max ? ` ${interest.priceRange.currency || 'ETB'} ${interest.priceRange.max.toLocaleString()}` : ' Any'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Additional Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                    {interest.notes || 'No additional notes provided.'}
                  </dd>
                </div>
              </div>
            </div>

            {/* Right Column - Images */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Images</h3>
              {interest.images && interest.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {interest.images.map((image, index) => {
                    const imageUrl = getImageUrl(image);
                    const isLoading = imageLoading[index] === undefined;
                    const hasError = imageLoading[index] === 'error';
                    
                    return (
                      <div key={index} className="relative group aspect-square">
                        {isLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                            <div className="animate-pulse flex flex-col items-center">
                              <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          </div>
                        )}
                        {hasError ? (
                          <div className="h-full w-full flex flex-col items-center justify-center bg-gray-100 rounded-lg p-4 text-center">
                            <FiImage className="h-8 w-8 text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500">Image not available</span>
                          </div>
                        ) : (
                          <>
                            <img
                              src={imageUrl}
                              alt={`${interest.type} ${index + 1}`}
                              className={`w-full h-full object-cover rounded-lg transition-opacity duration-200 ${
                                isLoading ? 'opacity-0' : 'opacity-100'
                              }`}
                              onLoad={() => handleImageLoad(index)}
                              onError={() => handleImageError(index)}
                            />
                            <a
                              href={imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-lg"
                              onClick={(e) => hasError && e.preventDefault()}
                            >
                              <span className="text-white text-sm font-medium">
                                {hasError ? 'Image Unavailable' : 'View Full Size'}
                              </span>
                            </a>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <FiImage className="mx-auto h-12 w-12 text-gray-400" />
                  <h4 className="mt-2 text-sm font-medium text-gray-900">No images</h4>
                  <p className="mt-1 text-sm text-gray-500">No images were uploaded with this interest.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiUser className="h-10 w-10 text-gray-400" />
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-medium text-gray-900">
                {interest.user?.name || 'Unknown User'}
              </h4>
              <p className="text-sm text-gray-500">
                {interest.user?.email || 'No email provided'}
              </p>
              {interest.user?.phone && (
                <p className="text-sm text-gray-500">{interest.user.phone}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterestDetail;
