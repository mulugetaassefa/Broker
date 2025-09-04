import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Tabs, Tab, Divider, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import PersonalInfo from './PersonalInfo';
import AddressInfo from './AddressInfo';
import Documents from './Documents';
import api from '../../utils/api';

const UserProfile = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [documents, setDocuments] = useState({
    nationalId: null,
    passport: null,
    otherDocuments: []
  });

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/me');
      setUser(response.data);
      
      // Extract documents from user data
      const { nationalId, passport, otherDocuments = [] } = response.data.documents || {};
      setDocuments({
        nationalId: nationalId || null,
        passport: passport || null,
        otherDocuments: Array.isArray(otherDocuments) ? otherDocuments : []
      });
      
    } catch (err) {
      setError('Failed to load user data');
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchUserData();
    }
  }, [currentUser]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleUpdateSuccess = (message) => {
    setSuccess(message);
    fetchUserData(); // Refresh user data
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      setSuccess('');
    }, 5000);
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (!user) {
      return (
        <Box p={4}>
          <Alert severity="error">Failed to load user data. Please try again later.</Alert>
        </Box>
      );
    }

    switch (activeTab) {
      case 'personal':
        return (
          <PersonalInfo 
            user={user} 
            onUpdateSuccess={handleUpdateSuccess}
            setError={setError}
          />
        );
      case 'address':
        return (
          <AddressInfo 
            user={user} 
            onUpdateSuccess={handleUpdateSuccess}
            setError={setError}
          />
        );
      case 'documents':
        return (
          <Documents 
            documents={documents}
            onUpdateSuccess={handleUpdateSuccess}
            setError={setError}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          <Tab label="Personal Info" value="personal" />
          <Tab label="Address" value="address" />
          <Tab label="Documents" value="documents" />
        </Tabs>
      </Box>

      <Box sx={{ mt: 3 }}>
        {renderTabContent()}
      </Box>
    </Container>
  );
};

export default UserProfile;
