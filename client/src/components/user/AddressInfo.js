import React from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Grid,
  MenuItem,
  Typography,
  CircularProgress
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../../utils/api';

const REGIONS = [
  'Addis Ababa', 'Amhara', 'Oromia', 'Tigray', 'SNNP', 
  'Somali', 'Afar', 'Dire Dawa', 'Harari', 'Benishangul-Gumuz', 
  'Gambela', 'Sidama'
];

const SUB_CITIES = {
  'Addis Ababa': [
    'Bole', 'Gulele', 'Yeka', 'Addis Ketema', 'Akaki Kaliti',
    'Arada', 'Kirkos', 'Kolfe Keranio', 'Lideta', 'Nifas Silk-Lafto'
  ],
  // Add other regions and their sub-cities as needed
};

const validationSchema = Yup.object({
  region: Yup.string().required('Region is required'),
  subCity: Yup.string().when('region', {
    is: (region) => region === 'Addis Ababa',
    then: Yup.string().required('Sub-city is required'),
    otherwise: Yup.string()
  }),
  specificLocation: Yup.string()
    .max(200, 'Location cannot exceed 200 characters')
    .required('Specific location is required'),
});

const AddressInfo = ({ address, onUpdateSuccess, setError }) => {
  const formik = useFormik({
    initialValues: {
      region: address?.region || '',
      subCity: address?.subCity || '',
      specificLocation: address?.specificLocation || '',
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await api.put('/users/me', {
          address: values
        });
        onUpdateSuccess('Address updated successfully');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to update address');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const filteredSubCities = formik.values.region ? 
    (SUB_CITIES[formik.values.region] || []) : [];

  return (
    <Box component="form" onSubmit={formik.handleSubmit}>
      <Typography variant="h6" gutterBottom>
        Address Information
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            id="region"
            name="region"
            select
            label="Region"
            value={formik.values.region}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.region && Boolean(formik.errors.region)}
            helperText={formik.touched.region && formik.errors.region}
            margin="normal"
          >
            <MenuItem value="">
              <em>Select a region</em>
            </MenuItem>
            {REGIONS.map((region) => (
              <MenuItem key={region} value={region}>
                {region}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            id="subCity"
            name="subCity"
            select
            label={formik.values.region === 'Addis Ababa' ? 'Sub-city' : 'City/Town'}
            value={formik.values.subCity}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.subCity && Boolean(formik.errors.subCity)}
            helperText={formik.touched.subCity && formik.errors.subCity}
            margin="normal"
            disabled={!formik.values.region}
          >
            <MenuItem value="">
              <em>Select {formik.values.region === 'Addis Ababa' ? 'sub-city' : 'city/town'}</em>
            </MenuItem>
            {filteredSubCities.length > 0 ? (
              filteredSubCities.map((city) => (
                <MenuItem key={city} value={city}>
                  {city}
                </MenuItem>
              ))
            ) : (
              <MenuItem value="">
                <em>Enter city/town name</em>
              </MenuItem>
            )}
          </TextField>
          
          {filteredSubCities.length === 0 && formik.values.region && (
            <TextField
              fullWidth
              id="subCity"
              name="subCity"
              label="City/Town Name"
              value={formik.values.subCity}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.subCity && Boolean(formik.errors.subCity)}
              helperText={formik.touched.subCity && formik.errors.subCity}
              margin="normal"
            />
          )}
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            id="specificLocation"
            name="specificLocation"
            label="Specific Location"
            placeholder="E.g., Bole Road, near Edna Mall, House No. 123"
            value={formik.values.specificLocation}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.specificLocation && Boolean(formik.errors.specificLocation)}
            helperText={
              (formik.touched.specificLocation && formik.errors.specificLocation) ||
              'Please provide detailed address information'
            }
            margin="normal"
            multiline
            rows={3}
          />
        </Grid>
      </Grid>

      <Box mt={3} display="flex" justifyContent="flex-end">
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={formik.isSubmitting}
          startIcon={formik.isSubmitting ? <CircularProgress size={20} /> : null}
        >
          {formik.isSubmitting ? 'Saving...' : 'Save Address'}
        </Button>
      </Box>
    </Box>
  );
};

export default AddressInfo;
