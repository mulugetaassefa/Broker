import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  useTheme,
  useMediaQuery,
  AppBar,
  IconButton,
  Typography,
  Divider,
  Avatar,
  Collapse,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Message as MessageIcon,
  Description as PostsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandLess,
  ExpandMore,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { deepPurple } from '@mui/material/colors';

const drawerWidth = 260;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard/admin' },
  { 
    text: 'User Management', 
    icon: <PeopleIcon />, 
    path: '/dashboard/admin/users',
    exact: true
  },
  { 
    text: 'Message Management', 
    icon: <MessageIcon />, 
    path: '/dashboard/admin/messages',
    exact: true
  },
  { text: 'Properties', icon: <HomeIcon />, path: '/dashboard/admin/properties' },
  { text: 'User Posts', icon: <PostsIcon />, path: '/dashboard/admin/posts' },
];

const AdminLayout = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleSettingsClick = () => {
    setOpenSettings(!openSettings);
  };

  const handleLogout = () => {
    // Add logout logic here
    console.log('Logout');
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
          Admin Panel
        </Typography>
      </Box>
      
      {/* Profile Section */}
      <Box sx={{ p: 2, textAlign: 'center', mb: 2 }}>
        <Avatar 
          sx={{ 
            width: 80, 
            height: 80, 
            mx: 'auto',
            mb: 1,
            bgcolor: deepPurple[500],
            fontSize: '2rem'
          }}
        >
          A
        </Avatar>
        <Typography variant="subtitle1" fontWeight="medium">
          Admin User
        </Typography>
        <Typography variant="body2" color="text.secondary">
          admin@example.com
        </Typography>
      </Box>
      
      <Divider />
      
      {/* Main Menu */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                minHeight: 48,
                justifyContent: 'initial',
                px: 2.5,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.light,
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.light,
                  },
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.main,
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: 3,
                  justifyContent: 'center',
                  color: location.pathname === item.path 
                    ? theme.palette.primary.main 
                    : 'inherit'
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 'medium' : 'regular',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
        
        {/* Settings Dropdown */}
        <ListItemButton onClick={handleSettingsClick}>
          <ListItemIcon sx={{ minWidth: 0, mr: 3, justifyContent: 'center' }}>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
          {openSettings ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={openSettings} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton sx={{ pl: 9, py: 1 }}>
              <ListItemText primary="Profile" />
            </ListItemButton>
            <ListItemButton sx={{ pl: 9, py: 1 }}>
              <ListItemText primary="Account" />
            </ListItemButton>
            <ListItemButton sx={{ pl: 9, py: 1 }}>
              <ListItemText primary="Notifications" />
            </ListItemButton>
          </List>
        </Collapse>
      </List>
      
      <Divider />
      
      {/* Footer */}
      <Box sx={{ p: 2 }}>
        <ListItemButton onClick={handleLogout}>
          <ListItemIcon sx={{ minWidth: 0, mr: 3, justifyContent: 'center' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          zIndex: theme.zIndex.drawer + 1,
        }}
        elevation={0}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>
          
          {/* Add notification/avatar icons here */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Settings">
              <IconButton color="inherit">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Profile">
              <IconButton color="inherit">
                <Avatar sx={{ width: 32, height: 32, bgcolor: deepPurple[500] }}>A</Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: 'none',
              boxShadow: theme.shadows[2],
              backgroundColor: theme.palette.background.paper,
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 8, md: 2 },
          backgroundColor: theme.palette.grey[50],
          minHeight: '100vh',
        }}
      >
        <Toolbar /> {/* This pushes content below the AppBar */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;
