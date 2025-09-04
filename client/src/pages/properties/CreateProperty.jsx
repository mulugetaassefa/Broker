import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateProperty = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyType: 'apartment',
    listingType: 'sale',
    price: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    address: '',
    city: 'Addis Ababa',
    contactName: '',
    contactPhone: '',
    contactEmail: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    
    // Submit logic here
    console.log('Submitting:', formData);
    navigate('/dashboard/my-listings');
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Basic Information</h2>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Property Title"
              className="w-full p-2 border rounded"
              required
            />
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Description"
              rows={4}
              className="w-full p-2 border rounded"
              required
            />
            <select
              name="propertyType"
              value={formData.propertyType}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="villa">Villa</option>
              <option value="office">Office</option>
              <option value="land">Land</option>
            </select>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="listingType"
                  value="sale"
                  checked={formData.listingType === 'sale'}
                  onChange={handleChange}
                  className="mr-2"
                />
                For Sale
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="listingType"
                  value="rent"
                  checked={formData.listingType === 'rent'}
                  onChange={handleChange}
                  className="mr-2"
                />
                For Rent
              </label>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Property Details</h2>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="Price (ETB)"
              className="w-full p-2 border rounded"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <select
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleChange}
                className="p-2 border rounded"
                required
              >
                <option value="">Bedrooms</option>
                {[1, 2, 3, 4, '5+'].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
              <select
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleChange}
                className="p-2 border rounded"
                required
              >
                <option value="">Bathrooms</option>
                {[1, 2, 3, 4, '5+'].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
            <input
              type="number"
              name="area"
              value={formData.area}
              onChange={handleChange}
              placeholder="Area (m²)"
              className="w-full p-2 border rounded"
              required
            />
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Contact Information</h2>
            <input
              type="text"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              placeholder="Your Name"
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="tel"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              placeholder="Phone Number"
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="Email Address"
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Property Address"
              className="w-full p-2 border rounded"
              required
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">List a New Property</h1>
      
      {/* Progress Steps */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3].map((stepNum) => (
          <div key={stepNum} className="flex flex-col items-center">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                step === stepNum ? 'bg-blue-600' : 
                step > stepNum ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              {stepNum}
            </div>
            <span className="text-sm mt-1">
              {['Basic', 'Details', 'Contact'][stepNum - 1]}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {renderStep()}
        
        <div className="flex justify-between pt-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 border rounded text-gray-700"
            >
              Back
            </button>
          ) : (
            <div></div>
          )}
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {step === 3 ? 'Submit Property' : 'Next'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProperty;
