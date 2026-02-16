import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaUserMd, FaLock, FaHospital } from 'react-icons/fa';
import Head from 'next/head';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(username, password);
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Login - Begum Sahib Noor Zaman Dispensary</title>
      </Head>
      
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-900 via-primary-700 to-primary-900">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Logo and Title - UPDATED WITH CLINIC LOGO */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 md:w-24 md:h-24 bg-white rounded-full shadow-2xl mb-4 p-3 md:p-4">
              <img 
                src="/cliniclogo.png" 
                alt="Clinic Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback to hospital icon if logo not found
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<svg class="text-primary-600 w-full h-full" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>';
                }}
              />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 font-display">
              Begum Sahib Noor Zaman
            </h1>
            <p className="text-primary-100 text-base md:text-lg">Sahulat Dispensary</p>
            <div className="mt-4 inline-block px-4 py-2 bg-white bg-opacity-20 rounded-full text-white text-xs md:text-sm backdrop-blur-sm">
              Clinic Management System
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-primary-600 to-primary-500 p-6">
              <h2 className="text-2xl font-bold text-white text-center">
                Welcome Back
              </h2>
              <p className="text-primary-100 text-center mt-1">
                Sign in to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Username Field */}
              <div>
                <label className="label">
                  <FaUserMd className="inline mr-2 text-primary-600" />
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                  placeholder="Enter your username"
                  required
                  disabled={loading}
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="label">
                  <FaLock className="inline mr-2 text-primary-600" />
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="spinner w-5 h-5 border-2"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            {/* Info Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
              <p className="text-center text-xs text-gray-600">
                🔒 Your credentials are encrypted and secure
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-primary-100 text-sm mt-8">
            © 2024 Begum Sahib Noor Zaman Sahulat Dispensary
          </p>
        </div>
      </div>
    </>
  );
}