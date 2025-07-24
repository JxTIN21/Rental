import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Adjust path as needed
import FileUpload from './FileUpload'; // Adjust path as needed

// Profile Component
const Profile = () => {
  const { user, API_BASE, token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    date_of_birth: user?.date_of_birth || '',
    bio: user?.bio || '',
    profile_image: user?.profile_image || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        setMessage('Profile updated successfully!');
        setIsEditing(false);
      } else {
        setMessage('Failed to update profile');
      }
    } catch (error) {
      setMessage('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (base64) => {
    setProfileData({...profileData, profile_image: base64});
  };

  const handleEdit = () => {
    setIsEditing(true);
    setMessage('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setProfileData({
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      date_of_birth: user?.date_of_birth || '',
      bio: user?.bio || '',
      profile_image: user?.profile_image || ''
    });
    setMessage('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-200"
          >
            Edit Profile
          </button>
        )}
      </div>
      
      {isEditing ? (
        // Edit Mode
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32">
              <FileUpload
                onFileSelect={handleImageUpload}
                accept="image/*"
                placeholder="Profile Photo"
                className="w-full h-full rounded-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={profileData.date_of_birth}
                onChange={(e) => setProfileData({...profileData, date_of_birth: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={profileData.address}
                onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition duration-200"
            >
              {loading ? 'Updating...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        // View Mode
        <div className="space-y-6">
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32">
              {profileData.profile_image ? (
                <img
                  src={profileData.profile_image}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-200">
                  <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
              <p className="text-gray-800 font-medium">{profileData.name || 'Not provided'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
              <p className="text-gray-800">{profileData.phone || 'Not provided'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
              <p className="text-gray-800">{formatDate(profileData.date_of_birth)}</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
              <p className="text-gray-800">{profileData.address || 'Not provided'}</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">Bio</label>
              <p className="text-gray-800 leading-relaxed">{profileData.bio || 'No bio provided'}</p>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`text-sm p-3 rounded mt-4 ${message.includes('successfully') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default Profile;