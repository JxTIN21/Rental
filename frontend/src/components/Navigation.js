import React from 'react';

const Navigation = ({ activeTab, onTabChange, userRole }) => {
  const tabs = userRole === 'host' 
    ? [
        { id: 'dashboard', label: '🏠 Host Dashboard', role: 'host' },
        { id: 'profile', label: '👤 Profile', role: 'both' }
      ]
    : [
        { id: 'cars', label: '🚗 Browse Cars', role: 'both' },
        { id: 'bookings', label: '📅 My Bookings', role: 'user' },
        { id: 'profile', label: '👤 Profile', role: 'both' }
      ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition duration-200 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;