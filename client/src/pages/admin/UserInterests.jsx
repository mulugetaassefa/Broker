import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TablePagination,
  Button,
  Chip,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { format } from 'date-fns';

const UserInterests = () => {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const response = await api.get('/api/interests');
        setInterests(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching interests:', error);
        setLoading(false);
      }
    };

    fetchInterests();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'contacted':
        return 'info';
      case 'viewed':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          User Interests
        </Typography>
      </Box>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Property</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {interests
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((interest) => (
                  <TableRow key={interest._id} hover>
                    <TableCell>
                      {interest.user?.name || 'N/A'}
                      <br />
                      <Typography variant="caption" color="textSecondary">
                        {interest.user?.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {interest.property?.title || 'Property not found'}
                    </TableCell>
                    <TableCell>
                      {interest.message || 'No message'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={interest.status || 'pending'} 
                        color={getStatusColor(interest.status || 'pending')}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {format(new Date(interest.createdAt), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => navigate(`/admin/interests/${interest._id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={interests.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default UserInterests;
