import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

export default function NewPatient() {
  const router = useRouter();
  const [medicines, setMedicines] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    contactNumber: '',
    address: '',
    symptoms: '',
    diagnosis: '',
    prescribedMedicines: [],
    doctorNotes: '',
    followUpDate: '',
    amountCharged: 0  // NEW FIELD
  });
  const [selectedMedicine, setSelectedMedicine] = useState({ 
    medicineId: '', 
    quantity: 1 
  });

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await api.get('/medicines');
      setMedicines(response.data);
    } catch (error) {
      toast.error('Failed to load medicines');
    }
  };

  // Parse pack info from medicine name
  const parsePackInfo = (name) => {
    const packRegex = /^(.+?)\s*\(1 pack = (\d+)\s+(\w+)\)$/i;
    const match = name.match(packRegex);
    
    if (match) {
      return {
        baseName: match[1].trim(),
        packSize: parseInt(match[2]),
        packUnit: match[3],
        hasPackInfo: true
      };
    }
    
    return {
      baseName: name,
      hasPackInfo: false
    };
  };

  const handleAddMedicine = () => {
    if (!selectedMedicine.medicineId || !selectedMedicine.quantity) {
      toast.error('Please select medicine and enter quantity');
      return;
    }

    const medicine = medicines.find(m => m.id === parseInt(selectedMedicine.medicineId));
    
    if (!medicine) {
      toast.error('Medicine not found');
      return;
    }

    // Check if enough stock available
    const requestedQty = parseInt(selectedMedicine.quantity);
    if (medicine.quantity < requestedQty) {
      toast.error(`Insufficient stock! Only ${medicine.quantity} ${medicine.unit} available.`);
      return;
    }

    // Check if medicine already added
    const alreadyAdded = formData.prescribedMedicines.find(m => m.medicineId === medicine.id);
    if (alreadyAdded) {
      toast.error('This medicine is already added. Remove it first to change quantity.');
      return;
    }
    
    setFormData({
      ...formData,
      prescribedMedicines: [
        ...formData.prescribedMedicines,
        {
          medicineId: medicine.id,
          name: medicine.name,
          quantity: requestedQty,
          unit: medicine.unit
        }
      ]
    });
    
    setSelectedMedicine({ medicineId: '', quantity: 1 });
    toast.success(`${medicine.name} added to prescription`);
  };

  const handleRemoveMedicine = (index) => {
    const removed = formData.prescribedMedicines[index];
    const newMedicines = formData.prescribedMedicines.filter((_, i) => i !== index);
    setFormData({ ...formData, prescribedMedicines: newMedicines });
    toast.info(`${removed.name} removed from prescription`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.prescribedMedicines.length === 0) {
      toast.error('Please prescribe at least one medicine');
      return;
    }

    try {
      await api.post('/patients', formData);
      toast.success('Patient record created successfully! Inventory updated.');
      router.push('/doctor/patients');
    } catch (error) {
      console.error('Create patient error:', error);
      toast.error(error.response?.data?.error || 'Failed to create patient record');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['doctor']}>
      <Head><title>New Patient - Doctor</title></Head>
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="card">
            <div className="card-header">
              <h3 className="text-2xl font-bold">New Patient Record</h3>
              <p className="text-sm text-gray-600 mt-1">Fill in patient details and prescribe medicines (inventory will update automatically)</p>
            </div>
            <form onSubmit={handleSubmit} className="card-body space-y-6">
              {/* Patient Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Patient Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input-field" required />
                </div>
                <div>
                  <label className="label">Age *</label>
                  <input type="number" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} className="input-field" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Gender *</label>
                  <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="input-field" required>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Contact Number</label>
                  <input type="tel" value={formData.contactNumber} onChange={(e) => setFormData({...formData, contactNumber: e.target.value})} className="input-field" />
                </div>
              </div>

              <div>
                <label className="label">Address</label>
                <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="input-field" rows="2"></textarea>
              </div>

              <div>
                <label className="label">Symptoms *</label>
                <textarea value={formData.symptoms} onChange={(e) => setFormData({...formData, symptoms: e.target.value})} className="input-field" rows="3" required></textarea>
              </div>

              <div>
                <label className="label">Diagnosis</label>
                <textarea value={formData.diagnosis} onChange={(e) => setFormData({...formData, diagnosis: e.target.value})} className="input-field" rows="3"></textarea>
              </div>

              {/* Prescribed Medicines */}
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <label className="label text-lg font-bold text-blue-900">Prescribe Medicines * (Stock will be deducted automatically)</label>
                <p className="text-sm text-gray-600 mb-3">Select medicine and enter quantity to prescribe</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <select 
                    value={selectedMedicine.medicineId} 
                    onChange={(e) => setSelectedMedicine({ medicineId: e.target.value, quantity: 1 })} 
                    className="input-field text-lg"
                  >
                    <option value="">-- Select Medicine --</option>
                    {medicines.map(med => {
                      const packInfo = parsePackInfo(med.name);
                      return (
                        <option key={med.id} value={med.id} disabled={med.quantity === 0}>
                          {packInfo.baseName} - Stock: {med.quantity} {med.unit}
                          {packInfo.hasPackInfo && ` (${packInfo.packSize} ${packInfo.packUnit}/pack)`}
                          {med.quantity === 0 ? ' (OUT OF STOCK)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  
                  <input 
                    type="number" 
                    placeholder="Enter Quantity" 
                    min="1"
                    value={selectedMedicine.quantity} 
                    onChange={(e) => setSelectedMedicine({...selectedMedicine, quantity: e.target.value})} 
                    className="input-field text-lg" 
                  />
                  
                  <button 
                    type="button" 
                    onClick={handleAddMedicine} 
                    className="btn-primary text-lg font-bold"
                    disabled={!selectedMedicine.medicineId}
                  >
                    + Add Medicine
                  </button>
                </div>
                
                {formData.prescribedMedicines.length > 0 ? (
                  <div className="space-y-2 mt-4">
                    <p className="font-semibold text-green-700">✅ Prescribed Medicines ({formData.prescribedMedicines.length}):</p>
                    {formData.prescribedMedicines.map((med, idx) => {
                      const packInfo = parsePackInfo(med.name);
                      const totalUnits = packInfo.hasPackInfo ? med.quantity * packInfo.packSize : null;
                      
                      return (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-green-300 shadow-sm">
                          <div>
                            <p className="font-bold text-lg text-gray-800">
                              {idx + 1}. {packInfo.baseName}
                            </p>
                            {packInfo.hasPackInfo && (
                              <p className="text-sm text-blue-600 font-medium mt-1">
                                📦 {packInfo.packSize} {packInfo.packUnit} per pack
                              </p>
                            )}
                            <p className="text-base text-gray-600 mt-1">
                              <span className="font-semibold text-green-700">
                                Quantity: {med.quantity} {med.unit}
                              </span>
                              {totalUnits && (
                                <span className="ml-2 text-blue-700 font-bold">
                                  (Total: {totalUnits} {packInfo.packUnit})
                                </span>
                              )}
                              <span className="text-xs ml-2 text-gray-500">(Will be deducted from stock)</span>
                            </p>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveMedicine(idx)} 
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-500">No medicines prescribed yet. Add at least one medicine.</p>
                  </div>
                )}
              </div>

              {/* NEW: Amount Charged Field */}
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                <label className="label text-lg font-bold text-green-900">Amount Charged (Rs.)</label>
                <p className="text-sm text-gray-600 mb-2">Enter the total amount charged to the patient</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-green-700">Rs.</span>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={formData.amountCharged} 
                    onChange={(e) => setFormData({...formData, amountCharged: parseFloat(e.target.value) || 0})} 
                    className="input-field text-xl font-bold" 
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">This amount will be recorded in the patient's record</p>
              </div>

              <div>
                <label className="label">Doctor Notes</label>
                <textarea value={formData.doctorNotes} onChange={(e) => setFormData({...formData, doctorNotes: e.target.value})} className="input-field" rows="3"></textarea>
              </div>

              <div>
                <label className="label">Follow-up Date</label>
                <input type="date" value={formData.followUpDate} onChange={(e) => setFormData({...formData, followUpDate: e.target.value})} className="input-field" />
              </div>

              <div className="flex gap-4">
                <button type="submit" className="btn-primary flex-1">Save Patient Record</button>
                <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}