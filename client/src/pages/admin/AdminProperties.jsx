import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiCheck, FiX, FiFilter, FiSearch, FiExternalLink, FiImage, FiXCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';

const AdminProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  // Interests state
  const [activeTab, setActiveTab] = useState('properties'); // 'properties' | 'interests'
  const [interests, setInterests] = useState([]);
  const [interestsLoading, setInterestsLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    sort: 'newest'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (activeTab === 'properties') {
      fetchProperties();
    }
  }, [filters, activeTab]);

  useEffect(() => {
    if (activeTab === 'interests') {
      fetchInterests();
    }
  }, [activeTab]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      // Build API params: omit status when set to 'all'
      const params = { ...filters };
      if (params.status === 'all') {
        delete params.status;
      }
      const response = await api.properties.getAll(params);
      // Support both {data:{data:[...]}} and {data:[...]} shapes
      const list = Array.isArray(response?.data?.data) ? response.data.data : (response?.data || []);
      setProperties(list);
    } catch (err) {
      setError('Failed to fetch properties');
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (image) => {
    if (!image) return '';
    
    // If it's already a full URL
    if (typeof image === 'string' && (image.startsWith('http') || image.startsWith('/'))) {
      return image;
    }
    
    // If it's an object with url or path
    if (typeof image === 'object' && image !== null) {
      if (image.url) return image.url;
      if (image.path) {
        const filename = image.path.split('/').pop() || image.path.split('\\').pop();
        return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/${filename}`;
      }
    }
    
    // If it's a string that's not a full URL (like a filename)
    if (typeof image === 'string') {
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/${image}`;
    }
    
    return '';
  };

  const fetchInterests = async () => {
    try {
      setInterestsLoading(true);
      console.log('Fetching interests...');
      
      // Use API service to get all interests (admin)
      const res = await api.interests.getAll({});
      console.log('Raw API response:', res);
      
      // The response should be { success, data, count, totalPages, currentPage }
      let list = [];
      
      if (res && res.success) {
        // Handle both direct data array and paginated response
        list = Array.isArray(res) ? res : (res.data || []);
        
        console.log('Processed interests list:', list.map((i, index) => ({
          index,
          _id: i._id,
          type: i.type,
          user: i.user ? {
            exists: true,
            id: i.user._id,
            name: `${i.user.firstName || ''} ${i.user.lastName || ''}`.trim() || 'No name',
            email: i.user.email || 'No email',
            phone: i.user.phone || 'No phone'
          } : { exists: false },
          imagesCount: i.images?.length || 0,
          status: i.status || 'unknown',
          priceRange: i.priceRange
        })));
      } else {
        console.error('Unexpected API response format:', res);
        toast.error('Failed to load interests: Invalid response format');
      }
      
      setInterests(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error fetching interests:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch interests');
    } finally {
      setInterestsLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.properties.updateStatus(id, status);
      setProperties(properties.map(prop => 
        prop._id === id ? { ...prop, status } : prop
      ));
      toast.success(`Property ${status} successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update property status');
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedProperties.length === 0) return;
    
    try {
      await api.patch('/admin/properties/bulk-update', {
        ids: selectedProperties,
        status: bulkAction
      });
      
      setProperties(properties.map(prop => 
        selectedProperties.includes(prop._id) 
          ? { ...prop, status: bulkAction } 
          : prop
      ));
      
      setSelectedProperties([]);
      setBulkAction('');
      toast.success(`Updated ${selectedProperties.length} properties`);
    } catch (err) {
      toast.error('Failed to perform bulk action');
    }
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProperties(properties.map(p => p._id));
    } else {
      setSelectedProperties([]);
    }
  };

  const toggleSelectProperty = (id) => {
    setSelectedProperties(prev => 
      prev.includes(id)
        ? prev.filter(pid => pid !== id)
        : [...prev, id]
    );
  };

  const StatusBadge = ({ status }) => {
    const statusMap = {
      pending: { bg: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      approved: { bg: 'bg-green-100 text-green-800', text: 'Approved' },
      rejected: { bg: 'bg-red-100 text-red-800', text: 'Rejected' }
    };
    
    const { bg, text } = statusMap[status] || { bg: 'bg-gray-100 text-gray-800', text: 'Unknown' };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${bg}`}>
        {text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (property) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: property.price?.currency || 'ETB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(property.price?.amount || 0);
  };

  const openImageModal = (property, index = 0) => {
    setSelectedProperty(property);
    setCurrentImageIndex(index);
    setShowImageModal(true);
  };

  const openUserInfo = (user) => {
    if (!user) {
      console.error('No user data provided');
      toast.error('No user information available');
      return;
    }
    
    // Log the user object for debugging
    console.log('User info:', user);
    
    // Ensure we have the required fields
    const userData = {
      _id: user._id,
      firstName: user.firstName || user.first_name || 'N/A',  // Handle different naming conventions
      lastName: user.lastName || user.last_name || '',
      email: user.email || 'No email',
      phone: user.phone || user.phoneNumber || 'No phone',
      role: user.role || 'user',
      ...user  // Spread any additional user properties
    };
    
    setSelectedUser(userData);
    setShowUserInfo(true);
  };

  const nextImage = () => {
    if (selectedProperty && selectedProperty.images) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === selectedProperty.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const prevImage = () => {
    if (selectedProperty && selectedProperty.images) {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === 0 ? selectedProperty.images.length - 1 : prevIndex - 1
      );
    }
  };

  if (activeTab === 'properties' && loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Property Management</h3>
            <p className="mt-1 text-sm text-gray-500">Manage properties and user interests</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setActiveTab('properties')}
                className={`px-4 py-2 text-sm font-medium border ${activeTab === 'properties' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                Properties
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('interests')}
                className={`px-4 py-2 text-sm font-medium border -ml-px ${activeTab === 'interests' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                Interests
              </button>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiFilter className="mr-2 h-4 w-4" />
              Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search by title, location..."
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700">
                Sort By
              </label>
              <select
                id="sort"
                name="sort"
                value={filters.sort}
                onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price_high">Price: High to Low</option>
                <option value="price_low">Price: Low to High</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {activeTab === 'properties' && selectedProperties.length > 0 && (
        <div className="bg-blue-50 px-4 py-3 sm:px-6 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm text-gray-700">
              {selectedProperties.length} {selectedProperties.length === 1 ? 'property' : 'properties'} selected
            </span>
          </div>
          <div className="flex space-x-3">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">Bulk Actions</option>
              <option value="approved">Approve Selected</option>
              <option value="rejected">Reject Selected</option>
            </select>
            <button
              onClick={handleBulkAction}
              disabled={!bulkAction}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                bulkAction 
                  ? 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500' 
                  : 'bg-blue-300 cursor-not-allowed'
              }`}
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Properties table */}
      {activeTab === 'properties' && (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={selectedProperties.length > 0 && selectedProperties.length === properties.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Property
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Listed By
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date Added
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {properties.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  No properties found
                </td>
              </tr>
            ) : (
              properties.map((property) => (
                <tr key={property._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={selectedProperties.includes(property._id)}
                      onChange={() => toggleSelectProperty(property._id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {property.images && property.images.length > 0 ? (
                          <div 
                            className="h-10 w-10 rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative"
                            onClick={() => openImageModal(property, 0)}
                          >
                            <img 
                              className="h-full w-full object-cover" 
                              src={getImageUrl(property.images[0])}
                              alt={`${property.title} - Image 1`}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2QxZDVkYiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xOC44NSA5LjQyTDEyIDIuMTJMNS4xNSA5LjQyQzQuMzYgMTAuMTkgNC4zNiAxMS40OSA1LjE1IDEyLjI4TDExLjIyIDE4LjM1QzExLjYyIDE4Ljc1IDEyLjI1IDE4Ljc1IDEyLjY1IDE4LjM1TDE4Ljg1IDEyLjI4QzE5LjY0IDExLjQ5IDE5LjY0IDEwLjE5IDE4Ljg1IDkuNDZaIi8+PC9zdmc+';
                              }}
                            />
                            {property.images.length > 1 && (
                              <div className="absolute -bottom-1 -right-1 bg-black bg-opacity-60 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                +{property.images.length - 1}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
                            <FiImage className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{property.title}</div>
                        <div className="text-sm text-gray-500">
                          {property.location?.city}, {property.location?.subCity}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {property.userInfo?.firstName || 'N/A'} {property.userInfo?.lastName || ''}
                    </div>
                    {property.userInfo?.email && (
                      <div className="text-sm text-gray-500">
                        <button 
                          onClick={() => openUserInfo(property.userInfo)}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {property.userInfo.email}
                        </button>
                      </div>
                    )}
                    {property.userInfo?.phone && (
                      <div className="text-sm text-gray-500">
                        <a 
                          href={`tel:${property.userInfo.phone}`} 
                          className="hover:underline"
                        >
                          {property.userInfo.phone}
                        </a>
                      </div>
                    )}
                    {!property.userInfo && (
                      <div className="text-sm text-gray-500">
                        No user information
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatPrice(property)}
                      {property.price?.negotiable && (
                        <span className="text-xs text-gray-500 ml-1">(Negotiable)</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 capitalize">
                      {property.propertyType}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={property.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(property.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        to={`/properties/${property._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <FiExternalLink className="h-5 w-5" />
                      </Link>
                      
                      {property.status !== 'approved' && (
                        <button
                          onClick={() => handleStatusUpdate(property._id, 'approved')}
                          className="text-green-600 hover:text-green-900"
                          title="Approve"
                        >
                          <FiCheck className="h-5 w-5" />
                        </button>
                      )}
                      
                      {property.status !== 'rejected' && (
                        <button
                          onClick={() => handleStatusUpdate(property._id, 'rejected')}
                          className="text-red-600 hover:text-red-900"
                          title="Reject"
                        >
                          <FiX className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* Interests table */}
      {activeTab === 'interests' && (
        <div className="overflow-x-auto">
          {interestsLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price Range</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(!interests || interests.length === 0) ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      No interests found
                    </td>
                  </tr>
                ) : (
                  interests.map((it) => (
                    <tr key={it._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 relative">
                            {it.images?.length ? (
                              <div className="h-10 w-10 rounded-md overflow-hidden">
                                <img
                                  className="h-full w-full object-cover"
                                  src={getImageUrl(it.images[0])}
                                  alt="Interest preview"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2QxZDVkYiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xOC44NSA5LjQyTDEyIDIuMTJMNS4xNSA5LjRDMiLjkgMTEuNjUgMi45IDE1LjYgNS4xNSAxNy44NWMxLjYgMS42IDMuNyAyLjQgNS44NSAyLjQgMi4xNSAwIDQuMjUtLjggNS44NS0yLjRsNi44NS02Ljg1WiIvPjwvc3ZnPg==';
                                  }}
                                />
                                {it.images.length > 1 && (
                                  <div className="absolute -bottom-1 -right-1 bg-black bg-opacity-60 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    +{it.images.length - 1}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
                                <FiImage className="text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 capitalize">{it.type || 'Interest'}</div>
                            <div className="text-xs text-gray-500 capitalize">{it.transactionType}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          {it.user ? (
                            <>
                              <div className="text-sm font-medium text-gray-900">
                                {it.user.firstName} {it.user.lastName}
                              </div>
                              {it.user.email && (
                                <a 
                                  href={`mailto:${it.user.email}`}
                                  className="text-sm text-blue-600 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {it.user.email}
                                </a>
                              )}
                              {it.user.phone && (
                                <a 
                                  href={`tel:${it.user.phone}`}
                                  className="text-sm text-gray-600 hover:text-blue-600 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {it.user.phone}
                                </a>
                              )}
                            </>
                          ) : (
                            <div className="text-sm text-gray-500">No user data</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ETB {Number(it.priceRange?.min || 0).toLocaleString()} - ETB {Number(it.priceRange?.max || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${it.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : it.status === 'approved' ? 'bg-green-100 text-green-800' : it.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                          {it.status || 'unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(it.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Pagination would go here */}
      {activeTab === 'properties' && (
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Previous
          </button>
          <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of{' '}
              <span className="font-medium">20</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <a
                href="#"
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </a>
              <a
                href="#"
                aria-current="page"
                className="z-10 bg-blue-50 border-blue-500 text-blue-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
              >
                1
              </a>
              <a
                href="#"
                className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
              >
                2
              </a>
              <a
                href="#"
                className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
              >
                3
              </a>
              <a
                href="#"
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </a>
            </nav>
          </div>
        </div>
      </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedProperty?.images?.length > 0 && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowImageModal(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        {selectedProperty.title} - Images ({currentImageIndex + 1}/{selectedProperty.images.length})
                      </h3>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-500"
                        onClick={() => setShowImageModal(false)}
                      >
                        <FiX className="h-6 w-6" />
                      </button>
                    </div>
                    
                    <div className="relative w-full h-96 bg-black rounded-lg overflow-hidden">
                      <img
                        src={getImageUrl(selectedProperty.images[currentImageIndex])}
                        alt={`${selectedProperty.title} - Image ${currentImageIndex + 1}`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2QxZDVkYiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xOC44NSA5LjQyTDEyIDIuMTJMNS4xNSA5LjQyQzQuMzYgMTAuMTkgNC4zNiAxMS40OSA1LjE1IDEyLjI4TDExLjIyIDE4LjM1QzExLjYyIDE4Ljc1IDEyLjI1IDE4Ljc1IDEyLjY1IDE4LjM1TDE4Ljg1IDEyLjI4QzE5LjY0IDExLjQ5IDE5LjY0IDEwLjE5IDE4Ljg1IDkuNDJaIj48L3BhdGg+PHBhdGggZD0iTTkgMTJIMTUjMS44NSAxMiAxIDIxLjg1IDEyIDIydjAiPjwvcGF0aD48L3N2Zz4=';
                        }}
                      />
                      
                      {selectedProperty.images.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              prevImage();
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 focus:outline-none"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              nextImage();
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 focus:outline-none"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </>
                      )}
                      
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                        {selectedProperty.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex(index);
                            }}
                            className={`w-3 h-3 rounded-full ${currentImageIndex === index ? 'bg-white' : 'bg-white bg-opacity-50'}`}
                            aria-label={`Go to image ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
                      {selectedProperty.images.map((img, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex(index);
                          }}
                          className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 ${currentImageIndex === index ? 'border-blue-500' : 'border-transparent'}`}
                        >
                          <img
                            src={getImageUrl(img)}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2QxZDVkYiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xOC44NSA5LjQyTDEyIDIuMTJMNS4xNSA5LjQyQzQuMzYgMTAuMTkgNC4zNiAxMS40OSA1LjE1IDEyLjI4TDExLjIyIDE4LjM1QzExLjYyIDE4Ljc1IDEyLjI1IDE4Ljc1IDEyLjY1IDE4LjM1TDE4Ljg1IDEyLjI4QzE5LjY0IDExLjQ5IDE5LjY0IDEwLjE5IDE4Ljg1IDkuNDZaIi8+PC9zdmc+';
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowImageModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Info Modal */}
      {showUserInfo && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="user-modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowUserInfo(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="user-modal-title">
                        User Information
                      </h3>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-500"
                        onClick={() => setShowUserInfo(false)}
                      >
                        <FiX className="h-6 w-6" />
                      </button>
                    </div>
                    
                    <div className="mt-4 space-y-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {selectedUser.firstName} {selectedUser.lastName}
                        </dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Email</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          <a href={`mailto:${selectedUser.email}`} className="text-blue-600 hover:underline">
                            {selectedUser.email}
                          </a>
                        </dd>
                      </div>
                      
                      {selectedUser.phone && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Phone</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            <a href={`tel:${selectedUser.phone}`} className="text-blue-600 hover:underline">
                              {selectedUser.phone}
                            </a>
                          </dd>
                        </div>
                      )}
                      
                      {selectedUser.address && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Address</dt>
                          <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                            {selectedUser.address}
                          </dd>
                        </div>
                      )}
                      
                      {selectedUser.createdAt && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {new Date(selectedUser.createdAt).toLocaleDateString()}
                          </dd>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowUserInfo(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProperties;
