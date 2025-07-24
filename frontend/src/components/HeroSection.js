import React from 'react';

const HeroSection = ({ onBrowseCars, onBecomeHost }) => {
  return (
    <div className="relative bg-gradient-to-r from-blue-800 to-indigo-900 overflow-hidden">
      <div className="absolute inset-0">
        <img
          className="w-full h-full object-cover opacity-30"
          src="https://images.unsplash.com/photo-1601929862217-f1bf94503333?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXJzfGVufDB8fHxibHVlfDE3NTIzOTQwNDV8MA&ixlib=rb-4.1.0&q=85"
          alt="Luxury car"
        />
      </div>
      <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Rent Cars from
          <span className="block text-blue-300">Local Hosts</span>
        </h1>
        <p className="mt-6 max-w-3xl text-xl text-blue-100">
          Discover unique cars in your neighborhood. From daily drivers to luxury vehicles, 
          find the perfect car for any occasion. Join our community of hosts and renters.
        </p>
        <div className="mt-10 flex space-x-4">
          <button 
            onClick={onBrowseCars}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium transition duration-200"
          >
            Browse Cars
          </button>
          <button 
            onClick={onBecomeHost}
            className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-800 px-8 py-3 rounded-lg text-lg font-medium transition duration-200"
          >
            Become a Host
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;