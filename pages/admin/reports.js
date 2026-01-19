import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { FaFilter, FaFileDownload, FaEye, FaTimes, FaChevronLeft, FaChevronRight, FaMoneyBillWave, FaCalendarDay } from 'react-icons/fa';

export default function AdminReports() {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // NEW: Backend-calculated revenue data
  const [dailyRevenueData, setDailyRevenueData] = useState([]);
  const [overallRevenueStats, setOverallRevenueStats] = useState({
    totalPatients: 0,
    totalRevenue: 0,
    averageRevenue: 0
  });
  const [revenueLoading, setRevenueLoading] = useState(false);
  
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
    setCurrentPage(1);
    // Fetch revenue data when date filters change
    fetchDailyRevenue();
  }, [patients, filters.startDate, filters.endDate]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [patientsRes, medicinesRes] = await Promise.all([
        api.get('/patients?limit=10000'),
        api.get('/medicines')
      ]);
      
      setPatients(patientsRes.data.patients || []);
      setFilteredPatients(patientsRes.data.patients || []);
      setMedicines(medicinesRes.data || []);
      
      // Fetch initial revenue data
      await fetchDailyRevenue();
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch daily revenue from backend API
  const fetchDailyRevenue = async () => {
    try {
      setRevenueLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const response = await api.get(`/patients/revenue/daily?${params.toString()}`);
      
      setDailyRevenueData(response.data.dailyRevenue || []);
      setOverallRevenueStats(response.data.overallStats || {
        totalPatients: 0,
        totalRevenue: 0,
        averageRevenue: 0
      });
      
      console.log('Revenue data fetched from backend:', response.data);
    } catch (error) {
      console.error('Error fetching revenue:', error);
      toast.error('Failed to load revenue data');
    } finally {
      setRevenueLoading(false);
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
      totalRevenue: overallRevenueStats.totalRevenue, // Use backend data
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
        p.prescribedMedicines ? p.prescribedMedicines.map(m => `${m.name} (${m.dosage || m.quantity + ' ' + (m.unit || '')})`).join('; ') : 'N/A',
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

  const downloadDailyRevenueReport = () => {
    const csvContent = [
      ['Date', 'Total Amount (Rs.)', 'Number of Patients', 'Average per Patient (Rs.)'],
      ...dailyRevenueData.map(day => [
        day.date,
        day.totalRevenue.toFixed(2),
        day.patientCount,
        day.averageRevenue.toFixed(2)
      ]),
      ['', '', '', ''],
      ['TOTAL', overallRevenueStats.totalRevenue.toFixed(2), overallRevenueStats.totalPatients, overallRevenueStats.averageRevenue.toFixed(2)]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-revenue-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Daily revenue report downloaded successfully');
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
      <Head><title>Patient Reports & Revenue - Admin</title></Head>
      <Layout>
        <div className="space-y-4 md:space-y-6 pb-4 md:pb-6">
          {/* Filter Section */}
          <div className="card">
            <div className="card-header flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <FaFilter className="text-primary-600 text-base md:text-lg" />
                <h3 className="text-base md:text-xl font-bold">Filter Patients</h3>
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

          {/* Statistics Summary with Revenue */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            <div className="stat-card bg-gradient-to-br from-primary-50 to-blue-50">
              <p className="text-2xl md:text-3xl font-bold text-primary-600">{stats.total}</p>
              <p className="text-xs md:text-sm text-gray-600">Total Patients</p>
            </div>
            <div className="stat-card bg-gradient-to-br from-green-50 to-emerald-50">
              <p className="text-xl md:text-2xl font-bold text-green-600">
                Rs. {stats.totalRevenue.toFixed(2)}
              </p>
              <p className="text-xs md:text-sm text-gray-600">Total Revenue</p>
              {revenueLoading && <p className="text-xs text-gray-400 mt-1">Updating...</p>}
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
              <p className="text-2xl md:text-3xl font-bold text-purple-600">{stats.avgAge}</p>
              <p className="text-xs md:text-sm text-gray-600">Avg Age</p>
            </div>
            <div className="stat-card bg-gradient-to-br from-orange-50 to-amber-50">
              <button onClick={downloadReport} className="w-full">
                <FaFileDownload className="text-2xl md:text-3xl text-orange-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Download CSV</p>
              </button>
            </div>
          </div>

          {/* Daily Revenue Section - Using Backend Data */}
          <div className="card">
            <div className="card-header flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <FaMoneyBillWave className="text-green-600 text-base md:text-lg" />
                <h3 className="text-base md:text-lg font-bold">
                  Daily Revenue Breakdown
                  {revenueLoading && <span className="text-sm font-normal text-gray-500 ml-2">(Loading...)</span>}
                </h3>
              </div>
              <button 
                onClick={downloadDailyRevenueReport}
                className="btn-primary text-xs md:text-sm flex items-center gap-2"
                disabled={revenueLoading}
              >
                <FaFileDownload />
                Download Daily Report
              </button>
            </div>
            <div className="card-body">
              <div className="overflow-x-auto" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="w-full" style={{ minWidth: '600px' }}>
                  <thead className="bg-gradient-to-r from-green-600 to-emerald-600 text-white sticky top-0 z-10">
                    <tr>
                      <th className="px-3 md:px-4 py-3 md:py-4 text-left text-sm md:text-base font-semibold">Date</th>
                      <th className="px-3 md:px-4 py-3 md:py-4 text-left text-sm md:text-base font-semibold">Patients</th>
                      <th className="px-3 md:px-4 py-3 md:py-4 text-left text-sm md:text-base font-semibold">Total Amount</th>
                      <th className="px-3 md:px-4 py-3 md:py-4 text-left text-sm md:text-base font-semibold">Avg/Patient</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {dailyRevenueData.map((day, index) => (
                      <tr key={index} className="hover:bg-green-50">
                        <td className="px-3 md:px-4 py-3 md:py-4">
                          <div className="flex items-center gap-2">
                            <FaCalendarDay className="text-green-600 text-sm" />
                            <span className="font-semibold text-gray-800 text-sm md:text-base">{day.date}</span>
                          </div>
                        </td>
                        <td className="px-3 md:px-4 py-3 md:py-4 text-sm md:text-base">
                          <span className="badge badge-primary">{day.patientCount} patients</span>
                        </td>
                        <td className="px-3 md:px-4 py-3 md:py-4">
                          <span className="text-lg md:text-xl font-bold text-green-600">
                            Rs. {day.totalRevenue.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-3 md:px-4 py-3 md:py-4">
                          <span className="text-sm md:text-base font-semibold text-gray-700">
                            Rs. {day.averageRevenue.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {dailyRevenueData.length > 0 && (
                      <tr className="bg-green-100 font-bold sticky bottom-0">
                        <td className="px-3 md:px-4 py-3 md:py-4 text-sm md:text-base">TOTAL</td>
                        <td className="px-3 md:px-4 py-3 md:py-4 text-sm md:text-base">{overallRevenueStats.totalPatients} patients</td>
                        <td className="px-3 md:px-4 py-3 md:py-4">
                          <span className="text-lg md:text-xl text-green-700">
                            Rs. {overallRevenueStats.totalRevenue.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-3 md:px-4 py-3 md:py-4 text-sm md:text-base">
                          Rs. {overallRevenueStats.averageRevenue.toFixed(2)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {dailyRevenueData.length === 0 && !revenueLoading && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm md:text-base">No revenue data available for the selected date range</p>
                </div>
              )}
            </div>
          </div>

          {/* Age Distribution */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-base md:text-xl font-bold">Age Distribution</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                {Object.entries(stats.ageGroups).map(([range, count]) => (
                  <div key={range} className="stat-card bg-gradient-to-br from-indigo-50 to-purple-50">
                    <p className="text-2xl md:text-3xl font-bold text-indigo-600">{count}</p>
                    <p className="text-xs md:text-sm text-gray-600">{range} years</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Medicines */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-base md:text-xl font-bold">Top 10 Prescribed Medicines</h3>
            </div>
            <div className="card-body">
              {stats.topMedicines.length > 0 ? (
                <div className="space-y-2">
                  {stats.topMedicines.map(([medicine, count], index) => (
                    <div key={medicine} className="flex items-center justify-between p-2 md:p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                      <div className="flex items-center space-x-2 md:space-x-3">
                        <span className="badge badge-primary text-xs md:text-sm">{index + 1}</span>
                        <span className="font-semibold text-gray-800 text-sm md:text-base">{medicine}</span>
                      </div>
                      <span className="badge badge-success text-xs md:text-sm">{count} prescriptions</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 text-sm md:text-base">No medicine data</p>
              )}
            </div>
          </div>

          {/* Common Symptoms */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-base md:text-xl font-bold">Top 10 Common Symptoms</h3>
            </div>
            <div className="card-body">
              {stats.commonSymptoms.length > 0 ? (
                <div className="space-y-2">
                  {stats.commonSymptoms.map(([symptom, count], index) => (
                    <div key={symptom} className="flex items-center justify-between p-2 md:p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-2 md:space-x-3">
                        <span className="badge badge-primary text-xs md:text-sm">{index + 1}</span>
                        <span className="font-semibold text-gray-800 text-sm md:text-base capitalize">{symptom}</span>
                      </div>
                      <span className="badge badge-warning text-xs md:text-sm">{count} patients</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 text-sm md:text-base">No symptom data</p>
              )}
            </div>
          </div>

          {/* Patient List Table */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-base md:text-xl font-bold">
                Patient List ({filteredPatients.length} patients)
              </h3>
            </div>
            <div className="card-body">
              <div className="overflow-x-auto">
                <table className="w-full" style={{ minWidth: '800px' }}>
                  <thead className="bg-gradient-to-r from-primary-600 to-blue-600 text-white">
                    <tr>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm">Name</th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm">Age</th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm">Gender</th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm">Contact</th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm">Amount</th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm">Visit Date</th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentPatients.map((patient) => (
                      <tr key={patient.id} className="hover:bg-gray-50">
                        <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm font-semibold">{patient.name}</td>
                        <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">{patient.age}</td>
                        <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">{patient.gender}</td>
                        <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">{patient.contactNumber || 'N/A'}</td>
                        <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm font-semibold text-green-600">
                          Rs. {patient.amountCharged || '0.00'}
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                          {new Date(patient.visitDate).toLocaleDateString()}
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3">
                          <button
                            onClick={() => viewPatientDetails(patient)}
                            className="text-primary-600 hover:text-primary-800 text-xs md:text-sm"
                          >
                            <FaEye className="inline mr-1" /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 md:mt-6">
                  <div className="text-xs md:text-sm text-gray-600">
                    Showing {indexOfFirstPatient + 1} to {Math.min(indexOfLastPatient, filteredPatients.length)} of {filteredPatients.length} patients
                  </div>
                  <div className="flex items-center space-x-1 md:space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-2 md:px-3 py-1 md:py-2 border rounded text-xs md:text-sm disabled:opacity-50"
                    >
                      <FaChevronLeft />
                    </button>
                    {getPageNumbers().map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-2 md:px-3 py-1 md:py-2 border rounded text-xs md:text-sm ${
                          currentPage === page ? 'bg-primary-600 text-white' : 'bg-white'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-2 md:px-3 py-1 md:py-2 border rounded text-xs md:text-sm disabled:opacity-50"
                    >
                      <FaChevronRight />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Patient Details Modal */}
        {showDetailsModal && selectedPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="card-header flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-lg md:text-xl font-bold">Patient Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes className="text-xl md:text-2xl" />
                </button>
              </div>
              <div className="p-4 md:p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs md:text-sm text-gray-600">Name</p>
                    <p className="font-semibold text-sm md:text-base">{selectedPatient.name}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-600">Age</p>
                    <p className="font-semibold text-sm md:text-base">{selectedPatient.age} years</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-600">Gender</p>
                    <p className="font-semibold text-sm md:text-base">{selectedPatient.gender}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-600">Contact</p>
                    <p className="font-semibold text-sm md:text-base">{selectedPatient.contactNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-600">Amount Charged</p>
                    <p className="font-semibold text-sm md:text-base text-green-600">Rs. {selectedPatient.amountCharged || '0.00'}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-600">Visit Date</p>
                    <p className="font-semibold text-sm md:text-base">
                      {new Date(selectedPatient.visitDate).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedPatient.doctor && (
                    <div>
                      <p className="text-xs md:text-sm text-gray-600">Doctor</p>
                      <p className="font-semibold text-sm md:text-base">Dr. {selectedPatient.doctor.fullName}</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Symptoms</p>
                  <p className="font-semibold text-sm md:text-base">{selectedPatient.symptoms || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Diagnosis</p>
                  <p className="font-semibold text-sm md:text-base">{selectedPatient.diagnosis || 'N/A'}</p>
                </div>
                {selectedPatient.prescribedMedicines && selectedPatient.prescribedMedicines.length > 0 && (
                  <div>
                    <p className="text-xs md:text-sm text-gray-600 mb-2">Prescribed Medicines</p>
                    <div className="space-y-2">
                      {selectedPatient.prescribedMedicines.map((med, index) => (
                        <div key={index} className="bg-green-50 p-2 md:p-3 rounded-lg">
                          <p className="font-semibold text-sm md:text-base">{med.name}</p>
                          <p className="text-xs md:text-sm text-gray-600">
                            {med.dosage || `${med.quantity} ${med.unit || ''}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedPatient.doctorNotes && (
                  <div>
                    <p className="text-xs md:text-sm text-gray-600">Doctor's Notes</p>
                    <p className="font-semibold text-sm md:text-base">{selectedPatient.doctorNotes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  );
}