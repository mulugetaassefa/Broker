import React, { useState, useEffect, useCallback } from 'react';
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
  Box,
  Avatar,
  Typography,
  Switch,
  FormControlLabel,
  CircularProgress,
  TablePagination,
  InputAdornment
} from '@mui/material';
import {
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../../services/api';
import { toast } from 'react-toastify';
import UserForm from '../../components/admin/UserForm';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openUserForm, setOpenUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [actionType, setActionType] = useState('');
  const [processing, setProcessing] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState({}); // { [userId]: boolean }

  const fetchUsers = useCallback(async () => {
    try {
      console.log('Fetching users...');
      setLoading(true);
      
      // Log the request parameters
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm
      };
      console.log('Request params:', params);
      
      // Make the API call
      const response = await api.users.getAll(params);
      console.log('API Response:', response);
      
      // Check if response contains users array
      if (response && Array.isArray(response.users)) {
        setUsers(response.users);
        setTotalUsers(response.totalUsers || 0);
      } else {
        console.error('Invalid response format:', response);
        toast.error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error in fetchUsers:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Component mounted, fetching users...');
      fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    console.log('Page changed to:', newPage);
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    console.log('Rows per page changed to:', event.target.value);
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusToggle = async (user) => {
    const id = user._id;
    try {
      console.log('Toggling status for user:', id);
      // prevent double toggle
      setToggling((prev) => ({ ...prev, [id]: true }));

      // optimistic update
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isActive: !user.isActive } : u)));

      await api.users.updateStatus(id, !user.isActive);
      toast.success(`User ${!user.isActive ? 'activated' : 'deactivated'}`);
      // Optionally refresh to sync other server-side changes
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      // revert optimistic change
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isActive: user.isActive } : u)));
      toast.error(error.response?.data?.message || 'Failed to update user status');
    } finally {
      setToggling((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    const id = selectedUser._id;
    const previousUsers = users;
    try {
      setDeleting(true);
      console.log('Deleting user:', id);

      // optimistic remove
      setUsers((prev) => prev.filter((u) => u._id !== id));

      await api.users.delete(id);
      toast.success('User deleted successfully');
      setOpenDialog(false);
      setSelectedUser(null);
      // refresh to ensure totals/pagination are correct
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      // revert optimistic change
      setUsers(previousUsers);
      toast.error(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveUser = async (userData) => {
    try {
      setProcessing(true);
      if (editingUser) {
        // Update existing user
        await api.users.update(editingUser._id, userData);
        toast.success('User updated successfully');
      } else {
        // Create new user
        await api.users.create(userData);
        toast.success('User created successfully');
      }
      fetchUsers();
      setOpenUserForm(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setOpenUserForm(true);
  };

  const handleEditUser = (user) => {
    console.log('[UserManagement] Edit clicked for user:', user?._id, user?.email);
    setEditingUser(user);
    setOpenUserForm(true);
    console.log('[UserManagement] UserForm open state set to true');
  };

  const handleUserFormSuccess = () => {
    fetchUsers();
    setOpenUserForm(false);
  };

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">User Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddUser}
        >
          Add New User
        </Button>
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Box p={2}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search users..."
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                    <Typography>Loading users...</Typography>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body1">No users found</Typography>
                    <Button 
                      variant="outlined" 
                      onClick={fetchUsers}
                      sx={{ mt: 2 }}
                    >
                      Retry
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ width: 40, height: 40, mr: 2 }}>
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </Avatar>
                        <span>{user.firstName} {user.lastName}</span>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role} 
                        color={user.role === 'admin' ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={user.isActive !== false}
                            onChange={() => handleStatusToggle(user)}
                            color="primary"
                            disabled={!!toggling[user._id]}
                          />
                        }
                        label={user.isActive !== false ? 'Active' : 'Inactive'}
                      />
                    </TableCell>
                    <TableCell>
                      {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton
                          onClick={() => handleEditUser(user)}
                          color="primary"
                          disabled={deleting || !!toggling[user._id]}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          onClick={() => {
                            console.log('[UserManagement] Delete clicked for user:', user?._id, user?.email);
                            setSelectedUser(user);
                            setOpenDialog(true);
                            console.log('[UserManagement] OpenDialog set to true for delete confirmation');
                          }}
                          color="error"
                          disabled={deleting || !!toggling[user._id]}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalUsers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete {selectedUser?.email}?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleDelete} 
            color="error"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <UserForm
        open={openUserForm}
        onClose={() => setOpenUserForm(false)}
        user={editingUser}
        onSave={handleSaveUser}
        onSuccess={handleUserFormSuccess}
      />
    </div>
  );
};

export default UserManagement;
