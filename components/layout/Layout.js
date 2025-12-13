import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  FaHome, FaPills, FaUser, FaSignOutAlt, FaChartBar, 
  FaUserMd, FaHospital, FaBars, FaTimes 
} from 'react-icons/fa';
import { useState } from 'react';

const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const adminMenuItems = [
    { icon: FaHome, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: FaPills, label: 'Medicine Inventory', path: '/admin/medicines' },
    { icon: FaUser, label: 'Patients', path: '/admin/patients' },
    { icon: FaChartBar, label: 'Reports', path: '/admin/reports' },
  ];

  const doctorMenuItems = [
    { icon: FaHome, label: 'Dashboard', path: '/doctor/dashboard' },
    { icon: FaUser, label: 'New Patient', path: '/doctor/new-patient' },
    { icon: FaUserMd, label: 'My Patients', path: '/doctor/patients' },
    { icon: FaPills, label: 'Medicines', path: '/doctor/medicines' },
  ];

  const menuItems = isAdmin ? adminMenuItems : doctorMenuItems;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-primary-900 via-primary-800 to-primary-900 text-white transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-primary-700">
          <div className="flex items-center space-x-3">
            <div className="medical-cross text-white w-10 h-10"></div>
            <div>
              <h1 className="text-xl font-bold font-display">Begum Sahib</h1>
              <p className="text-xs text-primary-200">Noor Zaman Dispensary</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-6 bg-primary-800 bg-opacity-50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xl font-bold">
              {user?.fullName?.charAt(0)}
            </div>
            <div>
              <p className="font-semibold">{user?.fullName}</p>
              <p className="text-xs text-primary-200 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = router.pathname === item.path;
            
            return (
              <Link
                key={index}
                href={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-primary-600 shadow-lg'
                    : 'hover:bg-primary-700 hover:pl-6'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="text-xl" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-red-600 hover:pl-6 transition-all duration-200 mt-8"
          >
            <FaSignOutAlt className="text-xl" />
            <span className="font-medium">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white shadow-md border-b-4 border-primary-500">
          <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-primary-600 text-2xl"
              >
                {sidebarOpen ? <FaTimes /> : <FaBars />}
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 font-display">
                  {menuItems.find(item => item.path === router.pathname)?.label || 'Dashboard'}
                </h2>
                <p className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <FaHospital className="text-primary-600 text-2xl" />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4 px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <p className="text-sm text-gray-600">
              © 2024 Begum Sahib Noor Zaman Sahulat Dispensary. All rights reserved.
            </p>
            <p className="text-xs text-gray-500">
              Version 1.0.0
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
