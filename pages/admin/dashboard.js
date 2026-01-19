import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import api from '../../utils/api';
import { FaUser, FaPills, FaChartLine, FaExclamationTriangle, FaMoneyBillWave, FaCalendarDay } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalMedicines: 0,
    lowStockMedicines: 0,
    recentPatients: [],
    todayRevenue: 0,
    todayPatients: 0,
    todayAverage: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...');
      
      // Fetch patients, medicines, and today's revenue in parallel using backend APIs
      const [patientsRes, medicinesRes, todayRevenueRes] = await Promise.all([
        api.get('/patients?limit=5'),
        api.get('/medicines'),
        api.get('/patients/revenue/today') // Backend API for today's revenue
      ]);

      console.log('Patients response:', patientsRes.data);
      console.log('Medicines response:', medicinesRes.data);
      console.log('Today revenue response:', todayRevenueRes.data);

      const medicines = medicinesRes.data;
      const lowStock = medicines.filter(m => m.quantity <= m.reorderLevel);

      // Handle different response structures for patients
      let totalPatients = 0;
      let recentPatients = [];

      if (patientsRes.data.pagination) {
        totalPatients = patientsRes.data.pagination.total;
        recentPatients = patientsRes.data.patients || [];
      } else if (Array.isArray(patientsRes.data)) {
        totalPatients = patientsRes.data.length;
        recentPatients = patientsRes.data.slice(0, 5);
      } else if (patientsRes.data.patients) {
        totalPatients = patientsRes.data.patients.length;
        recentPatients = patientsRes.data.patients.slice(0, 5);
      }

      // Use backend-calculated today's revenue
      const todayData = todayRevenueRes.data;

      setStats({
        totalPatients,
        totalMedicines: medicines.length,
        lowStockMedicines: lowStock.length,
        recentPatients,
        todayRevenue: todayData.totalRevenue || 0,
        todayPatients: todayData.patientCount || 0,
        todayAverage: todayData.averageRevenue || 0
      });

      console.log('Dashboard stats updated:', {
        totalPatients,
        totalMedicines: medicines.length,
        lowStockMedicines: lowStock.length,
        todayRevenue: todayData.totalRevenue,
        todayPatients: todayData.patientCount
      });

    } catch (error) {
      console.error('Dashboard fetch error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color, bgColor, subtitle }) => (
    <div className={`stat-card ${bgColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-xs md:text-sm font-medium mb-1">{label}</p>
          <p className={`text-2xl md:text-4xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`${color} bg-opacity-10 p-2 md:p-4 rounded-xl md:rounded-2xl`}>
          <Icon className="text-2xl md:text-4xl" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <Layout>
          <div className="flex items-center justify-center h-64">
            <div className="spinner"></div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Head>
        <title>Admin Dashboard - Clinic Management</title>
      </Head>
      
      <Layout>
        <div className="space-y-4 md:space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <StatCard
              icon={FaUser}
              label="Total Patients"
              value={stats.totalPatients}
              color="text-primary-600"
              bgColor="bg-gradient-to-br from-primary-50 to-blue-50"
            />
            <StatCard
              icon={FaPills}
              label="Total Medicines"
              value={stats.totalMedicines}
              color="text-green-600"
              bgColor="bg-gradient-to-br from-green-50 to-emerald-50"
            />
            <StatCard
              icon={FaExclamationTriangle}
              label="Low Stock Items"
              value={stats.lowStockMedicines}
              color="text-orange-600"
              bgColor="bg-gradient-to-br from-orange-50 to-yellow-50"
            />
          </div>

          {/* Today's Revenue Section - Using Backend Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="stat-card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1 md:mb-2">
                    <FaCalendarDay className="text-green-600 text-sm md:text-xl" />
                    <p className="text-gray-600 text-xs md:text-sm font-medium">Today's Revenue</p>
                  </div>
                  <p className="text-2xl md:text-5xl font-bold text-green-600">
                    Rs. {stats.todayRevenue.toFixed(2)}
                  </p>
                  <p className="text-xs md:text-sm text-gray-500 mt-1 md:mt-2">
                    From {stats.todayPatients} patient{stats.todayPatients !== 1 ? 's' : ''} today
                  </p>
                </div>
                <div className="text-green-600 bg-opacity-10 p-2 md:p-4 rounded-xl md:rounded-2xl">
                  <FaMoneyBillWave className="text-3xl md:text-5xl" />
                </div>
              </div>
            </div>

            <div className="stat-card bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs md:text-sm font-medium mb-1 md:mb-2">Average per Patient Today</p>
                  <p className="text-2xl md:text-5xl font-bold text-purple-600">
                    Rs. {stats.todayAverage.toFixed(2)}
                  </p>
                  <p className="text-xs md:text-sm text-gray-500 mt-1 md:mt-2">
                    {stats.todayPatients > 0 ? 'Today\'s average' : 'No patients today yet'}
                  </p>
                </div>
                <div className="text-purple-600 bg-opacity-10 p-2 md:p-4 rounded-xl md:rounded-2xl">
                  <FaChartLine className="text-3xl md:text-5xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Patients */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg md:text-xl font-bold text-gray-800">Recent Patients</h3>
            </div>
            <div className="card-body">
              {stats.recentPatients.length > 0 ? (
                <div className="space-y-3 md:space-y-4">
                  {stats.recentPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-3 md:space-x-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-base md:text-lg">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm md:text-base">{patient.name}</p>
                          <p className="text-xs md:text-sm text-gray-600">
                            {patient.age} years • {patient.gender}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs md:text-sm font-semibold text-green-600">
                          Rs. {patient.amountCharged || '0.00'}
                        </p>
                        <p className="text-xs md:text-sm text-gray-600">
                          {new Date(patient.visitDate).toLocaleDateString()}
                        </p>
                        {patient.doctor?.fullName && (
                          <p className="text-xs text-gray-500">
                            Dr. {patient.doctor.fullName}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8 text-sm md:text-base">No recent patients</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <a
              href="/admin/patients"
              className="card hover:scale-105 transition-transform cursor-pointer"
            >
              <div className="card-body text-center">
                <FaUser className="text-4xl md:text-5xl text-primary-600 mx-auto mb-3 md:mb-4" />
                <h4 className="text-base md:text-lg font-bold text-gray-800 mb-1 md:mb-2">View All Patients</h4>
                <p className="text-xs md:text-sm text-gray-600">Manage patient records and history</p>
              </div>
            </a>

            <a
              href="/admin/medicines"
              className="card hover:scale-105 transition-transform cursor-pointer"
            >
              <div className="card-body text-center">
                <FaPills className="text-4xl md:text-5xl text-green-600 mx-auto mb-3 md:mb-4" />
                <h4 className="text-base md:text-lg font-bold text-gray-800 mb-1 md:mb-2">Medicine Inventory</h4>
                <p className="text-xs md:text-sm text-gray-600">Manage stock and medicines</p>
              </div>
            </a>

            <a
              href="/admin/reports"
              className="card hover:scale-105 transition-transform cursor-pointer"
            >
              <div className="card-body text-center">
                <FaChartLine className="text-4xl md:text-5xl text-purple-600 mx-auto mb-3 md:mb-4" />
                <h4 className="text-base md:text-lg font-bold text-gray-800 mb-1 md:mb-2">Revenue Reports</h4>
                <p className="text-xs md:text-sm text-gray-600">View daily revenue and analytics</p>
              </div>
            </a>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}