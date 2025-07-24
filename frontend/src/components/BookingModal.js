import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import FileUpload from './FileUpload';

const BookingModal = ({ car, isOpen, onClose }) => {
  const { API_BASE, token, user } = useAuth();
  const [bookingData, setBookingData] = useState({
    start_date: '',
    end_date: '',
    additional_notes: '',
    driver_license: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bookingData.driver_license) {
      setError('Please upload your driver license');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const startDate = new Date(bookingData.start_date);
      const endDate = new Date(bookingData.end_date);
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      const totalAmount = days * car.price_per_day;

      const response = await fetch(`${API_BASE}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          car_id: car.id,
          start_date: new Date(bookingData.start_date).toISOString(),
          end_date: new Date(bookingData.end_date).toISOString(),
          total_amount: totalAmount,
          driver_license: bookingData.driver_license,
          additional_notes: bookingData.additional_notes
        })
      });

      if (response.ok) {
        alert('Booking confirmed! You will receive a confirmation email shortly.');
        onClose();
        setBookingData({
          start_date: '',
          end_date: '',
          additional_notes: '',
          driver_license: ''
        });
      } else {
        const error = await response.json();
        setError(error.detail);
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLicenseUpload = (base64) => {
    setBookingData({...bookingData, driver_license: base64});
  };

  if (!isOpen) return null;

  const startDate = bookingData.start_date ? new Date(bookingData.start_date) : null;
  const endDate = bookingData.end_date ? new Date(bookingData.end_date) : null;
  const days = startDate && endDate ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1 : 0;
  const totalAmount = days * car.price_per_day;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Book {car.year} {car.make} {car.model}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="datetime-local"
              value={bookingData.start_date}
              onChange={(e) => setBookingData({...bookingData, start_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="datetime-local"
              value={bookingData.end_date}
              onChange={(e) => setBookingData({...bookingData, end_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Driver License</label>
            <FileUpload
              onFileSelect={handleLicenseUpload}
              accept="image/*"
              placeholder="Upload your driver license"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your license will only be visible to the host and will be deleted after the booking ends.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (Optional)</label>
            <textarea
              value={bookingData.additional_notes}
              onChange={(e) => setBookingData({...bookingData, additional_notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Any special requests or notes..."
            />
          </div>

          {days > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Duration:</strong> {days} day(s)<br />
                <strong>Daily Rate:</strong> ${car.price_per_day}<br />
                <strong>Total Amount:</strong> ${totalAmount}
              </p>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading || !bookingData.driver_license}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition duration-200"
            >
              {loading ? 'Booking...' : `Book for $${totalAmount}`}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;