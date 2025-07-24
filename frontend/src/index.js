import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // or your main CSS file
import App from './App';
import { AuthProvider } from './contexts/AuthContext'; // Add this import

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);