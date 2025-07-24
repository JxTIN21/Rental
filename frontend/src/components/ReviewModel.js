import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const ReviewModal = ({ booking, isOpen, onClose, onReviewSubmitted }) => {
  const { API_BASE, token } = useAuth();
  const [existingReview, setExistingReview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 0,
    comment: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetchingReview, setFetchingReview] = useState(false);

  useEffect(() => {
    if (isOpen && booking) {
      fetchExistingReview();
    }
  }, [isOpen, booking]);

  const fetchExistingReview = async () => {
    setFetchingReview(true);
    try {
      const response = await fetch(`${API_BASE}/api/reviews/booking/${booking.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const review = await response.json();
        if (review) {
          setExistingReview(review);
          setReviewData({
            rating: review.rating,
            comment: review.comment
          });
        } else {
          setExistingReview(null);
          setReviewData({ rating: 0, comment: '' });
        }
      }
    } catch (error) {
      console.error('Error fetching existing review:', error);
      setExistingReview(null);
    } finally {
      setFetchingReview(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = existingReview 
        ? `${API_BASE}/api/reviews/${existingReview.id}` 
        : `${API_BASE}/api/reviews`;
      
      const method = existingReview ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          car_id: booking.car_id,
          booking_id: booking.id,
          rating: reviewData.rating,
          comment: reviewData.comment
        })
      });

      if (response.ok) {
        onReviewSubmitted();
        onClose();
        setReviewData({ rating: 0, comment: '' });
        setExistingReview(null);
        setIsEditing(false);
      } else {
        console.error('Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingClick = (rating) => {
    setReviewData(prev => ({
      ...prev,
      rating: rating
    }));
  };

  const handleClose = () => {
    onClose();
    setReviewData({ rating: 0, comment: '' });
    setExistingReview(null);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset to original review data
    if (existingReview) {
      setReviewData({
        rating: existingReview.rating,
        comment: existingReview.comment
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {existingReview && !isEditing ? 'Your Review' : 
             existingReview && isEditing ? 'Edit Review' : 'Leave a Review'}
          </h2>
          <button 
            onClick={handleClose} 
            className="text-gray-500 hover:text-gray-700 text-xl"
            type="button"
          >
            ✕
          </button>
        </div>

        {fetchingReview ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Car Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Car:</strong> {booking.car?.year} {booking.car?.make} {booking.car?.model}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Booking:</strong> #{booking.id.substring(0, 8)}
              </p>
            </div>

            {/* Existing Review Display */}
            {existingReview && !isEditing && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="text-sm text-gray-600 mr-2">Your rating:</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className="text-lg">
                        {star <= existingReview.rating ? '⭐' : '☆'}
                      </span>
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">
                    ({existingReview.rating}/5)
                  </span>
                </div>
                <p className="text-gray-700 mb-3">{existingReview.comment}</p>
                <div className="flex space-x-2">
                  <button
                    onClick={handleEditClick}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition duration-200"
                  >
                    Edit Review
                  </button>
                  <button
                    onClick={handleClose}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm transition duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Review Form */}
            {(!existingReview || isEditing) && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating {reviewData.rating > 0 && `(${reviewData.rating} star${reviewData.rating !== 1 ? 's' : ''})`}
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingClick(star)}
                        className={`text-2xl transition-colors hover:scale-110 transform ${
                          star <= reviewData.rating 
                            ? 'text-yellow-400 hover:text-yellow-500' 
                            : 'text-gray-300 hover:text-yellow-200'
                        }`}
                      >
                        {star <= reviewData.rating ? '⭐' : '☆'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comment
                  </label>
                  <textarea
                    value={reviewData.comment}
                    onChange={(e) => setReviewData(prev => ({
                      ...prev, 
                      comment: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="4"
                    placeholder="Share your experience..."
                    required
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading || reviewData.rating === 0}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition duration-200"
                  >
                    {loading ? 'Submitting...' : (existingReview ? 'Update Review' : 'Submit Review')}
                  </button>
                  <button
                    type="button"
                    onClick={existingReview ? handleCancelEdit : handleClose}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewModal;