import React, { useState } from 'react';

const RegistrationSuccess = ({ email, onResendVerification }) => {
  const [resending, setResending] = useState(false);
  const [resendResult, setResendResult] = useState(null);

  const handleResend = async () => {
    setResending(true);
    setResendResult(null);
    const result = await onResendVerification(email);
    setResendResult(result);
    setResending(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="text-blue-500 text-6xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Check Your Email!</h2>
          <p className="text-gray-600 mb-6">
            We've sent a verification email to <strong>{email}</strong>. 
            Please check your inbox and click the verification link to activate your account.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition duration-200"
            >
              {resending ? 'Resending...' : 'Resend Verification Email'}
            </button>
            
            {resendResult && (
              <div className={`text-sm ${resendResult.success ? 'text-green-600' : 'text-red-600'}`}>
                {resendResult.success ? resendResult.message : resendResult.error}
              </div>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition duration-200"
            >
              Back to Login
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> If you don't see the email, please check your spam/junk folder. 
              The verification link will expire in 24 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccess;