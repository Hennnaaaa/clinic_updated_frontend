import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import api from '../../utils/api';
import { FaUser, FaPills, FaChartLine, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalMedicines: 0,
    lowStockMedicines: 0,
    recentPatients: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [patientsRes, medicinesRes] = await Promise.all([
        api.get('/patients?limit=5'),
        api.get('/medicines')
      ]);

      const medicines = medicinesRes.data;
      const lowStock = medicines.filter(m => m.quantity <= m.reorderLevel);

      setStats({
        totalPatients: patientsRes.data.pagination.total,
        totalMedicines: medicines.length,
        lowStockMedicines: lowStock.length,
        recentPatients: patientsRes.data.patients
      });
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color, bgColor }) => (
    <div className={`stat-card ${bgColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{label}</p>
          <p className={`text-4xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`${color} bg-opacity-10 p-4 rounded-2xl`}>
          <Icon className="text-4xl" />
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
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <StatCard
              icon={FaChartLine}
              label="This Month"
              value="Active"
              color="text-purple-600"
              bgColor="bg-gradient-to-br from-purple-50 to-pink-50"
            />
          </div>

          {/* Recent Patients */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-xl font-bold text-gray-800">Recent Patients</h3>
            </div>
            <div className="card-body">
              {stats.recentPatients.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{patient.name}</p>
                          <p className="text-sm text-gray-600">
                            {patient.age} years • {patient.gender}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {new Date(patient.visitDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          Dr. {patient.doctor?.fullName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No recent patients</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a
              href="/admin/patients"
              className="card hover:scale-105 transition-transform cursor-pointer"
            >
              <div className="card-body text-center">
                <FaUser className="text-5xl text-primary-600 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-gray-800 mb-2">View All Patients</h4>
                <p className="text-sm text-gray-600">Manage patient records and history</p>
              </div>
            </a>

            <a
              href="/admin/medicines"
              className="card hover:scale-105 transition-transform cursor-pointer"
            >
              <div className="card-body text-center">
                <FaPills className="text-5xl text-green-600 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-gray-800 mb-2">Medicine Inventory</h4>
                <p className="text-sm text-gray-600">Manage stock and medicines</p>
              </div>
            </a>

            <a
              href="/admin/reports"
              className="card hover:scale-105 transition-transform cursor-pointer"
            >
              <div className="card-body text-center">
                <FaChartLine className="text-5xl text-purple-600 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-gray-800 mb-2">Generate Reports</h4>
                <p className="text-sm text-gray-600">View analytics and statistics</p>
              </div>
            </a>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
