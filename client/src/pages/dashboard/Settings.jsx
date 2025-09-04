import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Container, 
  Paper, 
  Typography, 
  Grid, 
  TextField, 
  Button, 
  Divider,
  Tabs,
  Tab,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  IconButton,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Alert,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { PhotoCamera, Save, LockReset } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

// Constants
const regions = [
  'Addis Ababa', 'Amhara', 'Oromia', 'Tigray', 'SNNP', 
  'Somali', 'Afar', 'Dire Dawa', 'Harari', 'Benishangul-Gumuz', 'Gambela', 'Sidama'
];

const subCities = {
  'Addis Ababa': [
    'Bole', 'Gulele', 'Yeka', 'Addis Ketema', 'Akaki Kaliti', 
    'Arada', 'Kirkos', 'Kolfe Keranio', 'Lideta', 'Nifas Silk-Lafto'
  ],
};

const documentTypes = [
  { value: 'nationalId', label: 'National ID' },
  { value: 'passport', label: 'Passport' },
  { value: 'other', label: 'Other Document' },
];

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const Settings = () => {
  const theme = useTheme();
  const { user, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    region: user?.address?.region || '',
    subCity: user?.address?.subCity || '',
    specificLocation: user?.address?.specificLocation || '',
    documentType: 'nationalId',
    documentNumber: '',
    documentFile: null,
    currentPassword: '',
    newPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      documentFile: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (activeTab === 0) {
        // Profile update
        const { error: updateError } = await updateProfile({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim(),
          address: {
            region: formData.region,
            subCity: formData.subCity,
            specificLocation: formData.specificLocation,
          },
        });

        if (updateError) {
          throw new Error(updateError);
        }
        
        setSuccess('Profile updated successfully!');
      } else {
        // Password change
        if (!formData.currentPassword || !formData.newPassword) {
          throw new Error('Please fill in all password fields');
        }
        
        if (formData.newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }

        const { error: passwordError } = await changePassword(
          formData.currentPassword,
          formData.newPassword
        );

        if (passwordError) {
          throw new Error(passwordError);
        }

        setSuccess('Password changed successfully!');
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: ''
        }));
      }
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message || 'An error occurred while updating your settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        Account Settings
      </Typography>

      <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="settings tabs"
            variant="fullWidth"
          >
            <Tab label="Profile Information" {...a11yProps(0)} />
            <Tab label="Security" {...a11yProps(1)} />
          </Tabs>
        </Box>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              {/* Profile Picture */}
              <Grid item xs={12} md={3}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardHeader 
                    title="Profile Picture" 
                    titleTypographyProps={{ variant: 'h6' }}
                  />
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ position: 'relative', mb: 2 }}>
                      <Avatar 
                        src={user?.profilePicture} 
                        sx={{ width: 120, height: 120, mb: 2 }}
                      />
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="profile-picture-upload"
                        type="file"
                        onChange={handleFileChange}
                      />
                      <label htmlFor="profile-picture-upload">
                        <IconButton
                          color="primary"
                          aria-label="upload picture"
                          component="span"
                          sx={{
                            position: 'absolute',
                            bottom: 10,
                            right: 10,
                            bgcolor: 'background.paper',
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                        >
                          <PhotoCamera />
                        </IconButton>
                      </label>
                    </Box>
                    <Typography variant="body2" color="text.secondary" align="center">
                      JPG, GIF or PNG. Max size of 2MB
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Personal Information */}
              <Grid item xs={12} md={9}>
                <Card variant="outlined">
                  <CardHeader 
                    title="Personal Information" 
                    titleTypographyProps={{ variant: 'h6' }}
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="First Name"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                          margin="normal"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Last Name"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                          margin="normal"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          disabled
                          margin="normal"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          margin="normal"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Address Information */}
                <Card variant="outlined" sx={{ mt: 3 }}>
                  <CardHeader 
                    title="Address Information" 
                    titleTypographyProps={{ variant: 'h6' }}
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth margin="normal">
                          <InputLabel>Region</InputLabel>
                          <Select
                            name="region"
                            value={formData.region}
                            onChange={handleChange}
                            label="Region"
                            required
                          >
                            {regions.map((region) => (
                              <MenuItem key={region} value={region}>
                                {region}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth margin="normal">
                          <InputLabel>Sub-city</InputLabel>
                          <Select
                            name="subCity"
                            value={formData.subCity}
                            onChange={handleChange}
                            label="Sub-city"
                            disabled={!formData.region}
                            required
                          >
                            {(subCities[formData.region] || []).map((city) => (
                              <MenuItem key={city} value={city}>
                                {city}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Specific Location"
                          name="specificLocation"
                          value={formData.specificLocation}
                          onChange={handleChange}
                          placeholder="Street name, building, landmark, etc."
                          margin="normal"
                          multiline
                          rows={2}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Identity Documents */}
                <Card variant="outlined" sx={{ mt: 3 }}>
                  <CardHeader 
                    title="Identity Verification" 
                    titleTypographyProps={{ variant: 'h6' }}
                    subheader="Upload a valid ID for verification"
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth margin="normal">
                          <InputLabel>Document Type</InputLabel>
                          <Select
                            name="documentType"
                            value={formData.documentType}
                            onChange={handleChange}
                            label="Document Type"
                          >
                            {documentTypes.map((doc) => (
                              <MenuItem key={doc.value} value={doc.value}>
                                {doc.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={8}>
                        <TextField
                          fullWidth
                          label="Document Number"
                          name="documentNumber"
                          value={formData.documentNumber}
                          onChange={handleChange}
                          margin="normal"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <input
                          accept="application/pdf,image/*"
                          style={{ display: 'none' }}
                          id="document-upload"
                          type="file"
                          onChange={handleFileChange}
                        />
                        <label htmlFor="document-upload">
                          <Button
                            component="span"
                            variant="outlined"
                            startIcon={<PhotoCamera />}
                            sx={{ mt: 1 }}
                          >
                            Upload Document
                          </Button>
                        </label>
                        {formData.documentFile && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Selected: {formData.documentFile.name}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                          Accepted formats: PDF, JPG, PNG. Max size: 5MB
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Card variant="outlined">
              <CardHeader 
                title="Change Password" 
                titleTypographyProps={{ variant: 'h6' }}
                avatar={<LockReset color="primary" />}
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Current Password"
                      name="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      required
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="New Password"
                      name="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={handleChange}
                      required
                      margin="normal"
                      helperText="Password must be at least 6 characters long"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Status Messages */}
          <Box sx={{ p: 3, pt: 0 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                startIcon={<Save />}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Settings;
