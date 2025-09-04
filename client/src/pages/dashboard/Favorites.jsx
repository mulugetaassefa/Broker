import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiMapPin, FiFilter, FiSearch } from 'react-icons/fi';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Mock data
    setTimeout(() => {
      setFavorites([
        {
          id: 1,
          title: 'Modern Apartment in Bole',
          type: 'Apartment',
          price: 25000,
          location: 'Bole, Addis Ababa',
          image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
        },
        {
          id: 2,
          title: 'Spacious Villa in Kazanchis',
          type: 'Villa',
          price: 50000,
          location: 'Kazanchis, Addis Ababa',
          image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
        }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const handleRemove = (id) => {
    if (window.confirm('Remove from favorites?')) {
      setFavorites(favorites.filter(item => item.id !== id));
    }
  };

  const filteredFavorites = favorites.filter(property => 
    property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-12">Loading favorites...</div>;
  }

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Saved Properties</h1>
        <p className="mt-1 text-sm text-gray-600">Your favorite properties</p>
      </div>

      <div className="mb-6 max-w-md">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search saved properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredFavorites.length === 0 ? (
        <div className="text-center py-12">
          <FiHeart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No favorites found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery ? 'Try adjusting your search' : 'Save properties to see them here'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFavorites.map((property) => (
            <div key={property.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="h-48 bg-gray-200 relative">
                <img
                  src={property.image}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemove(property.id)}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md text-red-500 hover:bg-red-50"
                  title="Remove from favorites"
                >
                  <FiHeart className="h-5 w-5 fill-current" />
                </button>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900">{property.title}</h3>
                <p className="mt-1 flex items-center text-sm text-gray-500">
                  <FiMapPin className="mr-1.5 h-4 w-4 flex-shrink-0" />
                  {property.location}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    ETB {property.price.toLocaleString()}/mo
                  </span>
                  <Link
                    to={`/properties/${property.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    View details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
