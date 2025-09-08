import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Plus, 
  FileText, 
  Settings,
  BarChart3,
  Users,
  ClipboardList
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand - Only show for non-logged in users */}
          {!user ? (
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-ethiopian-green to-ethiopian-yellow rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">EB</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Ethiopian Broker</span>
              </Link>
            </div>
          ) : (
            <div />
          )}
          
          {/* Navigation Items - Aligned to right */}
          {user && (
            <div className="flex items-center space-x-6">
              <Link 
                to="/dashboard" 
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-ethiopian-green transition-colors flex items-center"
              >
                <User className="h-5 w-5 mr-2" />
                User Dashboard
              </Link>
              
              {user.role === 'admin' && (
                <Link 
                  to="/admin" 
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-ethiopian-green transition-colors flex items-center"
                >
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Admin Dashboard
                </Link>
              )}
              
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 transition-colors flex items-center"
              >
                <LogOut className="h-5 w-5 mr-1" />
                Logout
              </button>
            </div>
          )}

          {/* Desktop Navigation - Only show for non-logged in users */}
          {!user && (
            <div className="hidden md:flex items-center space-x-4 ml-auto">
              <Link to="/" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-ethiopian-green transition-colors">
                Home
              </Link>
              <Link to="/login" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-ethiopian-green transition-colors">
                Login
              </Link>
              <Link 
                to="/register" 
                className="ml-4 px-4 py-2 bg-ethiopian-green text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center ml-auto">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-ethiopian-green hover:bg-gray-100 focus:outline-none"
              aria-expanded="false"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {/* Home Link - Only show for non-logged in users */}
            {!user && (
              <Link
                to="/"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-ethiopian-green hover:bg-gray-100"
                onClick={closeMenu}
              >
                Home
              </Link>
            )}
            <Link
              to="/properties"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-ethiopian-green hover:bg-gray-100"
              onClick={closeMenu}
            >
              Properties
            </Link>
            
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-ethiopian-green hover:bg-gray-100 flex items-center"
                  onClick={closeMenu}
                >
                  <User className="h-5 w-5 mr-2" />
                  User Dashboard
                </Link>
                
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-ethiopian-green hover:bg-gray-100 flex items-center"
                    onClick={closeMenu}
                  >
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Admin Dashboard
                  </Link>
                )}
                
                <button
                  onClick={() => {
                    closeMenu();
                    handleLogout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-ethiopian-green hover:bg-gray-100"
                  onClick={closeMenu}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-white bg-ethiopian-green hover:bg-green-700"
                  onClick={closeMenu}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;