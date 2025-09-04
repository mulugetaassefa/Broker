import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Bed, Bath, SquareDot, Heart, SlidersHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Mock data
const mockProperties = [
  {
    id: 1,
    title: 'Modern Apartment in Bole',
    address: 'Bole Road, Addis Ababa',
    price: 25000,
    type: 'apartment',
    beds: 2,
    baths: 2,
    area: 120,
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 2,
    title: 'Spacious Villa in Cazanchise',
    address: 'Cazanchise Road, Addis Ababa',
    price: 45000,
    type: 'villa',
    beds: 4,
    baths: 4,
    area: 250,
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
  }
];

const PropertyList = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    minPrice: '',
    maxPrice: '',
  });

  // Fetch properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        setProperties(mockProperties);
      } catch (error) {
        toast.error('Failed to load properties');
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  // Filter properties
  const filteredProperties = properties.filter(property => {
    const matchesSearch = 
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const minPrice = filters.minPrice ? parseInt(filters.minPrice) : 0;
    const maxPrice = filters.maxPrice ? parseInt(filters.maxPrice) : Infinity;
    const matchesPrice = property.price >= minPrice && property.price <= maxPrice;
    
    return matchesSearch && matchesPrice;
  });

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Find Your Dream Property</h1>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <Search className="text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <Link
              to={`/properties/${property.id}`}
              key={property.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <img
                className="w-full h-48 object-cover"
                src={property.image}
                alt={property.title}
              />
              <div className="p-4">
                <div className="flex justify-between">
                  <h3 className="font-semibold text-lg">{property.title}</h3>
                  <p className="text-blue-600 font-bold">ETB {property.price.toLocaleString()}</p>
                </div>
                <p className="text-gray-600 text-sm flex items-center mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  {property.address}
                </p>
                <div className="flex justify-between mt-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Bed className="h-4 w-4 mr-1" />
                    {property.beds} {property.beds === 1 ? 'Bed' : 'Beds'}
                  </span>
                  <span className="flex items-center">
                    <Bath className="h-4 w-4 mr-1" />
                    {property.baths} {property.baths === 1 ? 'Bath' : 'Baths'}
                  </span>
                  <span className="flex items-center">
                    <SquareDot className="h-4 w-4 mr-1" />
                    {property.area} m²
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PropertyList;
