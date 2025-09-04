import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Bed, Bath, Ruler, Heart, Share2, Phone, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await api.properties.getById(id);
        setProperty(response.data);
      } catch (error) {
        console.error('Error fetching property:', error);
        toast.error('Failed to load property details');
        navigate('/properties');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, navigate]);

  const handleSaveProperty = () => {
    setIsSaved(!isSaved);
    toast.success(isSaved ? 'Removed from saved' : 'Saved to favorites');
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: property.title,
        text: `Check out this ${property.type} in ${property.address}`,
        url: window.location.href,
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-2xl font-bold mb-4">Property not found</h2>
        <button
          onClick={() => navigate('/properties')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Browse Properties
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">{property.title}</h1>
      </div>

      {/* Image Gallery */}
      <div className="relative mb-8 rounded-xl overflow-hidden bg-gray-100" style={{ paddingBottom: '50%' }}>
        {property.images.length > 0 ? (
          <>
            <img
              src={property.images[currentImageIndex]}
              alt={property.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Navigation Arrows */}
            {property.images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex(prev => 
                    prev === 0 ? property.images.length - 1 : prev - 1
                  )}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 shadow-md hover:bg-opacity-100"
                >
                  <svg className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentImageIndex(prev => 
                    prev === property.images.length - 1 ? 0 : prev + 1
                  )}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 shadow-md hover:bg-opacity-100"
                >
                  <svg className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            
            {/* Image Indicators */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
              {property.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-2 w-2 rounded-full ${currentImageIndex === index ? 'bg-white' : 'bg-white bg-opacity-50'}`}
                  aria-label={`View image ${index + 1}`}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            No images available
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{property.title}</h2>
                <div className="flex items-center text-gray-600 mt-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{property.address}</span>
                </div>
              </div>
              <div className="mt-3 sm:mt-0">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {property.status}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-6 pt-4 border-t border-gray-100">
              <div className="flex items-center text-gray-700">
                <Bed className="h-5 w-5 text-gray-500 mr-2" />
                <span>{property.beds} {property.beds === 1 ? 'Bed' : 'Beds'}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Bath className="h-5 w-5 text-gray-500 mr-2" />
                <span>{property.baths} {property.baths === 1 ? 'Bath' : 'Baths'}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Ruler className="h-5 w-5 text-gray-500 mr-2" />
                <span>{property.area} m²</span>
              </div>
              <div className="flex items-center text-gray-700">
                <span className="text-gray-500 mr-2">Year:</span>
                <span>{property.yearBuilt}</span>
              </div>
            </div>

            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold mb-3">About This Property</h3>
              <p className="text-gray-700">{property.description}</p>
            </div>

            {property.features && property.features.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-3">Features</h3>
                <div className="flex flex-wrap gap-2">
                  {property.features.map((feature, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">ETB {property.price.toLocaleString()}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveProperty}
                  className={`p-2 rounded-full ${isSaved ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}`}
                  aria-label={isSaved ? 'Remove from saved' : 'Save property'}
                >
                  <Heart className="h-5 w-5" fill={isSaved ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full text-gray-400 hover:text-gray-600"
                  aria-label="Share property"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <a
                href={`tel:${property.agent.phone}`}
                className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Phone className="h-5 w-5 mr-2" />
                Call Agent
              </a>
              <a
                href={`mailto:${property.agent.email}`}
                className="flex items-center justify-center px-4 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Mail className="h-5 w-5 mr-2" />
                Email Agent
              </a>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-500 mb-3">Listed by</h4>
              <div className="flex items-center">
                <img
                  src={property.agent.image}
                  alt={property.agent.name}
                  className="h-12 w-12 rounded-full object-cover mr-3"
                />
                <div>
                  <p className="font-medium">{property.agent.name}</p>
                  <p className="text-sm text-gray-500">Real Estate Agent</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
