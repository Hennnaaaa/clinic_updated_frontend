import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import api from '../../utils/api';
import { FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await api.get('/patients');
      setPatients(response.data.patients);
    } catch (error) {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute allowedRoles={['doctor']}>
      <Head><title>My Patients - Doctor</title></Head>
      <Layout>
        <div className="space-y-6">
          <div className="relative max-w-md">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search patients..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field pl-12" />
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
                      <th>Symptoms</th>
                      <th>Prescribed Medicines</th>
                      <th>Visit Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((patient) => (
                      <tr key={patient.id}>
                        <td className="font-semibold">{patient.name}</td>
                        <td>{patient.age} • {patient.gender}</td>
                        <td className="max-w-xs truncate">{patient.symptoms}</td>
                        <td>
                          {patient.prescribedMedicines && patient.prescribedMedicines.length > 0 ? (
                            <div className="text-sm space-y-1">
                              {patient.prescribedMedicines.map((med, idx) => (
                                <div key={idx} className="bg-green-50 px-2 py-1 rounded inline-block mr-1">
                                  <span className="font-medium text-green-800">{med.name}</span>
                                  <span className="text-gray-600 text-xs"> ({med.quantity})</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm italic">None</span>
                          )}
                        </td>
                        <td>{new Date(patient.visitDate).toLocaleDateString()}</td>
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
