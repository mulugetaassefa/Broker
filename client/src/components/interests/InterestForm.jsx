import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { FiUpload, FiX } from 'react-icons/fi';

const InterestForm = ({ onSuccess, interest: propInterest }) => {
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm({
    defaultValues: propInterest ? {
      type: propInterest.type,
      transactionType: propInterest.transactionType,
      notes: propInterest.notes,
      details: {
        ...(propInterest.priceRange && {
          minPrice: propInterest.priceRange.min,
          maxPrice: propInterest.priceRange.max
        }),
        ...propInterest.details
      }
    } : { type: 'house', transactionType: 'buy' }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImages, setPreviewImages] = useState(propInterest?.images?.map(img => ({
    url: img.url || getImageUrl(img),
    file: null,
    isNew: false
  })) || []);
  const selectedType = watch('type');
  const currentYear = new Date().getFullYear();

  const getImageUrl = (image) => {
    if (!image) return '';
    if (typeof image === 'string') return image;
    if (image.url) return image.url;
    if (image.path) return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/interests/${image.path.split('/').pop()}`;
    return '';
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload only image files');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages(prev => [...prev, {
          url: reader.result,
          file,
          isNew: true
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  // Field configurations for each interest type
  const fieldConfigs = {
    house: [
      { name: 'numRooms', label: 'Number of Rooms', type: 'number', required: true, min: 1 },
    ],
    car: [
      { name: 'model', label: 'Model', type: 'text', required: true },
      { 
        name: 'year', 
        label: 'Year of Buy', 
        type: 'number', 
        required: true,
        min: 1900,
        max: currentYear,
        defaultValue: currentYear
      },
    ],
    other: [
      { name: 'itemType', label: 'Item Type', type: 'text', required: true },
    ]
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const formData = new FormData();
    
    // Add basic fields
    formData.append('type', data.type);
    formData.append('transactionType', data.transactionType);
    formData.append('notes', data.notes || '');
    
    // Add images
    previewImages.forEach((img, index) => {
      if (img.isNew && img.file) {
        formData.append('images', img.file);
      }
    });
    
    // Prepare price range as an object (not stringified)
    const priceRange = {
      min: parseFloat(data.details?.minPrice) || 0,
      max: parseFloat(data.details?.maxPrice) || 0,
      currency: 'USD' // Add default currency
    };
    
    // Append price range as separate fields
    formData.append('priceRange[min]', priceRange.min);
    formData.append('priceRange[max]', priceRange.max);
    formData.append('priceRange[currency]', priceRange.currency);
    
    // Add type-specific fields
    if (data.type === 'house') {
      formData.append('numRooms', data.details?.numRooms || 1);
      formData.append('numBathrooms', data.details?.numBathrooms || 1);
      formData.append('hasParking', data.details?.hasParking || false);
      formData.append('hasGarden', data.details?.hasGarden || false);
    } else if (data.type === 'car') {
      formData.append('carModel', data.details?.model || '');
      formData.append('carYear', data.details?.year || currentYear);
      formData.append('mileage', data.details?.mileage || 0);
      formData.append('transmission', data.details?.transmission || 'automatic');
      formData.append('fuelType', data.details?.fuelType || 'petrol');
    } else if (data.type === 'other') {
      formData.append('itemType', data.details?.itemType || 'Other');
      formData.append('condition', data.details?.condition || 'new');
      formData.append('description', data.details?.description || '');
    }
    
    // No image handling needed

    try {
      if (propInterest?._id) {
        // Update existing interest
        await api.interests.update(propInterest._id, formData);
        toast.success('Interest updated successfully!');
      } else {
        // Create new interest
        await api.interests.submit(formData);
        toast.success('Interest submitted successfully!');
      }
      
      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit interest. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">{propInterest ? 'Edit Interest' : 'Create New Interest'}</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interest Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register('type')}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="house">House</option>
              <option value="car">Car</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction <span className="text-red-500">*</span>
            </label>
            <select
              {...register('transactionType')}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
              <option value="rent">Rent</option>
              <option value="lease">Lease</option>
            </select>
          </div>
        </div>

        {/* Price Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Price (ETB) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              {...register('details.minPrice', { 
                required: 'Minimum price is required',
                valueAsNumber: true
              })}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
              placeholder="e.g. 100000"
            />
            {errors.details?.minPrice && (
              <p className="mt-1 text-sm text-red-600">
                {errors.details.minPrice.message}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Price (ETB) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              {...register('details.maxPrice', { 
                required: 'Maximum price is required',
                valueAsNumber: true,
                validate: (value, formValues) => 
                  Number(value) >= Number(formValues.details?.minPrice || 0) || 
                  'Must be greater than or equal to minimum price'
              })}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
              placeholder="e.g. 500000"
            />
            {errors.details?.maxPrice && (
              <p className="mt-1 text-sm text-red-600">
                {errors.details.maxPrice.message}
              </p>
            )}
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Images (Optional)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                  >
                    <span>Upload files</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={isSubmitting}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
              </div>
            </div>
            
            {/* Image Previews */}
            {previewImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {previewImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img.url}
                      alt={`Preview ${index + 1}`}
                      className="h-32 w-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isSubmitting}
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic fields based on interest type */}
        <div className="space-y-4">
          {fieldConfigs[selectedType]?.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500"> *</span>}
              </label>
              <input
                type={field.type}
                min={field.min}
                max={field.max}
                {...register(`details.${field.name}`, { 
                  required: field.required ? `${field.label} is required` : false,
                  valueAsNumber: field.type === 'number'
                })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
                placeholder={field.placeholder || ''}
              />
              {errors.details?.[field.name] && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.details[field.name].message}
                </p>
              )}
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
            placeholder="Any additional information about your interest..."
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : propInterest ? 'Update Interest' : 'Submit Interest'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InterestForm;
