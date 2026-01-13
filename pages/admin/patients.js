import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSearch, FaFilter, FaTimes, FaChevronLeft, FaChevronRight, FaEye, FaDownload } from 'react-icons/fa';
import { format } from 'date-fns';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import Head from 'next/head';
import Layout from '../../components/layout/Layout';

export default function AdminPatients() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const limit = 20;
  
  const [filters, setFilters] = useState({
    gender: '',
    minAge: '',
    maxAge: '',
    symptoms: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchPatients();
    }
  }, [user, currentPage, searchTerm, filters]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: limit
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (filters.gender) params.append('gender', filters.gender);
      if (filters.minAge) params.append('minAge', filters.minAge);
      if (filters.maxAge) params.append('maxAge', filters.maxAge);
      if (filters.symptoms) params.append('symptoms', filters.symptoms);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || process.env.API_URL}/patients?${params}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );

      setPatients(response.data.patients || []);
      setTotalPatients(response.data.pagination?.total || 0);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ gender: '', minAge: '', maxAge: '', symptoms: '', startDate: '', endDate: '' });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const showPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);
    if (endPage - startPage < showPages - 1) startPage = Math.max(1, endPage - showPages + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  const handleViewDetails = (patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
  };

  if (authLoading || !user) {
    return <div className="flex items-center justify-center min-h-screen"><div className="spinner"></div></div>;
  }

  return (
     <ProtectedRoute allowedRoles={['admin']}>
      <Head><title>Patients - Admin</title></Head>
      <Layout>
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex-1 p-3 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">All Patients</h1>
            <p className="text-sm md:text-base text-gray-600">
              Total: {totalPatients} patients • Page {currentPage} of {totalPages}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-3 md:p-4 mb-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 md:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FaFilter /> Filters {showFilters && <FaTimes />}
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Gender</label>
                    <select value={filters.gender} onChange={(e) => handleFilterChange('gender', e.target.value)} 
                      className="w-full px-3 py-2 border rounded-lg">
                      <option value="">All</option><option value="Male">Male</option>
                      <option value="Female">Female</option><option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Min Age</label>
                    <input type="number" value={filters.minAge} onChange={(e) => handleFilterChange('minAge', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Age</label>
                    <input type="number" value={filters.maxAge} onChange={(e) => handleFilterChange('maxAge', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">From Date</label>
                    <input type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">To Date</label>
                    <input type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Symptoms</label>
                    <input type="text" value={filters.symptoms} onChange={(e) => handleFilterChange('symptoms', e.target.value)}
                      placeholder="Search symptoms" className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button onClick={clearFilters} className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center p-12"><div className="spinner"></div></div>
            ) : patients.length === 0 ? (
              <div className="text-center p-12"><p className="text-lg text-gray-600">No patients found</p></div>
            ) : (
              <>
                {/* Mobile View */}
                <div className="md:hidden">
                  {patients.map((patient) => (
                    <div key={patient.id} className="border-b p-4">
                      <div className="flex justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                          <p className="text-sm text-gray-600">{patient.age} • {patient.gender}</p>
                          <p className="text-xs text-gray-500">{patient.contactNumber}</p>
                        </div>
                        <button onClick={() => handleViewDetails(patient)} 
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">View</button>
                      </div>
                      <p className="text-sm mb-1"><strong>Doctor:</strong> {patient.doctor?.fullName || 'N/A'}</p>
                      <p className="text-sm mb-1"><strong>Symptoms:</strong> {patient.symptoms}</p>
                      <p className="text-sm mb-1"><strong>Amount:</strong> Rs. {patient.amountCharged|| '0.00'}</p>
                      <p className="text-xs text-gray-500">{format(new Date(patient.visitDate), 'MMM dd, yyyy')}</p>
                    </div>
                  ))}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm">Name</th>
                        <th className="px-4 py-3 text-left text-sm">Age/Gender</th>
                        <th className="px-4 py-3 text-left text-sm">Contact</th>
                        <th className="px-4 py-3 text-left text-sm">Doctor</th>
                        <th className="px-4 py-3 text-left text-sm">Symptoms</th>
                        <th className="px-4 py-3 text-left text-sm">Amount</th>
                        <th className="px-4 py-3 text-left text-sm">Visit Date</th>
                        <th className="px-4 py-3 text-left text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {patients.map((patient) => (
                        <tr key={patient.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium">{patient.name}</td>
                          <td className="px-4 py-3 text-sm">{patient.age} • {patient.gender}</td>
                          <td className="px-4 py-3 text-sm">{patient.contactNumber || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                              {patient.doctor?.fullName || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm max-w-xs truncate">{patient.symptoms}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-green-600">
                            Rs. {patient.amountCharged || '0.00'}
                          </td>
                          <td className="px-4 py-3 text-sm">{format(new Date(patient.visitDate), 'MMM dd, yyyy')}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleViewDetails(patient)} className="text-blue-600 hover:text-blue-800 p-2">
                              <FaEye className="text-lg" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-4 py-4 border-t bg-gray-50">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="text-xs md:text-sm text-gray-700">
                      Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalPatients)} of {totalPatients}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                        className="px-3 py-1.5 border rounded-lg hover:bg-gray-100 disabled:opacity-50">
                        <FaChevronLeft />
                      </button>
                      {getPageNumbers().map((page) => (
                        <button key={page} onClick={() => handlePageChange(page)}
                          className={`px-3 py-1.5 border rounded-lg ${currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>
                          {page}
                        </button>
                      ))}
                      <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                        className="px-3 py-1.5 border rounded-lg hover:bg-gray-100 disabled:opacity-50">
                        <FaChevronRight />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Patient Details</h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-white hover:text-gray-200">
                <FaTimes className="text-xl" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-500">Name</label><p className="font-semibold">{selectedPatient.name}</p></div>
                <div><label className="block text-sm text-gray-500">Age/Gender</label><p>{selectedPatient.age} • {selectedPatient.gender}</p></div>
                <div><label className="block text-sm text-gray-500">Contact</label><p>{selectedPatient.contactNumber || 'N/A'}</p></div>
                <div><label className="block text-sm text-gray-500">Doctor</label><p>{selectedPatient.doctor?.fullName || 'N/A'}</p></div>
                <div><label className="block text-sm text-gray-500">Amount Charged</label><p className="text-lg font-bold text-green-600">Rs. {selectedPatient.amountCharged || '0.00'}</p></div>
                <div><label className="block text-sm text-gray-500">Visit Date</label><p>{format(new Date(selectedPatient.visitDate), 'MMMM dd, yyyy')}</p></div>
                <div className="col-span-2"><label className="block text-sm text-gray-500">Address</label><p>{selectedPatient.address || 'N/A'}</p></div>
                <div className="col-span-2"><label className="block text-sm text-gray-500">Symptoms</label><p>{selectedPatient.symptoms}</p></div>
                <div className="col-span-2"><label className="block text-sm text-gray-500">Diagnosis</label><p>{selectedPatient.diagnosis || 'N/A'}</p></div>
                {selectedPatient.prescribedMedicines?.length > 0 && (
                  <div className="col-span-2">
                    <label className="block text-sm text-gray-500 mb-2">Medicines</label>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      {selectedPatient.prescribedMedicines.map((med, i) => (
                        <div key={i} className="text-sm mb-1">• {med.name} - {med.quantity} ({med.dosage})</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end border-t">
              <button onClick={() => setShowDetailsModal(false)} className="px-6 py-2 bg-blue-600 text-white rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-white border-t py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs md:text-sm text-gray-600">© 2024 Begum Sahib Noor Zaman Sahulat Dispensary</p>
        </div>
      </footer>
    </div>
 </Layout>
    </ProtectedRoute>
  );
}