import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  IconButton, 
  Button,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  People as PeopleIcon,
  Home as HomeIcon,
  Message as MessageIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const StatCard = ({ title, value, icon: Icon, color, trend, trendText }) => (
  <Card elevation={2}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography color="textSecondary" variant="subtitle2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
          {trend !== undefined && (
            <Box display="flex" alignItems="center" mt={1}>
              <Typography 
                variant="caption" 
                color={trend >= 0 ? 'success.main' : 'error.main'}
                display="flex"
                alignItems="center"
              >
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
                <Box component="span" ml={0.5} color="text.secondary">
                  {trendText}
                </Box>
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            color: `${color}.dark`,
            borderRadius: '12px',
            height: '48px',
            width: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon fontSize="medium" />
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const AdminOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInterests: 0,
    totalMessages: 0,
    userGrowth: 0,
    interestGrowth: 0,
    loading: true
  });
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      setError(null);
      
      // Only show loading spinner on initial load, not on refresh
      if (!isRefreshing) {
        setStats(prev => ({ ...prev, loading: true }));
      }
      
      // Fetch user count from the API with minimal data
      const usersResponse = await api.users.getAll({
        page: 1,
        limit: 1,  // We only need the count, not the actual users
        search: '',
        role: '',
        status: ''
      });
      
      // Extract the total count from the response
      const totalUsers = usersResponse.totalUsers || 0;

      // Fetch total interests count
      const interestsResponse = await api.interests.getAll({ page: 1, limit: 1 });
      console.log('Interests API response:', interestsResponse); // Debug log
      const totalInterests = interestsResponse?.count || interestsResponse?.data?.count || 0;

      // Fetch conversations (use count as total messages indicator)
      const conversationsResponse = await api.messages.getConversations();
      const totalMessages = Array.isArray(conversationsResponse?.data)
        ? conversationsResponse.data.length
        : 0;
      
      // Update stats with real data
      setStats(prev => ({
        ...prev,
        totalUsers,
        totalInterests,
        totalMessages,
        loading: false
      }));
      
      return true;
    } catch (err) {
      console.error('Error fetching stats:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      setError('Failed to load statistics. Please try again.');
      setStats(prev => ({
        ...prev,
        loading: false
      }));
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    await fetchStats();
  };

  if (stats.loading && !isRefreshing) {
    return (
      <Box p={3}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={fetchStats}
          startIcon={<RefreshIcon />}
          sx={{ mt: 2 }}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Refreshing...' : 'Retry'}
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Dashboard Overview
        </Typography>
        <Box>
          <Tooltip title="Refresh stats">
            <IconButton 
              onClick={handleRefresh}
              disabled={isRefreshing}
              color="primary"
            >
              <RefreshIcon sx={{ 
                transition: 'transform 0.5s ease-in-out',
                transform: isRefreshing ? 'rotate(360deg)' : 'rotate(0)'
              }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={PeopleIcon}
            color="primary"
            trend={stats.userGrowth}
            trendText="from last month"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Interests"
            value={stats.totalInterests.toLocaleString()}
            icon={HomeIcon}
            color="secondary"
            trend={stats.interestGrowth}
            trendText="from last month"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Messages"
            value={stats.totalMessages.toLocaleString()}
            icon={MessageIcon}
            color="info"
            trend={undefined}
            trendText=""
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminOverview;
