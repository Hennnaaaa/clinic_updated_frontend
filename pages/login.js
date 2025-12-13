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
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-2xl mb-4">
              <FaHospital className="text-primary-600 text-4xl" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 font-display">
              Begum Sahib Noor Zaman
            </h1>
            <p className="text-primary-100 text-lg">Sahulat Dispensary</p>
            <div className="mt-4 inline-block px-4 py-2 bg-white bg-opacity-20 rounded-full text-white text-sm backdrop-blur-sm">
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
