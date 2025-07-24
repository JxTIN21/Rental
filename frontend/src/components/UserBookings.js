import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ReviewModal from './ReviewModel';

// User Bookings Component
const UserBookings = () => {
  const { API_BASE, token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'cancelled' })
      });

      if (response.ok) {
        fetchBookings();
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const downloadReceipt = async (bookingId) => {
    try {
      const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/receipt`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt_${bookingId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
    }
  };

  const openReviewModal = (booking) => {
    setSelectedBooking(booking);
    setShowReviewModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">My Bookings</h2>
        
        {bookings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No bookings yet. Book your first car!</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {booking.car?.year} {booking.car?.make} {booking.car?.model}
                    </h3>
                    <p className="text-gray-600">Booking #{booking.id.substring(0, 8)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    booking.status === 'active' ? 'bg-blue-100 text-blue-800' :
                    booking.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {booking.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div>
                    <strong>Start:</strong> {new Date(booking.start_date).toLocaleString()}
                  </div>
                  <div>
                    <strong>End:</strong> {new Date(booking.end_date).toLocaleString()}
                  </div>
                  <div>
                    <strong>Total:</strong> ${booking.total_amount}
                  </div>
                  <div>
                    <strong>Host:</strong> {booking.host?.name}
                    {booking.host?.phone && (
                      <span className="ml-2 text-blue-600">📞 {booking.host.phone}</span>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => downloadReceipt(booking.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition duration-200"
                  >
                    Download Receipt
                  </button>
                  
                  {booking.status === 'completed' && (
                    <button
                      onClick={() => openReviewModal(booking)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition duration-200"
                    >
                      Leave Review
                    </button>
                  )}
                  
                  {['confirmed', 'pending'].includes(booking.status) && (
                    <button
                      onClick={() => cancelBooking(booking.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition duration-200"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedBooking && (
        <ReviewModal
          booking={selectedBooking}
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedBooking(null);
          }}
          onReviewSubmitted={fetchBookings}
        />
      )}
    </>
  );
};

export default UserBookings;