import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { FaFilter, FaFileDownload, FaEye, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function AdminReports() {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage] = useState(20);
  
  // Filter states
  const [filters, setFilters] = useState({
    name: '',
    ageMin: '',
    ageMax: '',
    gender: '',
    contactNumber: '',
    symptoms: '',
    diagnosis: '',
    prescribedMedicine: '',
    doctorNotes: '',
    startDate: '',
    endDate: '',
    doctorName: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1); // Reset to first page when filters change
  }, [patients, filters]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [patientsRes, medicinesRes] = await Promise.all([
        api.get('/patients?limit=1000'),
        api.get('/medicines')
      ]);
      
      setPatients(patientsRes.data.patients || []);
      setFilteredPatients(patientsRes.data.patients || []);
      setMedicines(medicinesRes.data || []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...patients];

    if (filters.name) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.ageMin) {
      filtered = filtered.filter(p => p.age >= parseInt(filters.ageMin));
    }
    if (filters.ageMax) {
      filtered = filtered.filter(p => p.age <= parseInt(filters.ageMax));
    }

    if (filters.gender) {
      filtered = filtered.filter(p => p.gender === filters.gender);
    }

    if (filters.contactNumber) {
      filtered = filtered.filter(p => 
        p.contactNumber && p.contactNumber.includes(filters.contactNumber)
      );
    }

    if (filters.symptoms) {
      filtered = filtered.filter(p => 
        p.symptoms && p.symptoms.toLowerCase().includes(filters.symptoms.toLowerCase())
      );
    }

    if (filters.diagnosis) {
      filtered = filtered.filter(p => 
        p.diagnosis && p.diagnosis.toLowerCase().includes(filters.diagnosis.toLowerCase())
      );
    }

    if (filters.prescribedMedicine) {
      filtered = filtered.filter(p => {
        if (!p.prescribedMedicines || !Array.isArray(p.prescribedMedicines)) return false;
        return p.prescribedMedicines.some(med => 
          med.name && med.name.toLowerCase().includes(filters.prescribedMedicine.toLowerCase())
        );
      });
    }

    if (filters.doctorNotes) {
      filtered = filtered.filter(p => 
        p.doctorNotes && p.doctorNotes.toLowerCase().includes(filters.doctorNotes.toLowerCase())
      );
    }

    if (filters.startDate) {
      filtered = filtered.filter(p => 
        new Date(p.visitDate) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      filtered = filtered.filter(p => 
        new Date(p.visitDate) <= new Date(filters.endDate)
      );
    }

    if (filters.doctorName) {
      filtered = filtered.filter(p => 
        p.doctor && p.doctor.fullName.toLowerCase().includes(filters.doctorName.toLowerCase())
      );
    }

    setFilteredPatients(filtered);
  };

  const clearFilters = () => {
    setFilters({
      name: '',
      ageMin: '',
      ageMax: '',
      gender: '',
      contactNumber: '',
      symptoms: '',
      diagnosis: '',
      prescribedMedicine: '',
      doctorNotes: '',
      startDate: '',
      endDate: '',
      doctorName: ''
    });
  };

  const generateStatistics = () => {
    const stats = {
      total: filteredPatients.length,
      male: filteredPatients.filter(p => p.gender === 'Male').length,
      female: filteredPatients.filter(p => p.gender === 'Female').length,
      other: filteredPatients.filter(p => p.gender === 'Other').length,
      avgAge: filteredPatients.length > 0 
        ? (filteredPatients.reduce((sum, p) => sum + p.age, 0) / filteredPatients.length).toFixed(1)
        : 0,
      ageGroups: {
        '0-18': filteredPatients.filter(p => p.age <= 18).length,
        '19-35': filteredPatients.filter(p => p.age > 18 && p.age <= 35).length,
        '36-50': filteredPatients.filter(p => p.age > 35 && p.age <= 50).length,
        '51-65': filteredPatients.filter(p => p.age > 50 && p.age <= 65).length,
        '65+': filteredPatients.filter(p => p.age > 65).length
      }
    };

    const medicineCount = {};
    filteredPatients.forEach(patient => {
      if (patient.prescribedMedicines && Array.isArray(patient.prescribedMedicines)) {
        patient.prescribedMedicines.forEach(med => {
          if (med.name) {
            medicineCount[med.name] = (medicineCount[med.name] || 0) + 1;
          }
        });
      }
    });
    stats.topMedicines = Object.entries(medicineCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const symptomCount = {};
    filteredPatients.forEach(patient => {
      if (patient.symptoms) {
        const symptoms = patient.symptoms.toLowerCase().split(/[,;]+/).map(s => s.trim());
        symptoms.forEach(symptom => {
          if (symptom) {
            symptomCount[symptom] = (symptomCount[symptom] || 0) + 1;
          }
        });
      }
    });
    stats.commonSymptoms = Object.entries(symptomCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return stats;
  };

  const stats = generateStatistics();

  // Pagination calculations
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

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

  const viewPatientDetails = (patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
  };

  const downloadReport = () => {
    const csvContent = [
      ['Name', 'Age', 'Gender', 'Contact', 'Symptoms', 'Diagnosis', 'Amount Charged', 'Medicines', 'Doctor', 'Visit Date'],
      ...filteredPatients.map(p => [
        p.name,
        p.age,
        p.gender,
        p.contactNumber || 'N/A',
        p.symptoms || 'N/A',
        p.diagnosis || 'N/A',
        p.amountCharged || '0.00',
        p.prescribedMedicines ? p.prescribedMedicines.map(m => m.name).join('; ') : 'N/A',
        p.doctor?.fullName || 'N/A',
        new Date(p.visitDate).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patient-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Report downloaded successfully');
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <Layout><div className="flex justify-center py-12"><div className="spinner"></div></div></Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Head><title>Patient Reports & Filters - Admin</title></Head>
      <Layout>
        <div className="space-y-4 md:space-y-6">
          {/* Filter Section */}
          <div className="card">
            <div className="card-header flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <FaFilter className="text-primary-600 text-base md:text-lg" />
                <h3 className="text-base md:text-xl font-bold">Filter Patients by All Fields</h3>
              </div>
              <button onClick={clearFilters} className="btn-secondary text-xs md:text-sm">
                Clear All Filters
              </button>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                <div>
                  <label className="label text-xs md:text-sm">Patient Name</label>
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={filters.name}
                    onChange={(e) => setFilters({...filters, name: e.target.value})}
                    className="input-field text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="label text-xs md:text-sm">Age From</label>
                  <input
                    type="number"
                    placeholder="Min age"
                    value={filters.ageMin}
                    onChange={(e) => setFilters({...filters, ageMin: e.target.value})}
                    className="input-field text-sm md:text-base"
                  />
                </div>
                <div>
                  <label className="label text-xs md:text-sm">Age To</label>
                  <input
                    type="number"
                    placeholder="Max age"
                    value={filters.ageMax}
                    onChange={(e) => setFilters({...filters, ageMax: e.target.value})}
                    className="input-field text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="label text-xs md:text-sm">Gender</label>
                  <select
                    value={filters.gender}
                    onChange={(e) => setFilters({...filters, gender: e.target.value})}
                    className="input-field text-sm md:text-base"
                  >
                    <option value="">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="label text-xs md:text-sm">Contact Number</label>
                  <input
                    type="text"
                    placeholder="Search by contact..."
                    value={filters.contactNumber}
                    onChange={(e) => setFilters({...filters, contactNumber: e.target.value})}
                    className="input-field text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="label text-xs md:text-sm">Symptoms</label>
                  <input
                    type="text"
                    placeholder="Search by symptoms..."
                    value={filters.symptoms}
                    onChange={(e) => setFilters({...filters, symptoms: e.target.value})}
                    className="input-field text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="label text-xs md:text-sm">Diagnosis</label>
                  <input
                    type="text"
                    placeholder="Search by diagnosis..."
                    value={filters.diagnosis}
                    onChange={(e) => setFilters({...filters, diagnosis: e.target.value})}
                    className="input-field text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="label text-xs md:text-sm">Prescribed Medicine</label>
                  <input
                    type="text"
                    placeholder="Search by medicine..."
                    value={filters.prescribedMedicine}
                    onChange={(e) => setFilters({...filters, prescribedMedicine: e.target.value})}
                    className="input-field text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="label text-xs md:text-sm">Doctor Notes</label>
                  <input
                    type="text"
                    placeholder="Search in notes..."
                    value={filters.doctorNotes}
                    onChange={(e) => setFilters({...filters, doctorNotes: e.target.value})}
                    className="input-field text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="label text-xs md:text-sm">Visit Date From</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    className="input-field text-sm md:text-base"
                  />
                </div>
                <div>
                  <label className="label text-xs md:text-sm">Visit Date To</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    className="input-field text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="label text-xs md:text-sm">Doctor Name</label>
                  <input
                    type="text"
                    placeholder="Search by doctor..."
                    value={filters.doctorName}
                    onChange={(e) => setFilters({...filters, doctorName: e.target.value})}
                    className="input-field text-sm md:text-base"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Summary - Mobile Optimized */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            <div className="stat-card bg-gradient-to-br from-primary-50 to-blue-50">
              <p className="text-2xl md:text-3xl font-bold text-primary-600">{stats.total}</p>
              <p className="text-xs md:text-sm text-gray-600">Total Patients</p>
            </div>
            <div className="stat-card bg-gradient-to-br from-blue-50 to-cyan-50">
              <p className="text-2xl md:text-3xl font-bold text-blue-600">{stats.male}</p>
              <p className="text-xs md:text-sm text-gray-600">Male</p>
            </div>
            <div className="stat-card bg-gradient-to-br from-pink-50 to-rose-50">
              <p className="text-2xl md:text-3xl font-bold text-pink-600">{stats.female}</p>
              <p className="text-xs md:text-sm text-gray-600">Female</p>
            </div>
            <div className="stat-card bg-gradient-to-br from-purple-50 to-violet-50">
              <p className="text-2xl md:text-3xl font-bold text-purple-600">{stats.other}</p>
              <p className="text-xs md:text-sm text-gray-600">Other</p>
            </div>
            <div className="stat-card bg-gradient-to-br from-green-50 to-emerald-50">
              <p className="text-2xl md:text-3xl font-bold text-green-600">{stats.avgAge}</p>
              <p className="text-xs md:text-sm text-gray-600">Avg Age</p>
            </div>
            <div className="stat-card bg-gradient-to-br from-orange-50 to-amber-50">
              <button onClick={downloadReport} className="w-full">
                <FaFileDownload className="text-2xl md:text-3xl text-orange-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Download CSV</p>
              </button>
            </div>
          </div>

          {/* Age Distribution - Mobile Optimized */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-base md:text-lg font-bold">Age Distribution</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-5 gap-2 md:gap-4">
                {Object.entries(stats.ageGroups).map(([group, count]) => (
                  <div key={group} className="text-center p-2 md:p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                    <p className="text-lg md:text-2xl font-bold text-gray-700">{count}</p>
                    <p className="text-[10px] md:text-xs text-gray-600">Age {group}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Medicines & Symptoms - Mobile Optimized */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="card">
              <div className="card-header">
                <h3 className="text-base md:text-lg font-bold">Top Prescribed Medicines ({stats.topMedicines.length})</h3>
              </div>
              <div className="card-body max-h-80 overflow-y-auto">
                {stats.topMedicines.length > 0 ? (
                  <div className="space-y-2">
                    {stats.topMedicines.map(([name, count], idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 md:p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                        <span className="font-medium text-gray-700 text-xs md:text-sm">{name}</span>
                        <span className="badge badge-success text-xs">{count} times</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8 text-sm md:text-base">No medicine data</p>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="text-base md:text-lg font-bold">Common Symptoms ({stats.commonSymptoms.length})</h3>
              </div>
              <div className="card-body max-h-80 overflow-y-auto">
                {stats.commonSymptoms.length > 0 ? (
                  <div className="space-y-2">
                    {stats.commonSymptoms.map(([symptom, count], idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 md:p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg">
                        <span className="font-medium text-gray-700 capitalize text-xs md:text-sm">{symptom}</span>
                        <span className="badge badge-warning text-xs">{count} times</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8 text-sm md:text-base">No symptom data</p>
                )}
              </div>
            </div>
          </div>

          {/* Filtered Results Table - Mobile Optimized with Pagination */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-base md:text-xl font-bold">
                Filtered Results ({filteredPatients.length} patients) 
                {totalPages > 0 && <span className="text-sm md:text-base font-normal text-gray-600"> • Page {currentPage} of {totalPages}</span>}
              </h3>
            </div>
            <div className="card-body">
              {currentPatients.length > 0 ? (
                <>
                  {/* Contained Horizontal Scroll - Table ONLY, Not Page */}
                  <div className="overflow-x-auto overflow-y-visible">
                    <table className="w-full" style={{ minWidth: '1000px' }}>
                      <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                        <tr>
                          <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm whitespace-nowrap">Name</th>
                          <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm whitespace-nowrap">Age/Gender</th>
                          <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm whitespace-nowrap">Contact</th>
                          <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm whitespace-nowrap">Symptoms</th>
                          <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm whitespace-nowrap">Amount</th>
                          <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm whitespace-nowrap">Medicines</th>
                          <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm whitespace-nowrap">Visit Date</th>
                          <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm whitespace-nowrap">Doctor</th>
                          <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {currentPatients.map((patient) => (
                          <tr key={patient.id} className="hover:bg-gray-50">
                            <td className="px-3 md:px-4 py-2 md:py-3 font-semibold text-xs md:text-sm whitespace-nowrap">{patient.name}</td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm whitespace-nowrap">{patient.age} • {patient.gender}</td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm whitespace-nowrap">{patient.contactNumber || 'N/A'}</td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm max-w-[200px] truncate">{patient.symptoms || 'N/A'}</td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-semibold text-green-600 whitespace-nowrap">
                              Rs. {patient.amountCharged || '0.00'}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3">
                              {patient.prescribedMedicines && patient.prescribedMedicines.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {patient.prescribedMedicines.map((med, idx) => (
                                    <span key={idx} className="inline-block bg-green-100 text-green-800 px-1.5 md:px-2 py-0.5 md:py-1 rounded text-[10px] md:text-xs whitespace-nowrap">
                                      {med.name} ({med.quantity})
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs italic">None</span>
                              )}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm whitespace-nowrap">{new Date(patient.visitDate).toLocaleDateString()}</td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm whitespace-nowrap">{patient.doctor?.fullName || 'N/A'}</td>
                            <td className="px-3 md:px-4 py-2 md:py-3 whitespace-nowrap">
                              <button 
                                onClick={() => viewPatientDetails(patient)}
                                className="text-primary-600 hover:text-primary-800"
                              >
                                <FaEye className="text-base md:text-lg" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-4 px-4 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                        <div className="text-xs md:text-sm text-gray-700">
                          Showing {indexOfFirstPatient + 1} to {Math.min(indexOfLastPatient, filteredPatients.length)} of {filteredPatients.length} patients
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
                                  className="px-3 py-1.5 text-xs md:text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
                                >
                                  1
                                </button>
                                {currentPage > 4 && <span className="px-2 py-1.5 text-xs md:text-sm">...</span>}
                              </>
                            )}

                            {getPageNumbers().map((page) => (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-1.5 text-xs md:text-sm border rounded-lg ${
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
                                {currentPage < totalPages - 3 && <span className="px-2 py-1.5 text-xs md:text-sm">...</span>}
                                <button
                                  onClick={() => handlePageChange(totalPages)}
                                  className="px-3 py-1.5 text-xs md:text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
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
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-sm md:text-lg mb-4">No patients match your filters</p>
                  <button onClick={clearFilters} className="btn-primary text-sm md:text-base">Clear Filters</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Patient Details Modal - Mobile Optimized */}
        {showDetailsModal && selectedPatient && (
          <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
            <div className="modal-content max-w-3xl" onClick={(e) => e.stopPropagation()}>
              <div className="card-header flex items-center justify-between">
                <h3 className="text-base md:text-xl font-bold">Patient Details</h3>
                <button onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-700">
                  <FaTimes size={20} className="md:w-6 md:h-6" />
                </button>
              </div>
              <div className="card-body space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs md:text-sm text-gray-600">Patient Name</p>
                    <p className="font-semibold text-sm md:text-lg">{selectedPatient.name}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-600">Age / Gender</p>
                    <p className="font-semibold text-sm md:text-base">{selectedPatient.age} years • {selectedPatient.gender}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-600">Contact Number</p>
                    <p className="font-semibold text-sm md:text-base">{selectedPatient.contactNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-600">Visit Date</p>
                    <p className="font-semibold text-sm md:text-base">{new Date(selectedPatient.visitDate).toLocaleDateString()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs md:text-sm text-gray-600">Amount Charged</p>
                    <p className="font-bold text-base md:text-lg text-green-600">Rs. {selectedPatient.amountCharged || '0.00'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs md:text-sm text-gray-600">Address</p>
                  <p className="font-semibold text-sm md:text-base">{selectedPatient.address || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-xs md:text-sm text-gray-600">Symptoms</p>
                  <p className="font-semibold text-sm md:text-base">{selectedPatient.symptoms || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-xs md:text-sm text-gray-600">Diagnosis</p>
                  <p className="font-semibold text-sm md:text-base">{selectedPatient.diagnosis || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-xs md:text-sm text-gray-600 mb-2">Prescribed Medicines</p>
                  {selectedPatient.prescribedMedicines && selectedPatient.prescribedMedicines.length > 0 ? (
                    <div className="space-y-2">
                      {selectedPatient.prescribedMedicines.map((med, idx) => (
                        <div key={idx} className="bg-green-50 p-3 md:p-4 rounded-lg border-2 border-green-200">
                          <p className="font-bold text-sm md:text-lg text-green-900">{idx + 1}. {med.name}</p>
                          <p className="text-xs md:text-base text-gray-700 mt-1">
                            <span className="font-semibold">Quantity:</span> {med.quantity} {med.unit}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm md:text-base">No medicines prescribed</p>
                  )}
                </div>

                <div>
                  <p className="text-xs md:text-sm text-gray-600">Doctor Notes</p>
                  <p className="font-semibold text-sm md:text-base">{selectedPatient.doctorNotes || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-xs md:text-sm text-gray-600">Doctor</p>
                  <p className="font-semibold text-sm md:text-base">{selectedPatient.doctor?.fullName || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  );
}