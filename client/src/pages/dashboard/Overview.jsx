import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiHome, 
  FiFileText, 
  FiSettings, 
  FiInfo, 
  FiHeart,
  FiClock,
  FiMessageSquare,
  FiEye,
  FiStar,
  FiList,
  FiRefreshCw
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import api from '../../services/api';

// Reusable QuickAction component
const QuickAction = ({ title, description, icon: Icon, path, onClick, color }) => {
  const className = `flex items-start p-5 space-x-4 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 ${
    onClick ? 'cursor-pointer' : ''
  }`;
  
  const content = (
    <>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h4 className="font-medium text-gray-900">{title}</h4>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
    </>
  );

  return path ? (
    <Link to={path} className={className}>
      {content}
    </Link>
  ) : (
    <button onClick={onClick} className={`w-full text-left ${className}`}>
      {content}
    </button>
  );
};

// Reusable InterestCard component
const InterestCard = ({ interest, onRefresh }) => {
  return (
    <div className="overflow-hidden bg-white rounded-lg shadow">
      {interest.property?.images?.[0] && (
        <div className="h-48 overflow-hidden">
          <img 
            src={interest.property.images[0]} 
            alt={interest.property.title}
            className="object-cover w-full h-full"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <h4 className="text-lg font-medium text-gray-900 line-clamp-1">
            {interest.property?.title || 'Property'}
          </h4>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            interest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            interest.status === 'approved' ? 'bg-green-100 text-green-800' :
            interest.status === 'rejected' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {interest.status || 'Pending'}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
          {interest.message || 'No additional message provided'}
        </p>
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>Submitted {formatDistanceToNow(new Date(interest.createdAt))} ago</span>
          <Link 
            to={`/properties/${interest.property?._id}`}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            View Property
          </Link>
        </div>
      </div>
    </div>
  );
};

// Reusable ActivityItem component
const ActivityItem = ({ activity }) => {
  const getActivityIcon = () => {
    switch (activity.type) {
      case 'message': return <FiMessageSquare className="text-blue-500" />;
      case 'view': return <FiEye className="text-green-500" />;
      case 'favorite': return <FiStar className="text-yellow-500" />;
      case 'interest': return <FiHeart className="text-pink-500" />;
      default: return <FiInfo className="text-gray-500" />;
    }
  };

  return (
    <li className="px-6 py-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {getActivityIcon()}
        </div>
        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">
              {activity.message}
            </p>
            <div className="text-sm text-gray-500">
              <FiClock className="inline mr-1" />
              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
            </div>
          </div>
          {activity.metadata?.details && (
            <div className="mt-1 text-sm text-gray-500">
              {activity.metadata.details}
            </div>
          )}
        </div>
      </div>
    </li>
  );
};

const Overview = () => {
  const [recentActivity, setRecentActivity] = useState([]);
  const [userListings, setUserListings] = useState([]);
  const [loading, setLoading] = useState({ activities: true, listings: true });

  const fetchData = async () => {
    try {
      setLoading(prev => ({ ...prev, activities: true, listings: true }));
      
      // Fetch recent activities
      const activitiesResponse = await api.users.getActivities();
      setRecentActivity(activitiesResponse.data || []);
      setLoading(prev => ({ ...prev, activities: false }));

      // Fetch user's listings
      const listingsResponse = await api.get('/properties/my-listings');
      setUserListings(listingsResponse.data?.data || []);
      setLoading(prev => ({ ...prev, listings: false }));

    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading({ activities: false, listings: false });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const quickActions = [
    {
      title: 'Messages',
      description: 'Chat with property owners and buyers',
      icon: FiMessageSquare,
      path: '/dashboard/messages',
      color: 'bg-blue-50 text-blue-600'
    },
    { 
      title: 'My Interests', 
      description: 'See and manage your interests',
      icon: FiHeart,
      path: '/dashboard/interests',
      color: 'bg-pink-50 text-pink-600'
    },
    { 
      title: 'Account Settings', 
      description: 'Profile, security and preferences',
      icon: FiSettings,
      path: '/dashboard/settings',
      color: 'bg-purple-50 text-purple-600'
    }
  ];

  const renderEmptyState = (icon, title, description, showButton = true) => (
    <div className="p-8 text-center bg-white rounded-lg shadow">
      {icon}
      <h3 className="mt-2 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-gray-500">{description}</p>
      {showButton && (
        <div className="mt-6">
          <Link
            to="/properties"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Browse Properties
          </Link>
        </div>
      )}
    </div>
  );

  const renderLoadingState = (message) => (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="ml-2 text-gray-600">{message}</span>
    </div>
  );

  const renderRecentActivities = () => (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <ul className="divide-y divide-gray-200">
        {loading.activities ? (
          <li>{renderLoadingState('Loading activities...')}</li>
        ) : recentActivity.length > 0 ? (
          recentActivity.map(activity => (
            <ActivityItem key={activity._id} activity={activity} />
          ))
        ) : (
          <li>{renderEmptyState(
            <FiInfo className="w-12 h-12 mx-auto text-gray-400" />,
            'No recent activities',
            'Your recent activities will appear here',
            false
          )}</li>
        )}
      </ul>
    </div>
  );

  const renderMainContent = () => {
    return (
      <div className="space-y-8">
        {/* Recent Activities Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activities</h3>
          {loading.activities ? (
            renderLoadingState('Loading activities...')
          ) : recentActivity.length > 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <ul className="divide-y divide-gray-200">
                {recentActivity.map(activity => (
                  <ActivityItem key={activity._id} activity={activity} />
                ))}
              </ul>
            </div>
          ) : (
            renderEmptyState(
              <FiInfo className="w-12 h-12 mx-auto text-gray-400" />,
              'No recent activities',
              'Your recent activities will appear here',
              false
            )
          )}
        </div>

        {/* Removed 'My Listings' section per request */}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Dashboard Overview
        </h2>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-6 mt-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <QuickAction key={index} {...action} />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-8">
        {renderMainContent()}
      </div>
    </div>
  );
};

export default Overview;
