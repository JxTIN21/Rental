import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RegistrationSuccess from './ResgistrationSuccess';
import { FaTelegramPlane, FaCheckCircle, FaUserPlus, FaTimes } from "react-icons/fa";

const AuthForms = () => {
  const { login, register, resendVerification } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'user',
    phone: ''
  });

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Toast states
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState(''); // 'email_sent', 'login_success', 'registration_success'

  // API base URL - change this to match your FastAPI server
  const API_BASE_URL = 'http://localhost:8000';

  const showToastNotification = (type) => {
    setToastType(type);
    setShowToast(true);
    // Auto-hide toast after 5 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 5000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleForgotPasswordChange = (e) => {
    setForgotPasswordData({
      ...forgotPasswordData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let result;
    if (isLogin) {
      result = await login(formData.email, formData.password);
      if (result.success) {
        showToastNotification('login_success');
      } else {
        setError(result.error);
      }
    } else {
      result = await register(formData);
      if (result.success) {
        setRegisteredEmail(formData.email);
        showToastNotification('registration_success');
        // Show success component after a short delay to let user see the toast
        setTimeout(() => {
          setShowSuccess(true);
        }, 2000);
      } else {
        setError(result.error);
      }
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordData.email })
      });

      const data = await response.json();

      if (response.ok) {
        setShowResetPassword(true);
        setError('');
        showToastNotification('email_sent');
      } else {
        setError(data.detail || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Forgot password error:', err);
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (forgotPasswordData.newPassword !== forgotPasswordData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotPasswordData.email,
          otp: forgotPasswordData.otp,
          new_password: forgotPasswordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowForgotPassword(false);
        setShowResetPassword(false);
        setError('');
        setForgotPasswordData({
          email: '',
          otp: '',
          newPassword: '',
          confirmPassword: ''
        });
        alert('Password reset successfully! Please login with your new password.');
      } else {
        setError(data.detail || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Reset password error:', err);
    }
    setLoading(false);
  };

  const handleResendVerification = async (email) => {
    const result = await resendVerification(email);
    if (result.success) {
      showToastNotification('email_sent');
    }
  };

  // Custom Toast Component
  const ToastNotification = () => {
    if (!showToast) return null;

    const getToastContent = () => {
      switch (toastType) {
        case 'email_sent':
          return {
            icon: <FaTelegramPlane className="h-5 w-5 text-cyan-600" />,
            message: 'Verification email sent successfully.',
            bgColor: 'bg-cyan-50',
            borderColor: 'border-cyan-200',
            textColor: 'text-cyan-800'
          };
        case 'login_success':
          return {
            icon: <FaCheckCircle className="h-5 w-5 text-green-600" />,
            message: 'Login successful! Welcome back.',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            textColor: 'text-green-800'
          };
        case 'registration_success':
          return {
            icon: <FaUserPlus className="h-5 w-5 text-blue-600" />,
            message: 'Account created successfully! Please check your email.',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            textColor: 'text-blue-800'
          };
        default:
          return {
            icon: <FaCheckCircle className="h-5 w-5 text-green-600" />,
            message: 'Operation completed successfully.',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            textColor: 'text-green-800'
          };
      }
    };

    const { icon, message, bgColor, borderColor, textColor } = getToastContent();

    return (
      <div className="fixed top-4 right-4 z-50 transition-all duration-300 ease-in-out transform translate-x-0 opacity-100">
        <div className={`flex items-center w-full max-w-xs p-4 mb-4 ${textColor} ${bgColor} rounded-lg shadow border ${borderColor}`}>
          <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg">
            {icon}
          </div>
          <div className="ml-3 text-sm font-normal">{message}</div>
          <button
            type="button"
            className={`ml-auto -mx-1.5 -my-1.5 ${textColor} hover:${textColor} rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8`}
            onClick={() => setShowToast(false)}
          >
            <FaTimes className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  if (showSuccess) {
    return (
      <>
        <ToastNotification />
        <RegistrationSuccess 
          email={registeredEmail} 
          onResendVerification={handleResendVerification}
        />
      </>
    );
  }

  if (showForgotPassword) {
    return (
      <>
        <ToastNotification />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                {showResetPassword ? 'Reset Your Password' : 'Forgot Password'}
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setShowResetPassword(false);
                    setError('');
                    setForgotPasswordData({
                      email: '',
                      otp: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  ← Back to login
                </button>
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={showResetPassword ? handleResetPassword : handleForgotPassword}>
              <div className="rounded-md shadow-sm space-y-4">
                {!showResetPassword ? (
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={forgotPasswordData.email}
                      onChange={handleForgotPasswordChange}
                      className="mt-1 appearance-none rounded-lg w-full px-3 py-2 border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your email address"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label htmlFor="otp" className="block text-sm font-medium text-gray-700">6-Digit OTP</label>
                      <input
                        id="otp"
                        name="otp"
                        type="text"
                        required
                        maxLength={6}
                        pattern="[0-9]{6}"
                        value={forgotPasswordData.otp}
                        onChange={handleForgotPasswordChange}
                        className="mt-1 appearance-none rounded-lg w-full px-3 py-2 border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter OTP sent to your email"
                      />
                    </div>

                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
                      <input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        required
                        minLength={6}
                        value={forgotPasswordData.newPassword}
                        onChange={handleForgotPasswordChange}
                        className="mt-1 appearance-none rounded-lg w-full px-3 py-2 border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter new password"
                      />
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        minLength={6}
                        value={forgotPasswordData.confirmPassword}
                        onChange={handleForgotPasswordChange}
                        className="mt-1 appearance-none rounded-lg w-full px-3 py-2 border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : (showResetPassword ? 'Reset Password' : 'Send OTP')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ToastNotification />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {isLogin ? 'Sign in to your account' : 'Create your account'}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              {!isLogin && (
                <>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">Account Type</label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="user">👤 User (Rent Cars)</option>
                      <option value="host">🏠 Host (Rent Out Cars)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone (Optional)</label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Phone number"
                    />
                  </div>
                </>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Email address"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Password"
                />
              </div>

              {isLogin && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Processing...' : (isLogin ? 'Sign in' : 'Create Account')}
              </button>
            </div>

            {!isLogin && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  📧 <strong>Email verification required:</strong> After registration, 
                  we'll send you a verification email. Please check your inbox and click 
                  the verification link to activate your account.
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
};

export default AuthForms;