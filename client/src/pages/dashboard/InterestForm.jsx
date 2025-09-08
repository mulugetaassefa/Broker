import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { FiHome, FiTruck, FiPackage, FiArrowLeft, FiUpload, FiX, FiImage } from 'react-icons/fi';
import { useDropzone } from 'react-dropzone';

const InterestForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'house',
    transactionType: 'buy',
    priceRange: {
      min: '',
      max: ''
    },
    numRooms: '',
    carModel: '',
    carYear: new Date().getFullYear(),
    itemType: '',
    notes: '',
    images: []
  });
  const [errors, setErrors] = useState({});

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length) {
      setFormData(prev => ({
        ...prev,
        images: [
          ...prev.images,
          ...acceptedFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            name: file.name,
            size: file.size
          }))
        ]
      }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: true
  });

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const setPrimaryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }))
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.type) {
      newErrors.type = 'Please select a type';
    }
    
    if (!formData.transactionType) {
      newErrors.transactionType = 'Please select a transaction type';
    }
    
    if (formData.type === 'house' && !formData.numRooms) {
      newErrors.numRooms = 'Number of rooms is required';
    }
    
    if (formData.type === 'car' && !formData.carModel) {
      newErrors.carModel = 'Car model is required';
    }
    
    if (formData.type === 'other' && !formData.itemType) {
      newErrors.itemType = 'Item type is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setUploading(true);
    
    try {
      // Create a plain object for the request
      const requestData = {
        type: formData.type,
        transactionType: formData.transactionType,
        notes: formData.notes || '',
        priceRange: {
          min: formData.priceRange?.min ? parseFloat(formData.priceRange.min) : 0,
          max: formData.priceRange?.max ? parseFloat(formData.priceRange.max) : 0,
          currency: 'ETB'
        }
      };

      // Add type-specific fields
      if (formData.type === 'house') {
        requestData.houseDetails = {
          numRooms: formData.numRooms ? parseInt(formData.numRooms) : 0,
          numBathrooms: formData.numBathrooms ? parseInt(formData.numBathrooms) : 1,
          hasParking: formData.hasParking === true || formData.hasParking === 'true',
          hasGarden: formData.hasGarden === true || formData.hasGarden === 'true'
        };
      } else if (formData.type === 'car') {
        requestData.carDetails = {
          model: formData.carModel || 'Unknown',
          year: formData.carYear ? parseInt(formData.carYear) : new Date().getFullYear(),
          mileage: formData.mileage ? parseInt(formData.mileage) : 0,
          transmission: formData.transmission || 'automatic',
          fuelType: formData.fuelType || 'petrol'
        };
      } else if (formData.type === 'other') {
        requestData.otherDetails = {
          itemType: formData.itemType || 'Other',
          condition: formData.condition || 'new',
          description: formData.description || ''
        };
      }

      // Create FormData for file uploads
      const formDataToSend = new FormData();
      
      // Append all data as JSON
      formDataToSend.append('data', JSON.stringify(requestData));
      
      // Append files
      formData.images?.forEach((image) => {
        if (image.file) {
          formDataToSend.append('images', image.file);
        }
      });

      console.log('Submitting form data:', JSON.stringify(requestData, null, 2));
      
      // Add images
      formData.images?.forEach((image) => {
        if (image.file) {
          formDataToSend.append('images', image.file);
        }
      });
      
      console.log('Submitting form data:', {
        type: formData.type,
        transactionType: formData.transactionType,
        priceRange: formData.priceRange,
        images: formData.images.map(img => img.name)
      });
      
      // Submit the form data with images
      const response = await api.interests.submit(formDataToSend);
      
      if (response.success) {
        toast.success('Interest submitted successfully!');
        navigate('/dashboard/my-interests');
      } else {
        throw new Error(response.message || 'Failed to submit interest');
      }
      
    } catch (error) {
      console.error('Detailed error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        request: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
          headers: error.config?.headers
        }
      });
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        // Log the complete error details
        console.error('Validation errors:', error.response.data);
        
        // Handle validation errors
        if (error.response.data?.errors) {
          const validationErrors = {};
          error.response.data.errors.forEach(err => {
            console.error(`Field: ${err.path}, Error: ${err.message}`);
            validationErrors[err.path] = err.message;
          });
          setErrors(validationErrors);
          toast.error('Please fix the form errors');
        } else if (error.response.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error('Invalid form data. Please check all fields.');
        }
      } else if (error.response?.status === 401) {
        toast.error('Please log in to submit an interest');
        navigate('/login');
      } else if (error.response?.status === 413) {
        toast.error('File size too large. Maximum size is 5MB');
      } else {
        toast.error(error.response?.data?.message || 'Failed to submit interest');
      }
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    if (name === 'min' || name === 'max') {
      setFormData({
        ...formData,
        priceRange: {
          ...formData.priceRange,
          [name]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const renderFormFields = () => {
    switch (formData.type) {
      case 'house':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Price
                </label>
                <input
                  type="number"
                  name="min"
                  value={formData.priceRange.min}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.min ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  placeholder="Min price"
                  required
                />
                {errors.min && (
                  <p className="mt-1 text-sm text-red-600">{errors.min}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Price
                </label>
                <input
                  type="number"
                  name="max"
                  value={formData.priceRange.max}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.max ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  placeholder="Max price"
                  required
                />
                {errors.max && (
                  <p className="mt-1 text-sm text-red-600">{errors.max}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Rooms
              </label>
              <input
                type="number"
                name="numRooms"
                value={formData.numRooms}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.numRooms ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                placeholder="Number of rooms"
                required
                min="1"
              />
              {errors.numRooms && (
                <p className="mt-1 text-sm text-red-600">{errors.numRooms}</p>
              )}
            </div>
          </div>
        );
      
      case 'car':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Car Model
              </label>
              <input
                type="text"
                name="carModel"
                value={formData.carModel}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.carModel ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                placeholder="e.g., Toyota Camry"
                required
              />
              {errors.carModel && (
                <p className="mt-1 text-sm text-red-600">{errors.carModel}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <input
                  type="number"
                  name="carYear"
                  value={formData.carYear}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.carYear ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  placeholder={`e.g., ${new Date().getFullYear()}`}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  required
                />
                {errors.carYear && (
                  <p className="mt-1 text-sm text-red-600">{errors.carYear}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Range
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    name="min"
                    value={formData.priceRange.min}
                    onChange={handleChange}
                    className={`w-1/2 px-3 py-2 border ${errors.min ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                    placeholder="Min price"
                    required
                  />
                  <input
                    type="number"
                    name="max"
                    value={formData.priceRange.max}
                    onChange={handleChange}
                    className={`w-1/2 px-3 py-2 border ${errors.max ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                    placeholder="Max price"
                    required
                  />
                </div>
                {errors.min && (
                  <p className="mt-1 text-sm text-red-600">{errors.min}</p>
                )}
                {errors.max && (
                  <p className="mt-1 text-sm text-red-600">{errors.max}</p>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'other':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Type
              </label>
              <input
                type="text"
                name="itemType"
                value={formData.itemType}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.itemType ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                placeholder="e.g., Electronics, Furniture, etc."
                required
              />
              {errors.itemType && (
                <p className="mt-1 text-sm text-red-600">{errors.itemType}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Price
                </label>
                <input
                  type="number"
                  name="min"
                  value={formData.priceRange.min}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.min ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  placeholder="Min price"
                  required
                />
                {errors.min && (
                  <p className="mt-1 text-sm text-red-600">{errors.min}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Price
                </label>
                <input
                  type="number"
                  name="max"
                  value={formData.priceRange.max}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.max ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  placeholder="Max price"
                  required
                />
                {errors.max && (
                  <p className="mt-1 text-sm text-red-600">{errors.max}</p>
                )}
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiArrowLeft className="mr-2" /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Submit Your Interest</h1>
        <p className="text-gray-600 mt-1">
          Let us know what you're interested in, and we'll notify you when we have matching items.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-3">I'm interested in:</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'house' })}
                className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-colors ${formData.type === 'house' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
              >
                <FiHome className={`h-8 w-8 mb-2 ${formData.type === 'house' ? 'text-blue-600' : 'text-gray-600'}`} />
                <span className="font-medium">House</span>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'car' })}
                className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-colors ${formData.type === 'car' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
              >
                <FiTruck className={`h-8 w-8 mb-2 ${formData.type === 'car' ? 'text-blue-600' : 'text-gray-600'}`} />
                <span className="font-medium">Car</span>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'other' })}
                className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-colors ${formData.type === 'other' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
              >
                <FiPackage className={`h-8 w-8 mb-2 ${formData.type === 'other' ? 'text-blue-600' : 'text-gray-600'}`} />
                <span className="font-medium">Other</span>
              </button>
            </div>
          </div>

          {formData.type && (
            <>
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {formData.type === 'house' && 'House Details'}
                  {formData.type === 'car' && 'Car Details'}
                  {formData.type === 'other' && 'Item Details'}
                </h3>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Type
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['buy', 'sell', 'rent', 'lease'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, transactionType: type })}
                        className={`px-4 py-2 border rounded-md text-sm font-medium ${
                          formData.transactionType === type
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                
                {renderFormFields()}
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Images (Max 5)
                  </label>
                  <div 
                    {...getRootProps()} 
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
                      isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    <div className="space-y-1 text-center">
                      <FiImage className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                        >
                          <span>Upload files</span>
                          <input {...getInputProps()} />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, WEBP up to 5MB
                      </p>
                    </div>
                  </div>
                  
                  {formData.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {formData.images.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img.preview}
                            alt={`Upload ${index + 1}`}
                            className={`h-32 w-full object-cover rounded-md ${
                              img.isPrimary ? 'ring-2 ring-blue-500' : ''
                            }`}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center space-x-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPrimaryImage(index);
                              }}
                              className="p-1.5 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                              title="Set as primary"
                            >
                              {img.isPrimary ? '⭐' : '☆'}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(index);
                              }}
                              className="p-1.5 bg-white rounded-full text-red-600 hover:bg-red-50"
                              title="Remove image"
                            >
                              <FiX className="h-4 w-4" />
                            </button>
                          </div>
                          {img.isPrimary && (
                            <span className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                              Primary
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="mt-6">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Any additional information or requirements..."
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Interest'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default InterestForm;
