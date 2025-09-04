import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { FiUpload, FiX, FiPlus, FiMinus } from 'react-icons/fi';
import api from '../../services/api';

const propertyTypes = [
  'house',
  'apartment',
  'land',
  'commercial',
  'office',
  'warehouse',
  'other'
];

const sizeUnits = ['sqm', 'sqft', 'hectares', 'acres'];

const CreateProperty = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [features, setFeatures] = useState(['']);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      propertyType: 'house',
      price: {
        currency: 'ETB',
        negotiable: false
      },
      size: {
        unit: 'sqm'
      },
      bedrooms: 0,
      bathrooms: 0
    }
  });

  const handleAddFeature = () => {
    setFeatures([...features, '']);
  };

  const handleRemoveFeature = (index) => {
    const updatedFeatures = [...features];
    updatedFeatures.splice(index, 1);
    setFeatures(updatedFeatures);
  };

  const handleFeatureChange = (index, value) => {
    const updatedFeatures = [...features];
    updatedFeatures[index] = value;
    setFeatures(updatedFeatures);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file types and size
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}. Only JPG, PNG, and WebP are allowed.`);
        return false;
      }
      
      if (file.size > maxSize) {
        toast.error(`File too large: ${file.name}. Maximum size is 5MB.`);
        return false;
      }
      
      return true;
    });
    
    // Create previews
    const newImagePreviews = validFiles.map(file => URL.createObjectURL(file));
    setImages([...images, ...validFiles]);
    setImagePreviews([...imagePreviews, ...newImagePreviews]);
  };

  const removeImage = (index) => {
    const newImages = [...images];
    const newPreviews = [...imagePreviews];
    
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const onSubmit = async (data) => {
    if (images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Upload images first
      const imageUrls = [];
      for (const image of images) {
        const formData = new FormData();
        formData.append('image', image);
        
        const { data: uploadData } = await api.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        imageUrls.push({
          url: uploadData.url,
          publicId: uploadData.public_id,
          isPrimary: imageUrls.length === 0 // First image is primary
        });
      }
      
      // Create property with image URLs
      const propertyData = {
        ...data,
        features: features.filter(feature => feature.trim() !== ''),
        images: imageUrls
      };
      
      await api.post('/properties', propertyData);
      
      toast.success('Property submitted successfully! It will be reviewed by our team.');
      navigate('/dashboard/my-listings');
    } catch (error) {
      console.error('Error creating property:', error);
      toast.error(error.response?.data?.message || 'Failed to create property');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Add New Property</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Title *
              </label>
              <input
                type="text"
                {...register('title', { required: 'Title is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="E.g. Beautiful 3 Bedroom Apartment"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Type *
              </label>
              <select
                {...register('propertyType', { required: 'Property type is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {propertyTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                {...register('description', { 
                  required: 'Description is required',
                  minLength: { value: 30, message: 'Description should be at least 30 characters' }
                })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your property in detail..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Location */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Location</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                {...register('location.city', { required: 'City is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="E.g. Addis Ababa"
              />
              {errors.location?.city && (
                <p className="mt-1 text-sm text-red-600">{errors.location.city.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sub-city *
              </label>
              <input
                type="text"
                {...register('location.subCity', { required: 'Sub-city is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="E.g. Bole"
              />
              {errors.location?.subCity && (
                <p className="mt-1 text-sm text-red-600">{errors.location.subCity.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <input
                type="text"
                {...register('location.address', { required: 'Address is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="E.g. Bole Road, near Edna Mall"
              />
              {errors.location?.address && (
                <p className="mt-1 text-sm text-red-600">{errors.location.address.message}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Property Details */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Property Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <div className="flex">
                <input
                  type="number"
                  {...register('price.amount', { 
                    required: 'Price is required',
                    min: { value: 0, message: 'Price must be positive' }
                  })}
                  className="w-full rounded-r-none px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                <select
                  {...register('price.currency')}
                  className="rounded-l-none border-l-0 px-3 py-2 border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ETB">ETB</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              {errors.price?.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.price.amount.message}</p>
              )}
              <div className="mt-2 flex items-center">
                <input
                  type="checkbox"
                  id="negotiable"
                  {...register('price.negotiable')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="negotiable" className="ml-2 block text-sm text-gray-700">
                  Price is negotiable
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Size *
              </label>
              <div className="flex">
                <input
                  type="number"
                  {...register('size.value', { 
                    required: 'Size is required',
                    min: { value: 0, message: 'Size must be positive' }
                  })}
                  className="w-full rounded-r-none px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                <select
                  {...register('size.unit')}
                  className="rounded-l-none border-l-0 px-3 py-2 border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sizeUnits.map(unit => (
                    <option key={unit} value={unit}>
                      {unit.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              {errors.size?.value && (
                <p className="mt-1 text-sm text-red-600">{errors.size.value.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bedrooms
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    const current = parseInt(document.getElementById('bedrooms').value) || 0;
                    if (current > 0) {
                      document.getElementById('bedrooms').value = current - 1;
                    }
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-l-md bg-gray-100 hover:bg-gray-200 focus:outline-none"
                >
                  <FiMinus className="h-4 w-4" />
                </button>
                <input
                  id="bedrooms"
                  type="number"
                  {...register('bedrooms', { min: 0 })}
                  className="w-full px-3 py-2 border-t border-b border-gray-300 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                <button
                  type="button"
                  onClick={() => {
                    const current = parseInt(document.getElementById('bedrooms').value) || 0;
                    document.getElementById('bedrooms').value = current + 1;
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-r-md bg-gray-100 hover:bg-gray-200 focus:outline-none"
                >
                  <FiPlus className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bathrooms
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    const current = parseInt(document.getElementById('bathrooms').value) || 0;
                    if (current > 0) {
                      document.getElementById('bathrooms').value = current - 1;
                    }
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-l-md bg-gray-100 hover:bg-gray-200 focus:outline-none"
                >
                  <FiMinus className="h-4 w-4" />
                </button>
                <input
                  id="bathrooms"
                  type="number"
                  {...register('bathrooms', { min: 0 })}
                  className="w-full px-3 py-2 border-t border-b border-gray-300 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                <button
                  type="button"
                  onClick={() => {
                    const current = parseInt(document.getElementById('bathrooms').value) || 0;
                    document.getElementById('bathrooms').value = current + 1;
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-r-md bg-gray-100 hover:bg-gray-200 focus:outline-none"
                >
                  <FiPlus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Features */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Features (e.g., Garden, Parking, Furnished)
              </label>
              <button
                type="button"
                onClick={handleAddFeature}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Feature
              </button>
            </div>
            
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="E.g. Garden, Parking, Furnished"
                  />
                  {features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      className="ml-2 p-2 text-red-600 hover:text-red-800"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Images */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Property Images</h2>
          
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Upload images</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, WebP up to 5MB
              </p>
            </div>
          </div>
          
          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Uploaded Images ({imagePreviews.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="h-24 w-full object-cover rounded-md"
                    />
                    {index === 0 && (
                      <span className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                        Primary
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100"
                    >
                      <FiX className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Property'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProperty;
