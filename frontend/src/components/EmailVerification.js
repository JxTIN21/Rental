import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Adjust path as needed

// Email Verification Component
const EmailVerification = () => {
  const { verifyEmail } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('verify');
    
    if (token) {
      handleVerification(token);
    } else {
      setVerifying(false);
      setResult({ success: false, error: 'No verification token found' });
    }
  }, []);

  const handleVerification = async (token) => {
    const result = await verifyEmail(token);
    setResult(result);
    setVerifying(false);
    
    if (result.success) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Verifying Email...</h2>
          <p className="text-gray-600">Please wait while we verify your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
        {result?.success ? (
          <div>
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Email Verified!</h2>
            <p className="text-gray-600 mb-6">{result.message}</p>
            <p className="text-sm text-gray-500">You will be redirected to the dashboard shortly...</p>
          </div>
        ) : (
          <div>
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Verification Failed</h2>
            <p className="text-red-600 mb-6">{result?.error || 'Something went wrong'}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition duration-200"
            >
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;