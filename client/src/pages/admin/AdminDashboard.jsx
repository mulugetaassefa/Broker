import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress,
  Button,
  Avatar,
  Divider,
  Badge,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Chip
} from '@mui/material';
import {
  People as PeopleIcon,
  Message as MessageIcon,
  CheckCircle as CheckCircleIcon,
  Email as EmailIcon,
  Report as ReportIcon,
  ChatBubbleOutline as ChatBubbleOutlineIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import api from '../../services/api';

// TabPanel component for the tabs
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

// StatsCard component for displaying statistics
function StatsCard({ title, value, icon: Icon, change, color = 'primary' }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h5">{value}</Typography>
          </Box>
          <Box
            sx={{
              p: 2,
              borderRadius: '50%',
              bgcolor: `${color}.light`,
              color: `${color}.contrastText`,
            }}
          >
            <Icon />
          </Box>
        </Box>
        {change !== undefined && (
          <Box display="flex" alignItems="center" mt={1}>
            {change >= 0 ? (
              <CheckCircleIcon color="success" fontSize="small" />
            ) : (
              <ReportIcon color="error" fontSize="small" />
            )}
            <Typography
              variant="body2"
              color={change >= 0 ? 'success.main' : 'error.main'}
              sx={{ ml: 0.5 }}
            >
              {Math.abs(change)}% {change >= 0 ? 'increase' : 'decrease'} from last month
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// QuickActionCard component for quick action buttons
function QuickActionCard({ title, count, icon: Icon, color = 'primary', path }) {
  return (
    <Card 
      component={Link} 
      to={path}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: `${color}.light`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <Icon sx={{ color: `${color}.main`, fontSize: 30 }} />
          </Box>
          <Typography variant="subtitle2" gutterBottom>
            {title}
          </Typography>
          {count > 0 && (
            <Badge
              badgeContent={count}
              color="error"
              max={99}
              sx={{
                '& .MuiBadge-badge': {
                  top: -5,
                  right: -10,
                },
              }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// ConversationItem component for displaying message previews
function ConversationItem({ conversation }) {
  const theme = useTheme();
  const navigate = useNavigate();
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        p: 1.5,
        cursor: 'pointer',
        '&:hover': { 
          bgcolor: theme.palette.action.hover,
          borderRadius: 1
        }
      }}
      onClick={() => navigate(`/admin/messages/${conversation.userId}`)}
    >
      <Badge
        color="error"
        variant="dot"
        invisible={!conversation.unreadCount}
        sx={{ mr: 2 }}
      >
        <Avatar src={conversation.avatar} />
      </Badge>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" noWrap>
            {conversation.userName}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {new Date(conversation.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </Box>
        <Typography 
          variant="body2" 
          color="textSecondary" 
          noWrap
          sx={{ 
            fontWeight: conversation.unreadCount ? 'bold' : 'normal',
            color: conversation.unreadCount ? 'text.primary' : 'text.secondary'
          }}
        >
          {conversation.lastMessage}
        </Typography>
      </Box>
    </Box>
  );
}

const AdminDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMessages: 0,
    unreadMessages: 0,
    uniqueSenders: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    activeUsers: 0,
    newUsers: 0,
    completedRequests: 0,
    userChange: 5.7,
    messageChange: 12.3,
    activeChange: 8.2,
    requestChange: -3.4,
    quickActions: [
      { id: 1, title: 'Approve Properties', count: 12, icon: CheckCircleIcon, path: '/admin/properties' },
      { id: 2, title: 'View Messages', count: 5, icon: EmailIcon, path: '/admin/messages' },
      { id: 3, title: 'Manage Users', count: 3, icon: PeopleIcon, path: '/admin/users' }
    ],
    recentConversations: [
      {
        id: 1,
        userId: 'user1',
        userName: 'John Doe',
        avatar: '',
        lastMessage: 'Hello, I have a question about my property',
        lastMessageAt: new Date(),
        unreadCount: 2
      },
      {
        id: 2,
        userId: 'user2',
        userName: 'Jane Smith',
        avatar: '',
        lastMessage: 'Thank you for your help!',
        lastMessageAt: new Date(Date.now() - 3600000),
        unreadCount: 0
      },
      {
        id: 3,
        userId: 'user3',
        userName: 'Mike Johnson',
        avatar: '',
        lastMessage: 'I would like to schedule a viewing',
        lastMessageAt: new Date(Date.now() - 86400000),
        unreadCount: 1
      }
    ]
  });

  const [recentRequests, setRecentRequests] = useState([
    {
      id: 1,
      propertyId: 'prop1',
      propertyTitle: 'Modern Apartment in Downtown',
      userName: 'John Doe',
      date: new Date(),
      status: 'pending'
    },
    {
      id: 2,
      propertyId: 'prop2',
      propertyTitle: 'Cozy House with Garden',
      userName: 'Jane Smith',
      date: new Date(Date.now() - 86400000),
      status: 'approved'
    },
    {
      id: 3,
      propertyId: 'prop3',
      propertyTitle: 'Luxury Villa with Pool',
      userName: 'Mike Johnson',
      date: new Date(Date.now() - 172800000),
      status: 'rejected'
    }
  ]);

  const [usersByType] = useState([
    { _id: 'Tenant', count: 45 },
    { _id: 'Landlord', count: 23 },
    { _id: 'Agent', count: 12 },
    { _id: 'Admin', count: 3 }
  ]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [dashboardData, messagesData, propertiesData] = await Promise.all([
        api.admin.getDashboard().catch(err => ({
          statistics: {},
          usersByType: [],
          requestsByType: [],
          recentRequests: [],
          urgentRequests: []
        })),
        api.messages.getConversations().catch(err => ({ data: [] })),
        api.properties.getAll({ limit: 5, status: 'pending' }).catch(err => ({ data: [] }))
      ]);
      
      const data = dashboardData || {};
      const conversations = messagesData?.data || [];
      const pendingProperties = propertiesData?.data || [];
      
      // Process conversations
      const uniqueSenders = new Set(conversations.map(conv => 
        conv.participant?._id || conv.participant?.email
      )).size;
      
      const totalMessages = conversations.reduce((sum, conv) => sum + (conv.messageCount || 0), 0);
      const unreadMessages = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      
      // Process recent conversations
      const recentConversations = [...conversations]
        .sort((a, b) => new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0))
        .slice(0, 5);
      
      // Calculate active and new users
      const now = new Date();
      const activeUsers = conversations.filter(conv => {
        const lastMessageDate = new Date(conv.lastMessage?.createdAt || 0);
        return (now - lastMessageDate) < (7 * 24 * 60 * 60 * 1000);
      }).length;
      
      const newUsers = conversations.filter(conv => {
        const firstMessageDate = new Date(conv.lastMessage?.createdAt || 0);
        return (now - firstMessageDate) < (24 * 60 * 60 * 1000);
      }).length;
      
      // Update quick actions with counts
      const quickActions = [
        { id: 1, title: 'Approve Listings', icon: 'check_circle', count: pendingProperties.length, path: '/admin/properties?status=pending' },
        { id: 2, title: 'New Messages', icon: 'email', count: unreadMessages, path: '/admin/messages' },
        { id: 3, title: 'System Alerts', icon: 'notifications', count: data.statistics?.alerts || 0, path: '/admin/alerts' },
      ];
      
      setStats(prev => ({
        ...prev,
        totalUsers: data?.statistics?.totalUsers || 0,
        totalMessages,
        unreadMessages,
        uniqueSenders,
        pendingRequests: pendingProperties.length,
        approvedRequests: data?.statistics?.approvedRequests || 0,
        rejectedRequests: data?.statistics?.rejectedRequests || 0,
        completedRequests: data?.statistics?.completedRequests || 0,
        activeUsers,
        newUsers,
        messageChange: data?.statistics?.messageChange || 0,
        requestChange: data?.statistics?.requestChange || 0,
        recentConversations,
        quickActions
      }));
      
      setUsersByType(data.usersByType || []);
      setRequestsByType(data.requestsByType || []);
      setRecentRequests(data.recentRequests || []);
      setUrgentRequests(data.urgentRequests || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default values on error
      setStats(prev => ({
        ...prev,
        totalUsers: 0,
        totalMessages: 0,
        unreadMessages: 0,
        uniqueSenders: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        completedRequests: 0,
        activeUsers: 0,
        newUsers: 0,
        messageChange: 0,
        requestChange: 0,
        recentConversations: [],
        quickActions: prev.quickActions.map(action => ({ ...action, count: 0 }))
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // Refresh dashboard data every 30 seconds
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  // Stats Card Component
  const StatsCard = ({ title, value, icon: Icon, change, color = 'primary' }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography color="textSecondary" variant="subtitle2" gutterBottom>
            {title}
          </Typography>
          <Icon color={color} />
        </Box>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h4">{value}</Typography>
          {change !== undefined && (
            <Box display="flex" alignItems="center" color={change >= 0 ? 'success.main' : 'error.main'}>
              {change >= 0 ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
              <Typography variant="body2" sx={{ ml: 0.5 }}>
                {Math.abs(change)}%
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  // Quick Action Card Component
  const QuickActionCard = ({ title, count, icon: Icon, color = 'primary', path }) => (
    <Card 
      component={Link} 
      to={path}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: `${color}.light`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <Icon sx={{ color: `${color}.main`, fontSize: 30 }} />
          </Box>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Badge 
            badgeContent={count} 
            color={color}
            sx={{ 
              '& .MuiBadge-badge': { 
                fontSize: '0.75rem',
                height: '24px',
                minWidth: '24px',
                borderRadius: '12px',
                p: '0 6px',
              } 
            }}
          >
            <Box width={24} />
          </Badge>
        </Box>
      </CardContent>
    </Card>
  );

  // Fetch data on component mount
  useEffect(() => {
    if (currentUser) {
      fetchDashboard();
      // Refresh dashboard data every 30 seconds
      const interval = setInterval(fetchDashboard, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard 
            title="Total Users" 
            value={stats.totalUsers} 
            icon={PeopleIcon} 
            change={stats.userChange}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard 
            title="Total Messages" 
            value={stats.totalMessages} 
            icon={MessageIcon} 
            change={stats.messageChange}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard 
            title="Active Users (7d)" 
            value={stats.activeUsers} 
            icon={PersonIcon} 
            change={stats.activeChange}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard 
            title="Pending Requests" 
            value={stats.pendingRequests} 
            icon={FavoriteIcon} 
            change={stats.requestChange}
            color="error"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Quick Actions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Quick Actions</Typography>
              <Grid container spacing={2}>
                {stats.quickActions.map((action) => (
                  <Grid item xs={6} sm={3} key={action.id}>
                    <QuickActionCard 
                      title={action.title}
                      count={action.count}
                      icon={
                        action.icon === 'check_circle' ? CheckCircleIcon :
                        action.icon === 'email' ? EmailIcon :
                        action.icon === 'report' ? ReportIcon : NotificationsIcon
                      }
                      color={
                        action.id === 1 ? 'primary' :
                        action.id === 2 ? 'success' :
                        action.id === 3 ? 'warning' : 'error'
                      }
                      path={action.path}
                    />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Activity</Typography>
              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
                indicatorColor="primary"
                textColor="primary"
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mb: 2 }}
              >
                <Tab label="Messages" />
                <Tab label="Requests" />
                <Tab label="Users" />
              </Tabs>
              
              <TabPanel value={tabValue} index={0}>
                {stats.recentConversations.length > 0 ? (
                  <Box>
                    {stats.recentConversations.map((conv) => (
                      <Box key={conv._id}>
                        <ConversationItem conversation={conv} />
                        <Divider />
                      </Box>
                    ))}
                    <Box mt={2} textAlign="right">
                      <Button 
                        component={Link} 
                        to="/admin/messages" 
                        color="primary"
                        endIcon={<MessageIcon />}
                      >
                        View All Messages
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box textAlign="center" py={4}>
                    <ChatBubbleOutlineIcon color="disabled" sx={{ fontSize: 48, mb: 1 }} />
                    <Typography color="textSecondary">No recent messages</Typography>
                  </Box>
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                {recentRequests.length > 0 ? (
                  <Box>
                    {recentRequests.map((request) => (
                      <Box key={request._id} p={2}>
                        <Typography variant="subtitle2">{request.title}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {request.description}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box textAlign="center" py={4}>
                    <Typography color="textSecondary">No recent requests</Typography>
                  </Box>
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                {usersByType.length > 0 ? (
                  <Box>
                    {usersByType.map((userType) => (
                      <Box key={userType._id} display="flex" justifyContent="space-between" p={2}>
                        <Typography>{userType._id}</Typography>
                        <Typography>{userType.count} users</Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box textAlign="center" py={4}>
                    <Typography color="textSecondary">No user data available</Typography>
                  </Box>
                )}
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Recent Messages */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Messages</Typography>
                <Badge 
                  badgeContent={stats.unreadMessages} 
                  color="error"
                  max={99}
                >
                  <MessageIcon color="action" />
                </Badge>
              </Box>
              
              {stats.recentConversations.length > 0 ? (
                <Box>
                  {stats.recentConversations.slice(0, 4).map((conv, index) => (
                    <Box key={conv._id}>
                      <ConversationItem conversation={conv} />
                      {index < stats.recentConversations.length - 1 && <Divider />}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box textAlign="center" py={2}>
                  <Typography color="textSecondary" variant="body2">
                    No recent messages
                  </Typography>
                </Box>
              )}
              
              <Box mt={2} textAlign="center">
                <Button 
                  component={Link} 
                  to="/admin/messages" 
                  size="small" 
                  color="primary"
                  startIcon={<MessageIcon />}
                >
                  View All Messages
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Quick Stats</Typography>
              <Box>
                <Box display="flex" justifyContent="space-between" py={1}>
                  <Typography variant="body2" color="textSecondary">New Users (24h)</Typography>
                  <Typography variant="body2">{stats.newUsers}</Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between" py={1}>
                  <Typography variant="body2" color="textSecondary">Active Conversations</Typography>
                  <Typography variant="body2">{stats.activeUsers}</Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between" py={1}>
                  <Typography variant="body2" color="textSecondary">Approved Requests</Typography>
                  <Typography variant="body2">{stats.approvedRequests}</Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between" py={1}>
                  <Typography variant="body2" color="textSecondary">Rejected Requests</Typography>
                  <Typography variant="body2">{stats.rejectedRequests}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
