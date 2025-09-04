import axios from 'axios';
import { toast } from 'react-hot-toast';

// Create axios instance with base URL
const apiInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
  withCredentials: true, // Important for CORS with credentials
});

// Request interceptor to add auth token
apiInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Ensure Content-Type is set correctly for FormData
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      }
    });

    if (error.response?.status === 401) {
      // Handle unauthorized access (e.g., redirect to login)
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Upload images
const uploadImages = async (formData) => {
  try {
    const response = await apiInstance.post('/api/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Upload images API error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });
    throw error;
  }
};

// Delete image
const deleteImage = async (publicId) => {
  try {
    const response = await apiInstance.delete(`/api/upload/images/${publicId}`);
    return response.data;
  } catch (error) {
    console.error('Delete image API error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
};

// Get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// API methods
const api = {
  // Auth
  auth: {
    login: async (credentials) => {
      try {
        console.log('Login attempt with:', { identifier: credentials.identifier });
        const response = await apiInstance.post('/api/auth/login', {
          identifier: credentials.identifier,
          password: credentials.password
        });
        console.log('Login response:', response.data);
        return response;
      } catch (error) {
        console.error('Login API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    register: async (userData) => {
      try {
        console.log('Registration attempt for:', userData.email);
        const response = await apiInstance.post('/api/auth/register', userData);
        console.log('Registration response:', response.data);
        return response;
      } catch (error) {
        console.error('Registration API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    me: async () => {
      try {
        const response = await apiInstance.get('/api/auth/me');
        console.log('Me response:', response.data);
        return response;
      } catch (error) {
        console.error('Me API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    updateProfile: async (userData) => {
      try {
        const response = await apiInstance.put('/api/users/me', userData);
        console.log('Update profile response:', response.data);
        return response;
      } catch (error) {
        console.error('Update profile API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    changePassword: async (data) => {
      try {
        const response = await apiInstance.put('/api/auth/change-password', data);
        console.log('Change password response:', response.data);
        return response;
      } catch (error) {
        console.error('Change password API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    forgotPassword: async (email) => {
      try {
        const response = await apiInstance.post('/api/auth/forgot-password', { email });
        console.log('Forgot password response:', response.data);
        return response;
      } catch (error) {
        console.error('Forgot password API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    resetPassword: async (token, data) => {
      try {
        const response = await apiInstance.post(`/api/auth/reset-password/${token}`, data);
        console.log('Reset password response:', response.data);
        return response;
      } catch (error) {
        console.error('Reset password API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
  },
  
  // Users
  users: {
    getAll: async (params = {}) => {
      try {
        const response = await apiInstance.get('/api/users', { params });
        return response.data;
      } catch (error) {
        console.error('Error getting users:', error);
        throw error;
      }
    },
    getById: async (id) => {
      try {
        const response = await apiInstance.get(`/api/users/${id}`);
        return response.data;
      } catch (error) {
        console.error('Error getting user:', error);
        throw error;
      }
    },
    create: async (userData) => {
      try {
        const response = await apiInstance.post('/api/users', userData);
        return response.data;
      } catch (error) {
        console.error('Error creating user:', error);
        throw error;
      }
    },
    update: async (id, userData) => {
      try {
        const response = await apiInstance.put(`/api/users/${id}`, userData);
        return response.data;
      } catch (error) {
        console.error('Error updating user:', error);
        throw error;
      }
    },
    delete: async (id) => {
      try {
        const response = await apiInstance.delete(`/api/users/${id}`);
        return response.data;
      } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
      }
    },
    updateStatus: async (id, isActive) => {
      try {
        const response = await apiInstance.patch(`/api/users/${id}/status`, { isActive });
        return response.data;
      } catch (error) {
        console.error('Error updating user status:', error);
        throw error;
      }
    }
  },
  
  // Properties
  properties: {
    getAll: async (params) => {
      try {
        const response = await apiInstance.get('/api/properties', { params });
        console.log('Get all properties response:', response.data);
        return response;
      } catch (error) {
        console.error('Get all properties API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    getById: async (id) => {
      try {
        const response = await apiInstance.get(`/api/properties/${id}`);
        console.log('Get property by id response:', response.data);
        return response;
      } catch (error) {
        console.error('Get property by id API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    create: async (propertyData) => {
      try {
        const formData = new FormData();
        
        // Append all fields to form data
        Object.entries(propertyData).forEach(([key, value]) => {
          if (key === 'images' && Array.isArray(value)) {
            // Handle multiple image files
            value.forEach((file, index) => {
              formData.append('images', file);
            });
          } else if (value !== null && value !== undefined) {
            formData.append(key, value);
          }
        });
        
        const response = await apiInstance.post('/api/properties', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log('Create property response:', response.data);
        return response;
      } catch (error) {
        console.error('Create property API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    update: async (id, propertyData) => {
      try {
        const formData = new FormData();
        
        // Append all fields to form data
        Object.entries(propertyData).forEach(([key, value]) => {
          if (key === 'images' && Array.isArray(value)) {
            // Handle multiple image files
            value.forEach((file, index) => {
              if (file instanceof File) {
                formData.append('newImages', file);
              } else {
                // It's an existing image URL or ID
                formData.append('existingImages', file);
              }
            });
          } else if (value !== null && value !== undefined) {
            formData.append(key, value);
          }
        });
        
        const response = await apiInstance.put(`/api/properties/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log('Update property response:', response.data);
        return response;
      } catch (error) {
        console.error('Update property API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    delete: async (id) => {
      try {
        const response = await apiInstance.delete(`/api/properties/${id}`);
        console.log('Delete property response:', response.data);
        return response;
      } catch (error) {
        console.error('Delete property API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    search: async (params) => {
      try {
        const response = await apiInstance.get('/api/properties/search', { params });
        console.log('Search properties response:', response.data);
        return response;
      } catch (error) {
        console.error('Search properties API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    getByUser: async (userId) => {
      try {
        const response = await apiInstance.get(`/api/properties/user/${userId}`);
        console.log('Get properties by user response:', response.data);
        return response;
      } catch (error) {
        console.error('Get properties by user API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
  },
  
  // Favorites
  favorites: {
    getAll: async () => {
      try {
        const response = await apiInstance.get('/favorites');
        console.log('Get all favorites response:', response.data);
        return response;
      } catch (error) {
        console.error('Get all favorites API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    add: async (propertyId) => {
      try {
        const response = await apiInstance.post('/favorites', { propertyId });
        console.log('Add favorite response:', response.data);
        return response;
      } catch (error) {
        console.error('Add favorite API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    remove: async (propertyId) => {
      try {
        const response = await apiInstance.delete(`/favorites/${propertyId}`);
        console.log('Remove favorite response:', response.data);
        return response;
      } catch (error) {
        console.error('Remove favorite API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    check: async (propertyId) => {
      try {
        const response = await apiInstance.get(`/favorites/check/${propertyId}`);
        console.log('Check favorite response:', response.data);
        return response;
      } catch (error) {
        console.error('Check favorite API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
  },
  
  // Messages
  messages: {
    getAll: async () => {
      try {
        const response = await apiInstance.get('/api/messages');
        console.log('Get all messages response:', response.data);
        return response;
      } catch (error) {
        console.error('Get all messages API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    getConversation: async (userId) => {
      try {
        const response = await apiInstance.get(`/api/messages/conversation/${userId}`);
        console.log('Get conversation response:', response.data);
        return response;
      } catch (error) {
        console.error('Get conversation API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    send: async (data) => {
      try {
        const response = await apiInstance.post('/api/messages', data);
        console.log('Send message response:', response.data);
        return response;
      } catch (error) {
        console.error('Send message API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    markAsRead: async (messageId) => {
      try {
        const response = await apiInstance.put(`/api/messages/${messageId}/read`);
        console.log('Mark as read response:', response.data);
        return response;
      } catch (error) {
        console.error('Mark as read API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    sendMessage: async (messageData) => {
      try {
        const response = await apiInstance.post('/api/messages', messageData);
        console.log('Send message response:', response.data);
        return response;
      } catch (error) {
        console.error('Send message API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    sendAdminReply: async (messageData) => {
      try {
        const response = await apiInstance.post('/api/messages/admin/reply', messageData);
        console.log('Send admin reply response:', response.data);
        return response;
      } catch (error) {
        console.error('Send admin reply API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    getMessages: async (conversationId) => {
      try {
        // If it's in conversation_* format, use the direct endpoint
        if (conversationId.startsWith('conversation_')) {
          const response = await apiInstance.get(`/api/messages/${conversationId}`);
          console.log('Get messages response:', response.data);
          return response;
        }
        // If it's a valid MongoDB ObjectId, use the conversation endpoint
        if (/^[0-9a-fA-F]{24}$/.test(conversationId)) {
          const response = await apiInstance.get(`/api/messages/conversation/${conversationId}`);
          console.log('Get messages response:', response.data);
          return response;
        }
        // Default to direct endpoint
        const response = await apiInstance.get(`/api/messages/${conversationId}`);
        console.log('Get messages response:', response.data);
        return response;
      } catch (error) {
        console.error('Get messages API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    getConversations: async () => {
      try {
        const response = await apiInstance.get('/api/messages/conversations');
        console.log('Get conversations response:', response.data);
        return response;
      } catch (error) {
        console.error('Get conversations API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
  },
  
  // Interests
  interests: {
    getMine: async (filters = {}) => {
      try {
        const response = await apiInstance.get('/api/interests/me', { 
          params: filters,
          headers: getAuthHeader()
        });
        return response.data;
      } catch (error) {
        console.error('Error fetching interests:', error);
        throw error;
      }
    },
    submit: async (formData) => {
      try {
        const response = await apiInstance.post('/api/interests', formData, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data'
          }
        });
        return response.data;
      } catch (error) {
        console.error('Error submitting interest:', error);
        throw error;
      }
    },
    update: async (id, formData) => {
      try {
        const response = await apiInstance.put(`/api/interests/${id}`, formData, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data'
          }
        });
        return response.data;
      } catch (error) {
        console.error('Error updating interest:', error);
        throw error;
      }
    },
    delete: async (id) => {
      try {
        const response = await apiInstance.delete(`/api/interests/${id}`, {
          headers: getAuthHeader()
        });
        return response.data;
      } catch (error) {
        console.error('Error deleting interest:', error);
        throw error;
      }
    },
    getAll: async (params = {}) => {
      // Admin-only endpoint to list all interests
      const response = await apiInstance.get('/api/interests/all', {
        params,
        headers: getAuthHeader()
      });
      return response.data;
    },
    getById: async (id) => {
      const response = await apiInstance.get(`/api/interests/${id}`);
      return response.data;
    },
    updateStatus: async (id, status, reason) => {
      const body = reason ? { status, reason } : { status };
      const response = await apiInstance.patch(`/api/interests/${id}/status`, body);
      return response.data;
    },
  },
  
  // Uploads
  uploads: {
    uploadImage: async (file) => {
      try {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await apiInstance.post('/uploads/images', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log('Upload image response:', response.data);
        return response;
      } catch (error) {
        console.error('Upload image API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
  },
  
  // Upload
  upload: {
    uploadImages,
    deleteImage,
  },

  // Admin endpoints
  admin: {
    getDashboard: async () => {
      const response = await apiInstance.get('/api/admin/dashboard', {
        headers: getAuthHeader(),
      });
      return response.data;
    },
    getStatistics: async (params = {}) => {
      const response = await apiInstance.get('/api/admin/statistics', {
        params,
        headers: getAuthHeader(),
      });
      return response.data;
    },
    getRequests: async (params = {}) => {
      // Supports: page, limit, status, requestType, propertyType, isUrgent, search
      const response = await apiInstance.get('/api/admin/requests', {
        params,
        headers: getAuthHeader(),
      });
      return response.data;
    },
  },
  
  // User related API calls
  user: {
    // Upload identity document
    uploadIdentityDocument: async (formData) => {
      try {
        const response = await apiInstance.post('/api/users/me/documents', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return response.data;
      } catch (error) {
        console.error('Upload document error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    }
  },
  
  // Admin analytics (legacy placeholders, prefer api.admin)
  adminAnalytics: {
    getDashboard: async () => apiInstance.get('/api/admin/dashboard', { headers: getAuthHeader() }).then(r => r.data),
    getStatistics: async (params = {}) => apiInstance.get('/api/admin/statistics', { params, headers: getAuthHeader() }).then(r => r.data),
  },
};

export default api;

export { apiInstance }; // Export the axios instance for custom requests
