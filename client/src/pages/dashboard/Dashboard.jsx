import React, { useState, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiHome, 
  FiUser, 
  FiPlusSquare, 
  FiList, 
  FiMessageSquare, 
  FiHeart, 
  FiSettings,
  FiLogOut,
  FiShield,
  FiGrid,
  FiUsers,
  FiBarChart2,
  FiFileText
} from 'react-icons/fi';

const Dashboard = ({ isAdmin = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Define menu items based on user role
  const menuItems = [
    { icon: FiHome, label: 'Overview', path: isAdmin ? '/admin' : '/dashboard' },
    ...(isAdmin ? [] : [
      { icon: FiMessageSquare, label: 'Messages', path: '/dashboard/messages' },
      { icon: FiHeart, label: 'My Interests', path: '/dashboard/interests' },
      { icon: FiSettings, label: 'Settings', path: '/dashboard/settings' },
    ]),
    ...(isAdmin ? [
      { icon: FiUsers, label: 'User Management', path: '/admin/users' },
      { icon: FiList, label: 'Property Management', path: '/admin/properties' },
      { icon: FiMessageSquare, label: 'Messages', path: '/admin/messages' },
      { icon: FiBarChart2, label: 'Analytics', path: '/admin/analytics' }
    ] : [])
  ];

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleAdminView = () => {
    if (isAdmin) {
      navigate('/dashboard');
    } else {
      navigate('/admin');
    }
    setIsUserMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path || 
           (path !== '/' && location.pathname.startsWith(path + '/'));
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block md:flex-shrink-0`}>
        <div className={`flex flex-col w-64 ${isAdmin ? 'bg-gray-800 text-white' : 'bg-white border-r border-gray-200'}`}>
          <div className={`flex items-center justify-center h-16 px-4 ${isAdmin ? 'bg-gray-900' : 'bg-ethiopian-green'}`}>
            <h1 className={`font-bold text-xl ${isAdmin ? 'text-white' : 'text-white'}`}>
              {isAdmin ? 'Admin Panel' : 'Dashboard'}
            </h1>
          </div>
          
          {/* Navigation */}
          <div className="flex flex-col flex-grow px-4 py-4 overflow-y-auto">
            <nav className="flex-1 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                    isActive(item.path)
                      ? isAdmin 
                        ? 'bg-gray-900 text-white' 
                        : 'bg-gray-100 text-gray-900'
                      : isAdmin
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* User Menu */}
          <div className="p-4 border-t border-gray-700">
            <div className="relative">
              <button
                onClick={toggleUserMenu}
                className="flex items-center w-full p-2 text-left rounded-md hover:bg-gray-700"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-ethiopian-green text-white flex items-center justify-center">
                  {user?.firstName?.[0] || 'A'}
                </div>
                <div className="ml-3 overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-300 truncate">
                    {isAdmin ? 'Admin' : 'User'}
                  </p>
                </div>
              </button>
              
              {isUserMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 w-full bg-white rounded-md shadow-lg overflow-hidden z-10">
                  {user?.role === 'admin' && (
                    <button
                      onClick={toggleAdminView}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiShield className="mr-2" />
                      {isAdmin ? 'Switch to User View' : 'Switch to Admin View'}
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <FiLogOut className="mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile header */}
        <header className="bg-white shadow-sm md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-500 rounded-md hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-medium text-gray-900">
              {isAdmin ? 'Admin Panel' : 'Dashboard'}
            </h1>
            <div className="w-6" />
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
