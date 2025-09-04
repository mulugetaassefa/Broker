import React, { useState, useEffect } from 'react';
import {
  Box,
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
  Typography,
  Tabs,
  Tab,
  Badge,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Home as HomeIcon,
  DirectionsCar as CarIcon,
  Apartment as ApartmentIcon,
  FilterAlt as FilterIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import api, { apiInstance } from '../../services/api';
import { toast } from 'react-toastify';

const PropertyManagement = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  // Interests state (for when there are no properties or to show alongside)
  const [interests, setInterests] = useState([]);
  const [interestsLoading, setInterestsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [actionType, setActionType] = useState('');
  const [tabValue, setTabValue] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchProperties();
  }, [tabValue, statusFilter, typeFilter]);

  useEffect(() => {
    // Also fetch interests to show on this page
    fetchInterests();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const params = {};
      // Map UI filters to backend expected params
      if (tabValue !== 'all') params.propertyType = tabValue; // server expects propertyType
      if (statusFilter !== 'all') params.status = statusFilter;
      // Only map typeFilter if it's a valid propertyType enum value
      const validTypes = ['house','apartment','land','commercial','office','warehouse','other'];
      if (typeFilter !== 'all' && validTypes.includes(typeFilter)) {
        params.propertyType = typeFilter;
      }

      // Use api.properties.getAll which returns an axios response
      console.log('[PropertyManagement] Fetching properties with params:', params);
      const response = await api.properties.getAll(params);
      console.log('[PropertyManagement] /api/properties response:', {
        status: response?.status,
        count: Array.isArray(response?.data?.data) ? response.data.data.length : undefined,
        keys: Array.isArray(response?.data?.data) && response.data.data[0] ? Object.keys(response.data.data[0]) : []
      });
      const list = Array.isArray(response?.data?.data) ? response.data.data : (response?.data || []);
      setProperties(list);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const fetchInterests = async () => {
    try {
      setInterestsLoading(true);
      console.log('[PropertyManagement] Fetching interests (admin)');
      const res = await api.interests.getAll({});
      console.log('[PropertyManagement] /api/interests/all response:', {
        status: res?.status,
        count: Array.isArray(res?.data) ? res.data.length : Array.isArray(res?.data?.data) ? res.data.data.length : undefined
      });
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : res?.data?.data || []);
      setInterests(list);
    } catch (error) {
      console.error('Error fetching interests:', error);
      toast.error('Failed to load interests');
    } finally {
      setInterestsLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredProperties = properties.filter(property => {
    const t = property.title?.toLowerCase() || '';
    const d = property.description?.toLowerCase() || '';
    const u = `${property.userInfo?.firstName || ''} ${property.userInfo?.lastName || ''}`.toLowerCase();
    const locCity = property.location?.city?.toLowerCase() || '';
    const locSub = property.location?.subCity?.toLowerCase() || '';
    const locAddr = property.location?.address?.toLowerCase() || '';
    return (
      t.includes(searchTerm) ||
      d.includes(searchTerm) ||
      u.includes(searchTerm) ||
      locCity.includes(searchTerm) ||
      locSub.includes(searchTerm) ||
      locAddr.includes(searchTerm)
    );
  });

  const handleActionClick = (property, type) => {
    setSelectedProperty(property);
    setActionType(type);
    setOpenDialog(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedProperty) return;

    try {
      if (actionType === 'delete') {
        await api.properties.delete(selectedProperty._id);
        toast.success('Property deleted successfully');
      } else if (actionType === 'toggleStatus') {
        const nextStatus = selectedProperty.status === 'approved' ? 'pending' : 'approved';
        await apiInstance.put(`/api/properties/${selectedProperty._id}/status`, { status: nextStatus });
        toast.success(`Property ${nextStatus === 'approved' ? 'approved' : 'set to pending'} successfully`);
      }
      
      fetchProperties();
      setOpenDialog(false);
    } catch (error) {
      console.error(`Error ${actionType === 'delete' ? 'deleting' : 'updating'} property:`, error);
      toast.error(`Failed to ${actionType === 'delete' ? 'delete' : 'update'} property`);
    }
  };

  const getPropertyIcon = (propertyType) => {
    switch (propertyType) {
      case 'house':
        return <HomeIcon color="primary" />;
      case 'apartment':
        return <ApartmentIcon color="secondary" />;
      default:
        return <HomeIcon color="action" />;
    }
  };

  const getStatusChip = (status) => {
    const color = status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'warning';
    const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending';
    return <Chip label={label} color={color} size="small" />;
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return <div>Loading properties...</div>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search properties..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ width: 300 }}
        />
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="sold">Sold</MenuItem>
              <MenuItem value="rented">Rented</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              label="Type"
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="house">House</MenuItem>
              <MenuItem value="apartment">Apartment</MenuItem>
              <MenuItem value="land">Land</MenuItem>
              <MenuItem value="commercial">Commercial</MenuItem>
              <MenuItem value="office">Office</MenuItem>
              <MenuItem value="warehouse">Warehouse</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3 }}
      >
        <Tab label="All" value="all" />
        <Tab label="Houses" value="house" icon={<HomeIcon />} />
        <Tab label="Apartments" value="apartment" icon={<ApartmentIcon />} />
        <Tab label="Land" value="land" icon={<HomeIcon />} />
        <Tab label="Commercial" value="commercial" icon={<HomeIcon />} />
        <Tab label="Office" value="office" icon={<HomeIcon />} />
        <Tab label="Warehouse" value="warehouse" icon={<HomeIcon />} />
        <Tab label="Other" value="other" icon={<CarIcon />} />
      </Tabs>

      {/* Interests table (submitted by users) */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Submitted Interests</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Interest</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Price Range</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {interestsLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>Loading interests...</TableCell>
                </TableRow>
              ) : (!interests || interests.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={5}>No interests found</TableCell>
                </TableRow>
              ) : (
                interests.map((it) => (
                  <TableRow key={it._id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>{it.type || 'Interest'}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>{it.transactionType}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{it.user?.firstName} {it.user?.lastName}</Typography>
                      <Typography variant="body2" color="text.secondary">{it.user?.email}</Typography>
                      {it.user?.phone && (
                        <Typography variant="body2" color="text.secondary">{it.user?.phone}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        ETB {Number(it.priceRange?.min || 0).toLocaleString()} - ETB {Number(it.priceRange?.max || 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={it.status || 'unknown'}
                        color={it.status === 'approved' ? 'success' : it.status === 'rejected' ? 'error' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {it.createdAt ? format(new Date(it.createdAt), 'MMM d, yyyy') : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Property</TableCell>
              <TableCell>Details</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Posted By</TableCell>
              <TableCell>Posted On</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProperties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>No properties found. Try adjusting filters or add a new property.</TableCell>
              </TableRow>
            ) : filteredProperties.map((property) => (
              <TableRow key={property._id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar 
                      variant="rounded" 
                      src={property.images?.[0]?.url} 
                      alt={property.title}
                      sx={{ width: 60, height: 60 }}
                    >
                      {getPropertyIcon(property.propertyType)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">{property.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {`${property.location?.city || ''}${property.location?.subCity ? ', ' + property.location.subCity : ''}${property.location?.address ? ', ' + property.location.address : ''}`}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {property.propertyType} • {property.bedrooms} bed • {property.bathrooms} bath
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {property.size?.value} {property.size?.unit}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">
                    {property.price?.currency || 'ETB'} {Number(property.price?.amount || 0).toLocaleString()}
                    {property.price?.negotiable ? ' (Negotiable)' : ''}
                  </Typography>
                </TableCell>
                <TableCell>
                  {getStatusChip(property.status)}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={undefined} sx={{ width: 24, height: 24 }}>
                      <PersonIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="body2">
                      {property.userInfo ? `${property.userInfo.firstName || ''} ${property.userInfo.lastName || ''}` : ''}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {format(new Date(property.createdAt), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View Details">
                      <IconButton 
                        component={Link} 
                        to={`/properties/${property._id}`}
                        target="_blank"
                        size="small"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={property.status === 'approved' ? 'Unapprove' : 'Approve'}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleActionClick(property, 'toggleStatus')}
                        color={property.status === 'approved' ? 'warning' : 'success'}
                      >
                        {property.status === 'approved' ? <CancelIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small" 
                        onClick={() => handleActionClick(property, 'delete')}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
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
            : actionType === 'toggleStatus'
            ? selectedProperty?.status === 'approved' ? 'Unapprove Property' : 'Approve Property'
            : 'Property Details'}
        </DialogTitle>
        <DialogContent>
          {actionType === 'delete' && (
            <p>Are you sure you want to delete "{selectedProperty?.title}"? This action cannot be undone.</p>
          )}
          {actionType === 'toggleStatus' && (
            <p>Are you sure you want to {selectedProperty?.status === 'approved' ? 'unapprove' : 'approve'} "{selectedProperty?.title}"?</p>
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
              : actionType === 'toggleStatus'
              ? selectedProperty?.status === 'approved' ? 'Unapprove' : 'Approve'
              : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PropertyManagement;
