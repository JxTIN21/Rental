import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChevronDown, User, LogOut, Car } from 'lucide-react';

const Header = ({ onScrollToCars }) => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Car className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-blue-600">Rental</h1>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            <button
              onClick={onScrollToCars}
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              Browse Cars
            </button>
            
            {user ? (
              <div className="flex items-center space-x-4">
                {/* User Welcome */}
                <div className="flex items-center space-x-3">
                  <span className="text-gray-700 font-medium">Welcome, {user.name}</span>
                  
                  {/* Role Badge */}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.role === 'host' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role === 'host' ? '🏠 Host' : '👤 User'}
                  </span>
                  
                  {/* Verified Badge */}
                  {user.is_verified && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      ✅ Verified
                    </span>
                  )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded-full transition-colors duration-200"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
                      {user.profile_image || user.profile_picture ? (
                        <img
                          src={user.profile_image || user.profile_picture}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        <div className="px-4 py-3 border-b border-gray-200">
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500 capitalize">{user.role}</div>
                        </div>
                        <button
                          onClick={() => {
                            logout();
                            setIsDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors duration-200"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-gray-700">
                Welcome to Rental
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;