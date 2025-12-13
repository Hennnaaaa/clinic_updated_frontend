import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import api from '../../utils/api';
import { FaUser, FaPills, FaChartLine } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Link from 'next/link';

export default function DoctorDashboard() {
  const [stats, setStats] = useState({ totalPatients: 0, recentPatients: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/patients?limit=5');
      setStats({
        totalPatients: response.data.pagination.total,
        recentPatients: response.data.patients
      });
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['doctor']}>
        <Layout><div className="flex items-center justify-center h-64"><div className="spinner"></div></div></Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['doctor']}>
      <Head><title>Doctor Dashboard</title></Head>
      <Layout>
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="stat-card bg-gradient-to-br from-primary-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">My Patients</p>
                  <p className="text-4xl font-bold text-primary-600">{stats.totalPatients}</p>
                </div>
                <FaUser className="text-4xl text-primary-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="text-xl font-bold text-gray-800">Recent Patients</h3></div>
            <div className="card-body">
              {stats.recentPatients.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentPatients.map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{patient.name}</p>
                          <p className="text-sm text-gray-600">{patient.age} years • {patient.gender}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{new Date(patient.visitDate).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No recent patients</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/doctor/new-patient" className="card hover:scale-105 transition-transform cursor-pointer">
              <div className="card-body text-center">
                <FaUser className="text-5xl text-primary-600 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-gray-800 mb-2">New Patient</h4>
                <p className="text-sm text-gray-600">Add new patient record</p>
              </div>
            </Link>

            <Link href="/doctor/patients" className="card hover:scale-105 transition-transform cursor-pointer">
              <div className="card-body text-center">
                <FaChartLine className="text-5xl text-green-600 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-gray-800 mb-2">My Patients</h4>
                <p className="text-sm text-gray-600">View patient history</p>
              </div>
            </Link>

            <Link href="/doctor/medicines" className="card hover:scale-105 transition-transform cursor-pointer">
              <div className="card-body text-center">
                <FaPills className="text-5xl text-purple-600 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-gray-800 mb-2">Medicines</h4>
                <p className="text-sm text-gray-600">View available medicines</p>
              </div>
            </Link>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
