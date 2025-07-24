import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import BookingModal from './BookingModal';

const CarGrid = () => {
  const { API_BASE, user } = useAuth();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/cars`);
      if (response.ok) {
        const data = await response.json();
        setCars(data);
      } else {
        console.error('Failed to fetch cars');
      }
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (car) => {
    if (user?.role !== 'user') {
      alert('Only users can book cars. Please switch to user role.');
      return;
    }
    setSelectedCar(car);
    setShowBookingModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">No Cars Available</h3>
          <p className="text-gray-600 mb-4">
            Be the first to list your car and start earning!
          </p>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition duration-200">
            List Your Car
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cars.map((car) => (
          <div key={car.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition duration-300">
            <img
              src={car.image_url || 'https://images.unsplash.com/photo-1579000476471-e2ffe029fa9a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwyfHxjYXIlMjByZW50YWx8ZW58MHx8fGJsdWV8MTc1MjM5NDAzOXww&ixlib=rb-4.1.0&q=85'}
              alt={`${car.make} ${car.model}`}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {car.year} {car.make} {car.model}
              </h3>
              <p className="text-gray-600 mb-2">{car.location}</p>
              <p className="text-gray-700 text-sm mb-4">{car.description}</p>
              
              {car.average_rating > 0 && (
                <div className="flex items-center mb-4">
                  <span className="text-yellow-400">⭐</span>
                  <span className="text-sm text-gray-600 ml-1">
                    {car.average_rating} ({car.total_reviews} reviews)
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-blue-600">
                  ${car.price_per_day}/day
                </span>
                <button 
                  onClick={() => handleBookNow(car)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-200"
                >
                  Book Now
                </button>
              </div>
              
              {car.reviews && car.reviews.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Reviews:</h4>
                  <div className="space-y-2 max-h-24 overflow-y-auto">
                    {car.reviews.slice(0, 2).map((review) => (
                      <div key={review.id} className="text-xs">
                        <div className="flex items-center">
                          <span className="font-medium">{review.user_name}</span>
                          <span className="ml-2 text-yellow-400">
                            {'⭐'.repeat(review.rating)}
                          </span>
                        </div>
                        <p className="text-gray-600 truncate">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {selectedCar && (
        <BookingModal
          car={selectedCar}
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedCar(null);
          }}
        />
      )}
    </>
  );
};

export default CarGrid;