import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  FileDownload as FileDownloadIcon,
  Print as PrintIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0); // zero-based for MUI
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [requestType, setRequestType] = useState('all');
  const [propertyType, setPropertyType] = useState('all');

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Fetch requests from backend
  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page: page + 1, // API is 1-based
        limit: rowsPerPage,
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (requestType !== 'all') params.requestType = requestType;
      if (propertyType !== 'all') params.propertyType = propertyType;
      if (searchTerm) params.search = searchTerm;

      const data = await api.admin.getRequests(params);
      // Shape: { requests, pagination: { totalItems, itemsPerPage, currentPage } }
      setRows(Array.isArray(data?.requests) ? data.requests : []);
      setTotalItems(data?.pagination?.totalItems || 0);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, statusFilter, requestType, propertyType]);

  const handleSearch = () => {
    setPage(0);
    loadRequests();
  };

  // Client-side date filter (API doesn't support date range in admin/requests yet)
  const filteredRows = useMemo(() => {
    if (dateFilter === 'all') return rows;
    const cutoff = getDateRange(dateFilter); // yyyy-mm-dd
    if (!cutoff) return rows;
    return rows.filter(r => new Date(r.createdAt).toISOString().split('T')[0] >= cutoff);
  }, [rows, dateFilter]);

  function getDateRange(range) {
    const today = new Date();
    const result = new Date();
    
    switch(range) {
      case 'week':
        result.setDate(today.getDate() - 7);
        break;
      case 'month':
        result.setMonth(today.getMonth() - 1);
        break;
      case 'year':
        result.setFullYear(today.getFullYear() - 1);
        break;
      default:
        return '';
    }
    
    return result.toISOString().split('T')[0];
  }

  const handleExport = (format) => {
    console.log(`Exporting to ${format}`);
    // Implement export logic here
  };

  const handlePrint = () => {
    console.log('Printing report');
    // Implement print logic here
    window.print();
  };

  const handleDelete = (id) => {
    console.log(`Deleting report ${id}`);
    // Implement delete logic here
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Reports
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FileDownloadIcon />}
            onClick={() => handleExport('pdf')}
            sx={{ mr: 1 }}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  label="Date Range"
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="week">Last 7 Days</MenuItem>
                  <MenuItem value="month">Last 30 Days</MenuItem>
                  <MenuItem value="year">Last Year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Request Type</InputLabel>
                <Select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  label="Request Type"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="buy">Buy</MenuItem>
                  <MenuItem value="rent">Rent</MenuItem>
                  <MenuItem value="sell">Sell</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Property Type</InputLabel>
                <Select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  label="Property Type"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="house">House</MenuItem>
                  <MenuItem value="apartment">Apartment</MenuItem>
                  <MenuItem value="land">Land</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={'auto'}>
              <Button variant="contained" onClick={handleSearch} startIcon={<SearchIcon />}>Search</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Request Type</TableCell>
              <TableCell>Property Type</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6}>Loading…</TableCell>
              </TableRow>
            )}
            {!loading && filteredRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>No results</TableCell>
              </TableRow>
            )}
            {!loading && filteredRows
              .map((r) => (
                <TableRow key={r._id}>
                  <TableCell>{r.title || '-'}</TableCell>
                  <TableCell>{r.requestType || '-'}</TableCell>
                  <TableCell>{r.propertyType || '-'}</TableCell>
                  <TableCell>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={(r.status || '-').replace(/^\w/, c => c.toUpperCase())}
                      color={
                        r.status === 'completed' ? 'success' :
                        r.status === 'approved' ? 'success' :
                        r.status === 'pending' ? 'warning' :
                        r.status === 'rejected' ? 'error' : 'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary">
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton size="small" color="primary">
                      <FileDownloadIcon />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(r._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalItems}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {error && (
        <Box sx={{ mt: 2, color: 'error.main' }}>{error}</Box>
      )}
    </Box>
  );
};

export default Reports;
