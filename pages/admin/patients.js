import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import api from '../../utils/api';
import { FaSearch, FaEye } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ gender: '', startDate: '', endDate: '' });

  useEffect(() => {
    fetchPatients();
  }, [filters]);

  const fetchPatients = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filters.gender) params.append('gender', filters.gender);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const response = await api.get(`/patients?${params.toString()}`);
      setPatients(response.data.patients);
    } catch (error) {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchPatients();
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Head><title>Patients - Admin</title></Head>
      <Layout>
        <div className="space-y-6">
          <div className="card">
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <input type="text" placeholder="Search patients..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field" />
                </div>
                <select value={filters.gender} onChange={(e) => setFilters({...filters, gender: e.target.value})} className="input-field">
                  <option value="">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <button onClick={handleSearch} className="btn-primary"><FaSearch className="inline mr-2" /> Search</button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="spinner"></div></div>
          ) : (
            <div className="card">
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Age/Gender</th>
                      <th>Prescribed Medicines</th>
                      <th>Visit Date</th>
                      <th>Doctor</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((patient) => (
                      <tr key={patient.id}>
                        <td className="font-semibold">{patient.name}</td>
                        <td>{patient.age} • {patient.gender}</td>
                        <td className="max-w-xs">
                          {patient.prescribedMedicines && patient.prescribedMedicines.length > 0 ? (
                            <div className="space-y-1">
                              {patient.prescribedMedicines.map((med, idx) => (
                                <div key={idx} className="text-sm bg-green-50 px-2 py-1 rounded">
                                  <span className="font-medium text-green-800">{med.name}</span>
                                  <span className="text-gray-600 text-xs"> - {med.quantity} {med.unit}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm italic">None</span>
                          )}
                        </td>
                        <td>{new Date(patient.visitDate).toLocaleDateString()}</td>
                        <td>{patient.doctor?.fullName}</td>
                        <td>
                          <button className="text-primary-600 hover:text-primary-800">
                            <FaEye />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
