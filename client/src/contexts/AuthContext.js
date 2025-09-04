import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api, { apiInstance } from '../services/api';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Set the auth token
          apiInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Fetch user data
          const response = await api.auth.me();
          const userData = response.data?.user || response.data;
          
          // Ensure user object has all required fields
          if (userData) {
            const normalizedUser = {
              ...userData,
              _id: userData._id || userData.id, // Handle both _id and id fields
              documents: userData.documents || [],
              addresses: userData.addresses || []
            };
            setUser(normalizedUser);
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('token');
        delete apiInstance.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (identifier, password) => {
    try {
      setError(null);
      console.log('Attempting login with:', { identifier });
      
      // Call the login API with the correct format
      const response = await api.auth.login({ 
        identifier,
        password 
      });
      
      console.log('Raw login response:', response);
      
      // Handle the server's response format
      if (!response || !response.data) {
        console.error('Invalid response format:', response);
        throw new Error('Invalid server response');
      }
      
      // Extract token and user data from the response
      const { token, user: userData } = response.data;
      
      if (!token || !userData) {
        console.error('Missing token or user in response:', response.data);
        throw new Error('Missing authentication data');
      }
      
      // Store the token in localStorage
      localStorage.setItem('token', token);
      
      // Set the default authorization header
      apiInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Update the user state with the user data from the response
      setUser(userData);
      
      // Redirect based on user role
      const redirectPath = userData.role === 'admin' ? '/admin' : '/dashboard';
      navigate(redirectPath, { replace: true });
      
      toast.success('Logged in successfully!');
      return { success: true };
      
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    delete apiInstance.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully!');
    navigate('/login');
  };

  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      const response = await api.auth.register(userData);
      
      // After successful registration, automatically log the user in
      if (response.data && response.data.token) {
        // Store the token
        localStorage.setItem('token', response.data.token);
        apiInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        // Set the user data from the registration response
        setUser(response.data.user);
        
        // Redirect based on user role
        const redirectPath = response.data.user.role === 'admin' ? '/dashboard/admin' : '/dashboard';
        navigate(redirectPath, { replace: true });
        
        toast.success('Registration successful! You are now logged in.');
        return { success: true, data: response.data };
      }
      
      return { success: false, error: 'Registration response missing token' };
    } catch (err) {
      const error = err.response?.data?.message || err.message || 'Registration failed';
      setError(error);
      toast.error(error);
      return { success: false, error };
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError('');
      
      // Prepare the data to send
      const dataToSend = {
        ...profileData,
        ...(profileData.address && {
          address: {
            ...(profileData.address.region && { region: profileData.address.region }),
            ...(profileData.address.subCity && { subCity: profileData.address.subCity }),
            ...(profileData.address.specificLocation && { 
              specificLocation: profileData.address.specificLocation 
            })
          }
        })
      };
      
      // Remove any undefined or empty fields
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === undefined || dataToSend[key] === '') {
          delete dataToSend[key];
        }
      });

      // Make the API call
      const response = await api.auth.updateProfile(dataToSend);
      
      if (response && response.data) {
        // Update user state with the response data
        setUser(prev => ({
          ...prev,
          ...response.data.user,
          address: {
            ...prev.address,
            ...(response.data.user.address || {})
          }
        }));
        
        toast.success('Profile updated successfully!');
        return { success: true, user: response.data.user };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update profile';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.auth.changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully!');
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.message || 'Password change failed';
      setError(error);
      toast.error(error);
      return { success: false, error };
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      await api.auth.forgotPassword(email);
      toast.success('Password reset link sent to your email');
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.message || 'Password reset request failed';
      setError(error);
      toast.error(error);
      return { success: false, error };
    }
  };

  // Reset password
  const resetPassword = async (token, password) => {
    try {
      await api.auth.resetPassword(token, { password });
      toast.success('Password reset successful. Please login with your new password.');
      navigate('/login');
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.message || 'Password reset failed';
      setError(error);
      toast.error(error);
      return { success: false, error };
    }
  };

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    loading,
    error,
    isAdmin,
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    setError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;