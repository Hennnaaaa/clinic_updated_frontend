import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { FaFilter, FaFileDownload, FaEye, FaTimes } from 'react-icons/fa';

export default function AdminReports() {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Filter states - matching all doctor input fields
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

    // Filter by name
    if (filters.name) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    // Filter by age range
    if (filters.ageMin) {
      filtered = filtered.filter(p => p.age >= parseInt(filters.ageMin));
    }
    if (filters.ageMax) {
      filtered = filtered.filter(p => p.age <= parseInt(filters.ageMax));
    }

    // Filter by gender
    if (filters.gender) {
      filtered = filtered.filter(p => p.gender === filters.gender);
    }

    // Filter by contact number
    if (filters.contactNumber) {
      filtered = filtered.filter(p => 
        p.contactNumber && p.contactNumber.includes(filters.contactNumber)
      );
    }

    // Filter by symptoms
    if (filters.symptoms) {
      filtered = filtered.filter(p => 
        p.symptoms && p.symptoms.toLowerCase().includes(filters.symptoms.toLowerCase())
      );
    }

    // Filter by diagnosis
    if (filters.diagnosis) {
      filtered = filtered.filter(p => 
        p.diagnosis && p.diagnosis.toLowerCase().includes(filters.diagnosis.toLowerCase())
      );
    }

    // Filter by prescribed medicine
    if (filters.prescribedMedicine) {
      filtered = filtered.filter(p => {
        if (!p.prescribedMedicines || !Array.isArray(p.prescribedMedicines)) return false;
        return p.prescribedMedicines.some(med => 
          med.name && med.name.toLowerCase().includes(filters.prescribedMedicine.toLowerCase())
        );
      });
    }

    // Filter by doctor notes
    if (filters.doctorNotes) {
      filtered = filtered.filter(p => 
        p.doctorNotes && p.doctorNotes.toLowerCase().includes(filters.doctorNotes.toLowerCase())
      );
    }

    // Filter by date range
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

    // Filter by doctor name
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

    // Top medicines
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

    // Common symptoms
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

  const viewPatientDetails = (patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
  };

  const downloadReport = () => {
    const csvContent = [
      ['Name', 'Age', 'Gender', 'Contact', 'Symptoms', 'Diagnosis', 'Medicines', 'Doctor', 'Visit Date'],
      ...filteredPatients.map(p => [
        p.name,
        p.age,
        p.gender,
        p.contactNumber || 'N/A',
        p.symptoms || 'N/A',
        p.diagnosis || 'N/A',
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
        <div className="space-y-6">
          {/* Filter Section */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FaFilter className="text-primary-600" />
                <h3 className="text-xl font-bold">Filter Patients by All Fields</h3>
              </div>
              <button onClick={clearFilters} className="btn-secondary text-sm">
                Clear All Filters
              </button>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Patient Name */}
                <div>
                  <label className="label">Patient Name</label>
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={filters.name}
                    onChange={(e) => setFilters({...filters, name: e.target.value})}
                    className="input-field"
                  />
                </div>

                {/* Age Range */}
                <div>
                  <label className="label">Age From</label>
                  <input
                    type="number"
                    placeholder="Min age"
                    value={filters.ageMin}
                    onChange={(e) => setFilters({...filters, ageMin: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Age To</label>
                  <input
                    type="number"
                    placeholder="Max age"
                    value={filters.ageMax}
                    onChange={(e) => setFilters({...filters, ageMax: e.target.value})}
                    className="input-field"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="label">Gender</label>
                  <select
                    value={filters.gender}
                    onChange={(e) => setFilters({...filters, gender: e.target.value})}
                    className="input-field"
                  >
                    <option value="">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Contact Number */}
                <div>
                  <label className="label">Contact Number</label>
                  <input
                    type="text"
                    placeholder="Search by contact..."
                    value={filters.contactNumber}
                    onChange={(e) => setFilters({...filters, contactNumber: e.target.value})}
                    className="input-field"
                  />
                </div>

                {/* Symptoms */}
                <div>
                  <label className="label">Symptoms</label>
                  <input
                    type="text"
                    placeholder="Search by symptoms..."
                    value={filters.symptoms}
                    onChange={(e) => setFilters({...filters, symptoms: e.target.value})}
                    className="input-field"
                  />
                </div>

                {/* Diagnosis */}
                <div>
                  <label className="label">Diagnosis</label>
                  <input
                    type="text"
                    placeholder="Search by diagnosis..."
                    value={filters.diagnosis}
                    onChange={(e) => setFilters({...filters, diagnosis: e.target.value})}
                    className="input-field"
                  />
                </div>

                {/* Prescribed Medicine */}
                <div>
                  <label className="label">Prescribed Medicine</label>
                  <input
                    type="text"
                    placeholder="Search by medicine..."
                    value={filters.prescribedMedicine}
                    onChange={(e) => setFilters({...filters, prescribedMedicine: e.target.value})}
                    className="input-field"
                  />
                </div>

                {/* Doctor Notes */}
                <div>
                  <label className="label">Doctor Notes</label>
                  <input
                    type="text"
                    placeholder="Search in notes..."
                    value={filters.doctorNotes}
                    onChange={(e) => setFilters({...filters, doctorNotes: e.target.value})}
                    className="input-field"
                  />
                </div>

                {/* Visit Date Range */}
                <div>
                  <label className="label">Visit Date From</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Visit Date To</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    className="input-field"
                  />
                </div>

                {/* Doctor Name */}
                <div>
                  <label className="label">Doctor Name</label>
                  <input
                    type="text"
                    placeholder="Search by doctor..."
                    value={filters.doctorName}
                    onChange={(e) => setFilters({...filters, doctorName: e.target.value})}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="stat-card bg-gradient-to-br from-primary-50 to-blue-50">
              <p className="text-3xl font-bold text-primary-600">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Patients</p>
            </div>
            <div className="stat-card bg-gradient-to-br from-blue-50 to-cyan-50">
              <p className="text-3xl font-bold text-blue-600">{stats.male}</p>
              <p className="text-sm text-gray-600">Male</p>
            </div>
            <div className="stat-card bg-gradient-to-br from-pink-50 to-rose-50">
              <p className="text-3xl font-bold text-pink-600">{stats.female}</p>
              <p className="text-sm text-gray-600">Female</p>
            </div>
            <div className="stat-card bg-gradient-to-br from-purple-50 to-violet-50">
              <p className="text-3xl font-bold text-purple-600">{stats.other}</p>
              <p className="text-sm text-gray-600">Other</p>
            </div>
            <div className="stat-card bg-gradient-to-br from-green-50 to-emerald-50">
              <p className="text-3xl font-bold text-green-600">{stats.avgAge}</p>
              <p className="text-sm text-gray-600">Avg Age</p>
            </div>
            <div className="stat-card bg-gradient-to-br from-orange-50 to-amber-50">
              <button onClick={downloadReport} className="w-full">
                <FaFileDownload className="text-3xl text-orange-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Download CSV</p>
              </button>
            </div>
          </div>

          {/* Age Distribution */}
          <div className="card">
            <div className="card-header"><h3 className="text-lg font-bold">Age Distribution</h3></div>
            <div className="card-body">
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(stats.ageGroups).map(([group, count]) => (
                  <div key={group} className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                    <p className="text-2xl font-bold text-gray-700">{count}</p>
                    <p className="text-xs text-gray-600">Age {group}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Medicines & Symptoms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-header"><h3 className="text-lg font-bold">Top Prescribed Medicines ({stats.topMedicines.length})</h3></div>
              <div className="card-body max-h-80 overflow-y-auto">
                {stats.topMedicines.length > 0 ? (
                  <div className="space-y-2">
                    {stats.topMedicines.map(([name, count], idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                        <span className="font-medium text-gray-700">{name}</span>
                        <span className="badge badge-success">{count} times</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No medicine data</p>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3 className="text-lg font-bold">Common Symptoms ({stats.commonSymptoms.length})</h3></div>
              <div className="card-body max-h-80 overflow-y-auto">
                {stats.commonSymptoms.length > 0 ? (
                  <div className="space-y-2">
                    {stats.commonSymptoms.map(([symptom, count], idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg">
                        <span className="font-medium text-gray-700 capitalize">{symptom}</span>
                        <span className="badge badge-warning">{count} times</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No symptom data</p>
                )}
              </div>
            </div>
          </div>

          {/* Filtered Results Table */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-xl font-bold">Filtered Results ({filteredPatients.length} patients)</h3>
            </div>
            <div className="card-body">
              {filteredPatients.length > 0 ? (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Age/Gender</th>
                        <th>Contact</th>
                        <th>Symptoms</th>
                        <th>Prescribed Medicines</th>
                        <th>Visit Date</th>
                        <th>Doctor</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map((patient) => (
                        <tr key={patient.id}>
                          <td className="font-semibold">{patient.name}</td>
                          <td>{patient.age} • {patient.gender}</td>
                          <td>{patient.contactNumber || 'N/A'}</td>
                          <td className="max-w-xs truncate">{patient.symptoms || 'N/A'}</td>
                          <td>
                            {patient.prescribedMedicines && patient.prescribedMedicines.length > 0 ? (
                              <div className="text-sm">
                                {patient.prescribedMedicines.map((med, idx) => (
                                  <span key={idx} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded mr-1 mb-1 text-xs">
                                    {med.name} ({med.quantity})
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm italic">None</span>
                            )}
                          </td>
                          <td>{new Date(patient.visitDate).toLocaleDateString()}</td>
                          <td>{patient.doctor?.fullName || 'N/A'}</td>
                          <td>
                            <button 
                              onClick={() => viewPatientDetails(patient)}
                              className="text-primary-600 hover:text-primary-800"
                            >
                              <FaEye />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg mb-4">No patients match your filters</p>
                  <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Patient Details Modal */}
        {showDetailsModal && selectedPatient && (
          <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
            <div className="modal-content max-w-3xl" onClick={(e) => e.stopPropagation()}>
              <div className="card-header flex items-center justify-between">
                <h3 className="text-xl font-bold">Patient Details</h3>
                <button onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-700">
                  <FaTimes size={24} />
                </button>
              </div>
              <div className="card-body space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Patient Name</p>
                    <p className="font-semibold text-lg">{selectedPatient.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Age / Gender</p>
                    <p className="font-semibold">{selectedPatient.age} years • {selectedPatient.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Contact Number</p>
                    <p className="font-semibold">{selectedPatient.contactNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Visit Date</p>
                    <p className="font-semibold">{new Date(selectedPatient.visitDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-semibold">{selectedPatient.address || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Symptoms</p>
                  <p className="font-semibold">{selectedPatient.symptoms || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Diagnosis</p>
                  <p className="font-semibold">{selectedPatient.diagnosis || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Prescribed Medicines</p>
                  {selectedPatient.prescribedMedicines && selectedPatient.prescribedMedicines.length > 0 ? (
                    <div className="space-y-2">
                      {selectedPatient.prescribedMedicines.map((med, idx) => (
                        <div key={idx} className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                          <p className="font-bold text-lg text-green-900">{idx + 1}. {med.name}</p>
                          <p className="text-base text-gray-700 mt-1">
                            <span className="font-semibold">Quantity:</span> {med.quantity} {med.unit}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No medicines prescribed</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-600">Doctor Notes</p>
                  <p className="font-semibold">{selectedPatient.doctorNotes || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Doctor</p>
                  <p className="font-semibold">{selectedPatient.doctor?.fullName || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  );
}
