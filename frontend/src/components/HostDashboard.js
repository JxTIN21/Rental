import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";

// Host Dashboard Component
const HostDashboard = () => {
  const { user, API_BASE, token } = useAuth();
  const [showAddCar, setShowAddCar] = useState(false);
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false); // Add loading state
  const [carForm, setCarForm] = useState({
    make: "",
    model: "",
    year: "",
    color: "",
    price_per_day: "",
    description: "",
    image_url: "",
    location: "",
    features: "",
  });
  const [editingCar, setEditingCar] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user?.role === "host") {
      fetchMyCars();
      fetchMyBookings();
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchMyCars = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/my-cars`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCars(data);
      }
    } catch (error) {
      console.error("Error fetching cars:", error);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/bookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const handleAddCar = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${API_BASE}/api/cars`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...carForm,
          year: parseInt(carForm.year),
          price_per_day: parseFloat(carForm.price_per_day),
          features: carForm.features
            .split(",")
            .map((f) => f.trim())
            .filter((f) => f),
        }),
      });

      if (response.ok) {
        setShowAddCar(false);
        setCarForm({
          make: "",
          model: "",
          year: "",
          color: "",
          price_per_day: "",
          description: "",
          image_url: "",
          location: "",
          features: "",
        });
        await fetchMyCars(); // Wait for fetch to complete
        alert("Car added successfully!");
      } else {
        const errorData = await response.json();
        alert(`Failed to add car: ${errorData.message || 'Please try again'}`);
      }
    } catch (error) {
      console.error("Error adding car:", error);
      alert("Error adding car. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/bookings/${bookingId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (response.ok) {
        fetchMyBookings();
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
    }
  };

  const viewLicense = (license) => {
    const newWindow = window.open();
    newWindow.document.write(`
      <html>
        <head><title>Driver License</title></head>
        <body style="margin:0;padding:20px;background:#f5f5f5;">
          <div style="text-align:center;">
            <h3>Driver License (View Only)</h3>
            <img src="${license}" style="max-width:100%;height:auto;border:1px solid #ddd;border-radius:8px;" />
            <p style="color:#666;font-size:14px;">This license is only visible to you as the host.</p>
          </div>
        </body>
      </html>
    `);
  };

  const handleEditCar = (car) => {
    setEditingCar(car.id);
    setEditForm({
      make: car.make,
      model: car.model,
      year: car.year.toString(),
      color: car.color,
      price_per_day: car.price_per_day.toString(),
      description: car.description,
      image_url: car.image_url,
      location: car.location,
      features: car.features.join(", "),
    });
    setActiveDropdown(null);
  };

  const handleUpdateCar = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${API_BASE}/api/cars/${editingCar}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...editForm,
          year: parseInt(editForm.year),
          price_per_day: parseFloat(editForm.price_per_day),
          features: editForm.features
            .split(",")
            .map((f) => f.trim())
            .filter((f) => f),
        }),
      });

      if (response.ok) {
        setEditingCar(null);
        setEditForm({});
        await fetchMyCars();
        alert("Car updated successfully!");
      } else {
        const errorData = await response.json();
        alert(`Failed to update car: ${errorData.message || 'Please try again'}`);
      }
    } catch (error) {
      console.error("Error updating car:", error);
      alert("Error updating car. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCar = async (carId) => {
    if (!window.confirm("Are you sure you want to delete this car?")) {
      setActiveDropdown(null);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${API_BASE}/api/cars/${carId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchMyCars();
        alert("Car deleted successfully!");
      } else {
        const errorData = await response.json();
        alert(`Failed to delete car: ${errorData.message || 'Please try again'}`);
      }
    } catch (error) {
      console.error("Error deleting car:", error);
      alert("Error deleting car. Please try again.");
    } finally {
      setIsSubmitting(false);
      setActiveDropdown(null);
    }
  };

  const toggleDropdown = (carId) => {
    setActiveDropdown(activeDropdown === carId ? null : carId);
  };

  const handleDropdownAction = (action, car) => {
    // Prevent event bubbling
    if (action === 'edit') {
      handleEditCar(car);
    } else if (action === 'delete') {
      handleDeleteCar(car.id);
    }
  };

  if (user?.role !== "host") {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-800">Access Denied</h3>
        <p className="text-gray-600">Only hosts can access this dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Host Dashboard</h2>
        <button
          onClick={() => setShowAddCar(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition duration-200"
          disabled={isSubmitting}
        >
          Add New Car
        </button>
      </div>

      {/* Add Car Form */}
      {showAddCar && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Add New Car</h3>
          <form onSubmit={handleAddCar} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Make"
                value={carForm.make}
                onChange={(e) =>
                  setCarForm({ ...carForm, make: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              />
              <input
                type="text"
                placeholder="Model"
                value={carForm.model}
                onChange={(e) =>
                  setCarForm({ ...carForm, model: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              />
              <input
                type="number"
                placeholder="Year"
                value={carForm.year}
                onChange={(e) =>
                  setCarForm({ ...carForm, year: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              />
              <input
                type="text"
                placeholder="Color"
                value={carForm.color}
                onChange={(e) =>
                  setCarForm({ ...carForm, color: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price per day"
                value={carForm.price_per_day}
                onChange={(e) =>
                  setCarForm({ ...carForm, price_per_day: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              />
              <input
                type="text"
                placeholder="Location"
                value={carForm.location}
                onChange={(e) =>
                  setCarForm({ ...carForm, location: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>
            <input
              type="url"
              placeholder="Image URL"
              value={carForm.image_url}
              onChange={(e) =>
                setCarForm({ ...carForm, image_url: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isSubmitting}
            />
            <textarea
              placeholder="Description"
              value={carForm.description}
              onChange={(e) =>
                setCarForm({ ...carForm, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              required
              disabled={isSubmitting}
            ></textarea>
            <input
              type="text"
              placeholder="Features (comma separated)"
              value={carForm.features}
              onChange={(e) =>
                setCarForm({ ...carForm, features: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add Car"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddCar(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition duration-200"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* My Cars */}
      <div>
        <h3 className="text-xl font-semibold mb-4">My Cars ({cars.length})</h3>
        <div className="space-y-6">
          {cars.map((car) => (
            <div key={car.id}>
              {editingCar === car.id ? (
                // Edit form
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <h3 className="text-xl font-semibold mb-4">Edit Car</h3>
                  <form onSubmit={handleUpdateCar} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Make"
                        value={editForm.make}
                        onChange={(e) =>
                          setEditForm({ ...editForm, make: e.target.value })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={isSubmitting}
                      />
                      <input
                        type="text"
                        placeholder="Model"
                        value={editForm.model}
                        onChange={(e) =>
                          setEditForm({ ...editForm, model: e.target.value })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={isSubmitting}
                      />
                      <input
                        type="number"
                        placeholder="Year"
                        value={editForm.year}
                        onChange={(e) =>
                          setEditForm({ ...editForm, year: e.target.value })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={isSubmitting}
                      />
                      <input
                        type="text"
                        placeholder="Color"
                        value={editForm.color}
                        onChange={(e) =>
                          setEditForm({ ...editForm, color: e.target.value })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={isSubmitting}
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price per day"
                        value={editForm.price_per_day}
                        onChange={(e) =>
                          setEditForm({ ...editForm, price_per_day: e.target.value })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={isSubmitting}
                      />
                      <input
                        type="text"
                        placeholder="Location"
                        value={editForm.location}
                        onChange={(e) =>
                          setEditForm({ ...editForm, location: e.target.value })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <input
                      type="url"
                      placeholder="Image URL"
                      value={editForm.image_url}
                      onChange={(e) =>
                        setEditForm({ ...editForm, image_url: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={isSubmitting}
                    />
                    <textarea
                      placeholder="Description"
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({ ...editForm, description: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      required
                      disabled={isSubmitting}
                    ></textarea>
                    <input
                      type="text"
                      placeholder="Features (comma separated)"
                      value={editForm.features}
                      onChange={(e) =>
                        setEditForm({ ...editForm, features: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                    <div className="flex space-x-4">
                      <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Updating..." : "Update Car"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCar(null)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition duration-200"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                // Car display card with dropdown
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="md:flex">
                    <div className="md:w-1/3">
                      <img
                        src={car.image_url}
                        alt={`${car.make} ${car.model}`}
                        className="w-full h-64 md:h-full object-cover"
                      />
                    </div>
                    <div className="md:w-2/3 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-xl font-semibold text-gray-800">
                            {car.year} {car.make} {car.model}
                          </h4>
                          <p className="text-gray-600">{car.color}</p>
                        </div>
                        <div className="relative">
                          <button
                            onClick={() => toggleDropdown(car.id)}
                            className="p-2 hover:bg-gray-100 rounded-full transition duration-200"
                            disabled={isSubmitting}
                          >
                            <svg
                              className="w-5 h-5 text-gray-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                          
                          {activeDropdown === car.id && (
                            <div 
                              ref={dropdownRef}
                              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10"
                            >
                              <button
                                onClick={() => handleDropdownAction('edit', car)}
                                className="w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-700 flex items-center"
                                disabled={isSubmitting}
                              >
                                <svg
                                  className="w-4 h-4 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                                Edit Details
                              </button>
                              <button
                                onClick={() => handleDropdownAction('delete', car)}
                                className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600 flex items-center"
                                disabled={isSubmitting}
                              >
                                <svg
                                  className="w-4 h-4 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                Delete Car
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-gray-700">
                          <span className="font-medium">Location:</span> {car.location}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium">Price:</span> ${car.price_per_day}/day
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium">Description:</span> {car.description}
                        </p>
                      </div>
                      
                      {car.features && car.features.length > 0 && (
                        <div className="mb-4">
                          <p className="font-medium text-gray-700 mb-2">Features:</p>
                          <div className="flex flex-wrap gap-2">
                            {car.features.map((feature, index) => (
                              <span
                                key={index}
                                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* My Bookings */}
      <div>
        <h3 className="text-xl font-semibold mb-4">
          Recent Bookings ({bookings.length})
        </h3>
        <div className="space-y-4">
          {bookings.length > 0 ? (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-lg shadow-lg p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold">
                      {booking.car?.year} {booking.car?.make}{" "}
                      {booking.car?.model}
                    </h4>
                    <p className="text-gray-600">
                      Booking #{booking.id.substring(0, 8)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      booking.status === "confirmed"
                        ? "bg-green-100 text-green-800"
                        : booking.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : booking.status === "active"
                        ? "bg-blue-100 text-blue-800"
                        : booking.status === "completed"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div>
                    <strong>Renter:</strong> {booking.user?.name}
                    {booking.user?.phone && (
                      <span className="ml-2 text-blue-600">
                        📞 {booking.user.phone}
                      </span>
                    )}
                  </div>
                  <div>
                    <strong>Email:</strong> {booking.user?.email}
                  </div>
                  <div>
                    <strong>Start:</strong>{" "}
                    {new Date(booking.start_date).toLocaleString()}
                  </div>
                  <div>
                    <strong>End:</strong>{" "}
                    {new Date(booking.end_date).toLocaleString()}
                  </div>
                  <div>
                    <strong>Total:</strong> ${booking.total_amount}
                  </div>
                  <div>
                    <button
                      onClick={() => viewLicense(booking.driver_license)}
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      View Driver License
                    </button>
                  </div>
                </div>

                {booking.additional_notes && (
                  <div className="mb-4">
                    <strong className="text-sm text-gray-700">Notes:</strong>
                    <p className="text-sm text-gray-600">
                      {booking.additional_notes}
                    </p>
                  </div>
                )}

                <div className="flex space-x-3">
                  {booking.status === "confirmed" && (
                    <button
                      onClick={() => updateBookingStatus(booking.id, "active")}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition duration-200"
                    >
                      Start Rental
                    </button>
                  )}

                  {booking.status === "active" && (
                    <button
                      onClick={() =>
                        updateBookingStatus(booking.id, "completed")
                      }
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition duration-200"
                    >
                      Complete Rental
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">
                No bookings yet. Your cars will appear here once users start
                booking them.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostDashboard;