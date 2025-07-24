import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import './App.css';
import Header from './components/Header';
import { useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import HostDashboard from './components/HostDashboard';
import EmailVerification from './components/EmailVerification';
import AuthForms from './components/AuthForm';
import HeroSection from './components/HeroSection';
import CarGrid from './components/CarGrid';
import Profile from './components/Profile';
import UserBookings from './components/UserBookings';
import Footer from './components/Footer';

// Main Dashboard Component
const Dashboard = () => {
  const { user, changeRole } = useAuth();
  const [activeTab, setActiveTab] = useState(user?.role === 'host' ? 'dashboard' : 'cars');
  const carsRef = useRef(null);

  const scrollToCars = () => {
    if (carsRef.current) {
      carsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBecomeHost = async () => {
    if (user?.role === 'user') {
      if (window.confirm('This will change your account type to Host. You will be able to list cars but cannot book cars as a user. Continue?')) {
        const result = await changeRole('host');
        if (result.success) {
          setActiveTab('dashboard');
        }
      }
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <HostDashboard />;
      case 'cars':
        return (
          <div className="space-y-8">
            <HeroSection onBrowseCars={scrollToCars} onBecomeHost={handleBecomeHost} />
            <div ref={carsRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                  Available Cars
                </h2>
                <p className="mt-4 text-xl text-gray-600">
                  Find the perfect car for your next adventure
                </p>
              </div>
              <CarGrid />
            </div>
          </div>
        );
      case 'bookings':
        return <UserBookings />;
      case 'profile':
        return <Profile />;
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        userRole={user?.role} 
      />
      <div className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const { user, loading } = useAuth();
  const [showVerification, setShowVerification] = useState(false);

  useEffect(() => {
    // Check if URL contains verification token
    const urlParams = new URLSearchParams(window.location.search);
    const verifyToken = urlParams.get('verify');
    if (verifyToken) {
      setShowVerification(true);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Header />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showVerification) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1">
          <EmailVerification />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1">
        {user ? <Dashboard /> : <AuthForms />}
      </div>
      <Footer />
    </div>
  );
};

export default App;