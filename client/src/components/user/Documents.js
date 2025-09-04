import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Chip
} from '@mui/material';
import {
  Description as DocumentIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  CheckCircle as VerifiedIcon,
  Warning as UnverifiedIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../../utils/api';

const DOCUMENT_TYPES = [
  { value: 'nationalId', label: 'National ID' },
  { value: 'passport', label: 'Passport' },
  { value: 'drivingLicense', label: 'Driving License' },
  { value: 'other', label: 'Other Document' },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

const validationSchema = Yup.object({
  documentType: Yup.string().required('Document type is required'),
  documentNumber: Yup.string().when('documentType', {
    is: (type) => type === 'nationalId' || type === 'passport' || type === 'drivingLicense',
    then: Yup.string().required('Document number is required'),
  }),
  expiryDate: Yup.date().when('documentType', {
    is: (type) => type === 'passport' || type === 'drivingLicense',
    then: Yup.date().min(new Date(), 'Expiry date must be in the future').required('Expiry date is required'),
  }),
});

const DocumentItem = ({ document, type, onDelete }) => {
  const getDocumentTitle = () => {
    switch (type) {
      case 'nationalId':
        return 'National ID';
      case 'passport':
        return 'Passport';
      case 'other':
        return document.name || 'Document';
      default:
        return 'Document';
    }
  };

  return (
    <Paper variant="outlined" sx={{ mb: 2, p: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center">
          <DocumentIcon color="action" sx={{ mr: 2 }} />
          <Box>
            <Typography variant="subtitle1">
              {getDocumentTitle()}
              {document.verified ? (
                <Chip
                  icon={<VerifiedIcon fontSize="small" />}
                  label="Verified"
                  color="success"
                  size="small"
                  sx={{ ml: 1 }}
                />
              ) : (
                <Chip
                  icon={<UnverifiedIcon fontSize="small" />}
                  label="Pending Verification"
                  color="warning"
                  size="small"
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
            {document.number && (
              <Typography variant="body2" color="textSecondary">
                Number: {document.number}
              </Typography>
            )}
            {document.expiryDate && (
              <Typography variant="body2" color="textSecondary">
                Expires: {new Date(document.expiryDate).toLocaleDateString()}
              </Typography>
            )}
            <Typography variant="body2" color="textSecondary">
              Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
        <Box>
          <IconButton
            color="primary"
            href={document.document}
            target="_blank"
            rel="noopener noreferrer"
          >
            <CloudUploadIcon />
          </IconButton>
          {!document.verified && (
            <IconButton color="error" onClick={() => onDelete(type, document._id)}>
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

const Documents = ({ documents, onUpdateSuccess, setError }) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');

  const formik = useFormik({
    initialValues: {
      documentType: '',
      documentNumber: '',
      expiryDate: '',
      documentName: '',
    },
    validationSchema,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      if (!selectedFile) {
        setFileError('Please select a document to upload');
        setSubmitting(false);
        return;
      }

      try {
        const formData = new FormData();
        formData.append('document', selectedFile);
        formData.append('documentType', values.documentType);
        formData.append('documentNumber', values.documentNumber);
        
        if (values.expiryDate) {
          formData.append('expiryDate', values.expiryDate);
        }

        if (values.documentType === 'other' && values.documentName) {
          formData.append('documentName', values.documentName);
        }

        await api.post('/users/me/documents', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        onUpdateSuccess('Document uploaded successfully');
        resetForm();
        setSelectedFile(null);
        setFileError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to upload document');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setFileError('Invalid file type. Please upload a PDF, JPEG, or PNG file.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError('File size exceeds the 5MB limit');
      return;
    }

    setSelectedFile(file);
    setFileError('');
  };

  const handleDelete = async (docType, docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await api.delete(`/users/me/documents/${docType}/${docId}`);
        onUpdateSuccess('Document deleted successfully');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete document');
      }
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Identity Documents
      </Typography>
      
      <Typography variant="body1" color="textSecondary" paragraph>
        Upload your identity documents for verification. This helps us ensure the security of your account.
      </Typography>

      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardHeader title="Upload New Document" />
        <Divider />
        <CardContent>
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  id="documentType"
                  name="documentType"
                  label="Document Type"
                  value={formik.values.documentType}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.documentType && Boolean(formik.errors.documentType)}
                  helperText={formik.touched.documentType && formik.errors.documentType}
                >
                  <MenuItem value="">
                    <em>Select document type</em>
                  </MenuItem>
                  {DOCUMENT_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {formik.values.documentType === 'other' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="documentName"
                    name="documentName"
                    label="Document Name"
                    value={formik.values.documentName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.documentName && Boolean(formik.errors.documentName)}
                    helperText={formik.touched.documentName && formik.errors.documentName}
                  />
                </Grid>
              )}

              {(formik.values.documentType === 'nationalId' || 
                formik.values.documentType === 'passport' || 
                formik.values.documentType === 'drivingLicense') && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="documentNumber"
                    name="documentNumber"
                    label={
                      formik.values.documentType === 'nationalId' ? 'ID Number' :
                      formik.values.documentType === 'passport' ? 'Passport Number' :
                      'License Number'
                    }
                    value={formik.values.documentNumber}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.documentNumber && Boolean(formik.errors.documentNumber)}
                    helperText={formik.touched.documentNumber && formik.errors.documentNumber}
                  />
                </Grid>
              )}

              {(formik.values.documentType === 'passport' || 
                formik.values.documentType === 'drivingLicense') && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="expiryDate"
                    name="expiryDate"
                    label="Expiry Date"
                    type="date"
                    value={formik.values.expiryDate}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.expiryDate && Boolean(formik.errors.expiryDate)}
                    helperText={formik.touched.expiryDate && formik.errors.expiryDate}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <input
                  accept=".pdf,image/jpeg,image/png"
                  style={{ display: 'none' }}
                  id="document-upload"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="document-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    disabled={uploading}
                  >
                    {selectedFile ? selectedFile.name : 'Select Document'}
                  </Button>
                </label>
                {fileError && (
                  <Typography color="error" variant="caption" display="block" gutterBottom>
                    {fileError}
                  </Typography>
                )}
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Accepted formats: PDF, JPEG, PNG (Max 5MB)
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={!selectedFile || formik.isSubmitting}
                  startIcon={formik.isSubmitting ? <CircularProgress size={20} /> : null}
                >
                  {formik.isSubmitting ? 'Uploading...' : 'Upload Document'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          My Documents
        </Typography>
        
        {documents?.nationalId && (
          <DocumentItem 
            document={documents.nationalId} 
            type="nationalId" 
            onDelete={handleDelete}
          />
        )}
        
        {documents?.passport && (
          <DocumentItem 
            document={documents.passport} 
            type="passport" 
            onDelete={handleDelete}
          />
        )}
        
        {documents?.otherDocuments?.length > 0 && (
          <Box mt={2}>
            {documents.otherDocuments.map((doc, index) => (
              <DocumentItem 
                key={doc._id || index}
                document={doc} 
                type="other" 
                onDelete={handleDelete}
              />
            ))}
          </Box>
        )}
        
        {!documents?.nationalId && !documents?.passport && (!documents?.otherDocuments || documents.otherDocuments.length === 0) && (
          <Alert severity="info">
            You haven't uploaded any documents yet. Please upload at least one identity document for verification.
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default Documents;
