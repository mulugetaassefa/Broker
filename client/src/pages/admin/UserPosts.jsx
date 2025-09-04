import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton, 
  TextField, 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle,
  Tooltip,
  Chip,
  Avatar,
  Box
} from '@mui/material';
import { 
  Search as SearchIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../../services/api';
import { toast } from 'react-toastify';

const UserPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data } = await api.get('/api/posts');
      setPosts(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredPosts = posts.filter(post => 
    post.title?.toLowerCase().includes(searchTerm) ||
    post.user?.name?.toLowerCase().includes(searchTerm) ||
    post.status?.toLowerCase().includes(searchTerm)
  );

  const handleActionClick = (post, type) => {
    setSelectedPost(post);
    setActionType(type);
    setOpenDialog(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedPost) return;

    try {
      if (actionType === 'delete') {
        await api.delete(`/api/posts/${selectedPost._id}`);
        toast.success('Post deleted successfully');
      } else if (actionType === 'toggleStatus') {
        const newStatus = selectedPost.status === 'active' ? 'inactive' : 'active';
        await api.put(`/api/posts/${selectedPost._id}/status`, { status: newStatus });
        toast.success(`Post ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      }
      
      fetchPosts();
      setOpenDialog(false);
    } catch (error) {
      console.error(`Error ${actionType === 'delete' ? 'deleting' : 'updating'} post:`, error);
      toast.error(`Failed to ${actionType === 'delete' ? 'delete' : 'update'} post`);
    }
  };

  const getStatusChip = (status) => {
    const statusMap = {
      active: { label: 'Active', color: 'success' },
      inactive: { label: 'Inactive', color: 'error' },
      pending: { label: 'Pending', color: 'warning' },
      draft: { label: 'Draft', color: 'default' }
    };

    const statusInfo = statusMap[status] || { label: status, color: 'default' };
    
    return (
      <Chip 
        label={statusInfo.label}
        color={statusInfo.color}
        size="small"
        variant="outlined"
      />
    );
  };

  if (loading) {
    return <div>Loading posts...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search posts..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <SearchIcon style={{ marginRight: '8px', color: '#9e9e9e' }} />,
          }}
          style={{ width: '300px' }}
        />
      </div>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Author</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPosts.map((post) => (
              <TableRow key={post._id}>
                <TableCell>
                  <Box sx={{ fontWeight: 'medium' }}>{post.title}</Box>
                  <Box sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                    {post.description?.substring(0, 60)}...
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar 
                      src={post.user?.avatar} 
                      alt={post.user?.name}
                      sx={{ width: 32, height: 32 }}
                    />
                    {post.user?.name || 'Unknown'}
                  </Box>
                </TableCell>
                <TableCell>
                  {post.createdAt ? format(new Date(post.createdAt), 'MMM d, yyyy') : 'N/A'}
                </TableCell>
                <TableCell>
                  {getStatusChip(post.status)}
                </TableCell>
                <TableCell>
                  <Tooltip title="View Post">
                    <IconButton onClick={() => window.open(`/posts/${post._id}`, '_blank')}>
                      <VisibilityIcon color="primary" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={post.status === 'active' ? 'Deactivate' : 'Activate'}>
                    <IconButton onClick={() => handleActionClick(post, 'toggleStatus')}>
                      {post.status === 'active' ? (
                        <BlockIcon color="error" />
                      ) : (
                        <CheckCircleIcon color="success" />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Post">
                    <IconButton onClick={() => handleActionClick(post, 'delete')}>
                      <DeleteIcon color="error" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {actionType === 'delete' 
            ? 'Confirm Delete' 
            : 'Confirm Status Change'}
        </DialogTitle>
        <DialogContent>
          {actionType === 'delete' ? (
            <p>Are you sure you want to delete "{selectedPost?.title}"? This action cannot be undone.</p>
          ) : (
            <p>Are you sure you want to {selectedPost?.status === 'active' ? 'deactivate' : 'activate'} "{selectedPost?.title}"?</p>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirmAction} 
            color={actionType === 'delete' ? 'error' : 'primary'}
            variant="contained"
          >
            {actionType === 'delete' 
              ? 'Delete' 
              : selectedPost?.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default UserPosts;
