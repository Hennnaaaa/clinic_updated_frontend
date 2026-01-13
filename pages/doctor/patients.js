import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSearch, FaFilter, FaTimes, FaChevronLeft, FaChevronRight, FaEdit, FaEye } from 'react-icons/fa';
import { format } from 'date-fns';
import Head from 'next/head';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/common/ProtectedRoute';

export default function DoctorPatients() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [saving, setSaving] = useState(false);
  
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
    if (!authLoading && (!user || user.role !== 'doctor')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'doctor') {
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
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setPatients(response.data.patients || []);
      setTotalPatients(response.data.pagination?.total || 0);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching patients:', error);
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
    setFilters({
      gender: '',
      minAge: '',
      maxAge: '',
      symptoms: '',
      startDate: '',
      endDate: ''
    });
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
    
    if (endPage - startPage < showPages - 1) {
      startPage = Math.max(1, endPage - showPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const handleEditClick = (patient) => {
    setEditingPatient({...patient});
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPatient) return;
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL || process.env.API_URL}/patients/${editingPatient.id}`,
        editingPatient,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      toast.success('Patient updated successfully');
      setShowEditModal(false);
      setEditingPatient(null);
      fetchPatients();
    } catch (error) {
      console.error('Error updating patient:', error);
      toast.error('Failed to update patient');
    } finally {
      setSaving(false);
    }
  };

  const handleEditChange = (field, value) => {
    setEditingPatient(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
     <ProtectedRoute allowedRoles={['doctor']}>
      <Head><title>My Patients - Doctor</title></Head>
      <Layout>
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex-1 p-3 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">My Patients</h1>
            <p className="text-sm md:text-base text-gray-600">
              Total: {totalPatients} patients • Page {currentPage} of {totalPages}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-3 md:p-4 mb-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm md:text-base" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 px-4 py-2 md:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm md:text-base whitespace-nowrap"
              >
                <FaFilter className="text-sm md:text-base" />
                <span>Filters</span>
                {showFilters && <FaTimes className="text-sm" />}
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      value={filters.gender}
                      onChange={(e) => handleFilterChange('gender', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                    >
                      <option value="">All</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Min Age</label>
                    <input
                      type="number"
                      value={filters.minAge}
                      onChange={(e) => handleFilterChange('minAge', e.target.value)}
                      placeholder="Min age"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Max Age</label>
                    <input
                      type="number"
                      value={filters.maxAge}
                      onChange={(e) => handleFilterChange('maxAge', e.target.value)}
                      placeholder="Max age"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">From Date</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Symptoms</label>
                    <input
                      type="text"
                      value={filters.symptoms}
                      onChange={(e) => handleFilterChange('symptoms', e.target.value)}
                      placeholder="Search symptoms"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                    />
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Table Container - Scroll ONLY the table, not the page */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center p-8 md:p-12">
                <div className="spinner"></div>
              </div>
            ) : patients.length === 0 ? (
              <div className="text-center p-8 md:p-12">
                <p className="text-base md:text-lg text-gray-600">No patients found</p>
              </div>
            ) : (
              <>
                {/* Contained Horizontal Scroll - Table ONLY */}
                <div className="overflow-x-auto overflow-y-visible">
                  <table className="w-full" style={{ minWidth: '800px' }}>
                    <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                      <tr>
                        <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold whitespace-nowrap">Name</th>
                        <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold whitespace-nowrap">Age/Gender</th>
                        <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold whitespace-nowrap">Contact</th>
                        <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold whitespace-nowrap">Symptoms</th>
                        <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold whitespace-nowrap">Amount</th>
                        <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold whitespace-nowrap">Visit Date</th>
                        <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {patients.map((patient) => (
                        <tr key={patient.id} className="hover:bg-gray-50">
                          <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap">{patient.name}</td>
                          <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm whitespace-nowrap">{patient.age} • {patient.gender}</td>
                          <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm whitespace-nowrap">{patient.contactNumber}</td>
                          <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm" style={{ maxWidth: '200px' }}>
                            <div className="truncate">{patient.symptoms}</div>
                          </td>
                          <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-semibold text-green-600 whitespace-nowrap">
                            Rs. {patient.amountCharged ? patient.amountCharged : '0.00'}
                          </td>
                          <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm whitespace-nowrap">
                            {format(new Date(patient.visitDate), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-3 md:px-4 py-2 md:py-3 whitespace-nowrap">
                            <button
                              onClick={() => handleEditClick(patient)}
                              className="text-blue-600 hover:text-blue-800 p-1 md:p-2"
                              title="Edit Patient"
                            >
                              <FaEdit className="text-base md:text-lg" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="text-xs md:text-sm text-gray-700">
                      Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalPatients)} of {totalPatients} patients
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaChevronLeft className="text-xs" />
                      </button>

                      <div className="flex gap-1">
                        {currentPage > 3 && (
                          <>
                            <button
                              onClick={() => handlePageChange(1)}
                              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
                            >
                              1
                            </button>
                            {currentPage > 4 && <span className="px-2 py-1.5 text-sm">...</span>}
                          </>
                        )}

                        {getPageNumbers().map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1.5 text-sm border rounded-lg ${
                              currentPage === page
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {page}
                          </button>
                        ))}

                        {currentPage < totalPages - 2 && (
                          <>
                            {currentPage < totalPages - 3 && <span className="px-2 py-1.5 text-sm">...</span>}
                            <button
                              onClick={() => handlePageChange(totalPages)}
                              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
                            >
                              {totalPages}
                            </button>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaChevronRight className="text-xs" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal - Same as before */}
      {showEditModal && editingPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-center rounded-t-lg">
              <h2 className="text-lg md:text-xl font-bold">Edit Patient Record</h2>
              <button onClick={() => setShowEditModal(false)} className="text-white hover:text-gray-200">
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="p-4 md:p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name *</label>
                  <input
                    type="text"
                    value={editingPatient.name}
                    onChange={(e) => handleEditChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                  <input
                    type="number"
                    value={editingPatient.age}
                    onChange={(e) => handleEditChange('age', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                  <select
                    value={editingPatient.gender}
                    onChange={(e) => handleEditChange('gender', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                  <input
                    type="text"
                    value={editingPatient.contactNumber || ''}
                    onChange={(e) => handleEditChange('contactNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Charged (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPatient.amountCharged || 0}
                    onChange={(e) => handleEditChange('amountCharged', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={editingPatient.address || ''}
                    onChange={(e) => handleEditChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
                  <textarea
                    value={editingPatient.symptoms}
                    onChange={(e) => handleEditChange('symptoms', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                  <textarea
                    value={editingPatient.diagnosis || ''}
                    onChange={(e) => handleEditChange('diagnosis', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Notes</label>
                  <textarea
                    value={editingPatient.doctorNotes || ''}
                    onChange={(e) => handleEditChange('doctorNotes', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    value={editingPatient.followUpDate ? editingPatient.followUpDate.split('T')[0] : ''}
                    onChange={(e) => handleEditChange('followUpDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  />
                </div>
              </div>

              {editingPatient.prescribedMedicines && editingPatient.prescribedMedicines.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prescribed Medicines</label>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    {editingPatient.prescribedMedicines.map((med, index) => (
                      <div key={index} className="text-sm mb-1">
                        • {med.name} - {med.quantity} {med.unit || ''} ({med.dosage})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-4 md:px-6 py-4 flex gap-3 justify-end border-t rounded-b-lg">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 md:px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition text-sm md:text-base"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 md:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm md:text-base"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
       </Layout>
    </ProtectedRoute>
  );
}