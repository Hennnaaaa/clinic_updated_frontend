import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import { FaTrash, FaBoxOpen, FaPills, FaInfoCircle } from 'react-icons/fa';

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
    amountCharged: ''  // FIXED: Empty string instead of 0
  });
  
  const [selectedMedicine, setSelectedMedicine] = useState({ 
    medicineId: '', 
    quantity: '',
    prescriptionMode: 'units' // 'units' (tablets/sachets) or 'packs' (jars/packs)
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
    const packRegex = /^(.+?)\s*\(1 (?:pack|jar) = (\d+)\s+(\w+)\)$/i;
    const match = name.match(packRegex);
    
    if (match) {
      return {
        baseName: match[1].trim(),
        packSize: parseInt(match[2]),
        packUnit: match[3], // tablets, sachets, capsules, etc.
        hasPackInfo: true
      };
    }
    
    return {
      baseName: name,
      hasPackInfo: false,
      packSize: 1,
      packUnit: 'unit'
    };
  };

  const handleMedicineSelect = (medicineId) => {
    const medicine = medicines.find(m => m.id === parseInt(medicineId));
    const packInfo = medicine ? parsePackInfo(medicine.name) : null;
    
    setSelectedMedicine({
      medicineId: medicineId,
      quantity: '',
      prescriptionMode: packInfo?.hasPackInfo ? 'units' : 'packs' // Default to units if pack info exists
    });
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

    const packInfo = parsePackInfo(medicine.name);
    const quantity = parseFloat(selectedMedicine.quantity);
    
    if (quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    // Calculate quantities based on prescription mode
    let quantityInUnits, quantityInPacks;
    
    if (selectedMedicine.prescriptionMode === 'units') {
      // Doctor prescribed in tablets/sachets
      quantityInUnits = quantity;
      quantityInPacks = quantity / packInfo.packSize; // Exact decimal for database
    } else {
      // Doctor prescribed in packs/jars
      quantityInPacks = quantity;
      quantityInUnits = quantity * packInfo.packSize;
    }

    // Check stock availability
    if (medicine.quantity < quantityInPacks) {
      const available = packInfo.hasPackInfo 
        ? `${medicine.quantity * packInfo.packSize} ${packInfo.packUnit} (${medicine.quantity} ${medicine.unit})`
        : `${medicine.quantity} ${medicine.unit}`;
      toast.error(`Insufficient stock! Only ${available} available.`);
      return;
    }

    // Check if medicine already added
    const alreadyAdded = formData.prescribedMedicines.find(m => m.medicineId === medicine.id);
    if (alreadyAdded) {
      toast.error('This medicine is already added. Remove it first to change quantity.');
      return;
    }
    
    // Add medicine
    setFormData({
      ...formData,
      prescribedMedicines: [
        ...formData.prescribedMedicines,
        {
          medicineId: medicine.id,
          name: medicine.name,
          baseName: packInfo.baseName,
          quantityInUnits: quantityInUnits, // For prescription display
          quantityInPacks: quantityInPacks, // For database deduction
          prescriptionMode: selectedMedicine.prescriptionMode,
          packUnit: packInfo.packUnit,
          databaseUnit: medicine.unit,
          packSize: packInfo.packSize,
          hasPackInfo: packInfo.hasPackInfo
        }
      ]
    });
    
    setSelectedMedicine({ medicineId: '', quantity: '', prescriptionMode: 'units' });
    
    const modeText = selectedMedicine.prescriptionMode === 'units' 
      ? `${quantityInUnits} ${packInfo.packUnit}`
      : `${quantityInPacks} ${medicine.unit}`;
    toast.success(`${packInfo.baseName}: ${modeText} added to prescription`);
  };

  const handleRemoveMedicine = (index) => {
    const removed = formData.prescribedMedicines[index];
    const newMedicines = formData.prescribedMedicines.filter((_, i) => i !== index);
    setFormData({ ...formData, prescribedMedicines: newMedicines });
    toast.info(`${removed.baseName} removed from prescription`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.prescribedMedicines.length === 0) {
      toast.error('Please prescribe at least one medicine');
      return;
    }

    try {
      // Send exact decimal quantities to backend
      const dataToSend = {
        ...formData,
        amountCharged: formData.amountCharged === '' ? 0 : Number(formData.amountCharged),  // FIXED: Convert properly
        prescribedMedicines: formData.prescribedMedicines.map(med => ({
          medicineId: med.medicineId,
          name: med.name,
          quantityToDeduct: med.quantityInPacks, // DECIMAL quantity for database (e.g., 0.1 packs)
          quantityForDisplay: med.quantityInUnits, // What patient receives
          unit: med.databaseUnit, // Database unit (packs/jars)
          displayUnit: med.packUnit, // Display unit (tablets/sachets)
          dosage: med.prescriptionMode === 'units'
            ? `${med.quantityInUnits} ${med.packUnit}`
            : `${med.quantityInPacks} ${med.databaseUnit}`
        }))
      };

      console.log('Sending to backend:', dataToSend.prescribedMedicines);

      await api.post('/patients', dataToSend);
      toast.success('Patient record created successfully! Inventory updated.');
      router.push('/doctor/patients');
    } catch (error) {
      console.error('Create patient error:', error);
      toast.error(error.response?.data?.error || 'Failed to create patient record');
    }
  };

  const getSelectedMedicineObj = () => {
    if (!selectedMedicine.medicineId) return null;
    return medicines.find(m => m.id === parseInt(selectedMedicine.medicineId));
  };

  const selectedMedObj = getSelectedMedicineObj();
  const selectedPackInfo = selectedMedObj ? parsePackInfo(selectedMedObj.name) : null;

  return (
    <ProtectedRoute allowedRoles={['doctor']}>
      <Head><title>New Patient - Doctor</title></Head>
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="card">
            <div className="card-header">
              <h3 className="text-xl md:text-2xl font-bold">New Patient Record</h3>
              <p className="text-xs md:text-sm text-gray-600 mt-1">
                Prescribe medicines in tablets/sachets OR packs/jars - your choice!
              </p>
            </div>
            <form onSubmit={handleSubmit} className="card-body space-y-4 md:space-y-6">
              {/* Patient Basic Info - Same as before */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="label">Patient Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input-field" required />
                </div>
                <div>
                  <label className="label">Age *</label>
                  <input type="number" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} className="input-field" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
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

              {/* UNIVERSAL PRESCRIPTION SYSTEM */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 md:p-4 rounded-lg border-2 border-blue-200">
                <div className="flex items-start gap-2 mb-3">
                  <FaPills className="text-blue-600 text-lg md:text-xl mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <label className="label !mb-1 text-base md:text-lg font-bold text-blue-900">
                      Prescribe Medicines *
                    </label>
                    <div className="flex items-start gap-2 bg-blue-100 p-2 rounded-lg mt-2">
                      <FaInfoCircle className="text-blue-700 mt-0.5 flex-shrink-0 text-sm" />
                      <p className="text-xs text-blue-800">
                        <strong>Flexible Prescription:</strong> Choose to prescribe in individual units (tablets/sachets) OR in packs/jars. System handles both!
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {/* Medicine Selection */}
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Select Medicine</label>
                    <select value={selectedMedicine.medicineId} onChange={(e) => handleMedicineSelect(e.target.value)} className="input-field text-sm md:text-base">
                      <option value="">-- Select Medicine --</option>
                      {medicines.map(med => {
                        const packInfo = parsePackInfo(med.name);
                        return (
                          <option key={med.id} value={med.id} disabled={med.quantity === 0}>
                            {packInfo.baseName} - Stock: {med.quantity} {med.unit}
                            {packInfo.hasPackInfo && ` (${(med.quantity * packInfo.packSize).toFixed(1)} ${packInfo.packUnit})`}
                            {med.quantity === 0 ? ' - OUT OF STOCK' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Stock Info */}
                  {selectedMedObj && selectedPackInfo && (
                    <div className="bg-white p-3 rounded-lg border-2 border-blue-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm">
                        <div className="flex items-center gap-2">
                          <FaBoxOpen className="text-blue-600 flex-shrink-0" />
                          <div>
                            <span className="font-semibold text-gray-700">In Stock: </span>
                            <span className="text-blue-700 font-bold">{selectedMedObj.quantity} {selectedMedObj.unit}</span>
                          </div>
                        </div>
                        {selectedPackInfo.hasPackInfo && (
                          <>
                            <div className="flex items-center gap-2">
                              <FaPills className="text-green-600 flex-shrink-0" />
                              <div>
                                <span className="font-semibold text-gray-700">Total: </span>
                                <span className="text-green-700 font-bold">
                                  {(selectedMedObj.quantity * selectedPackInfo.packSize).toFixed(1)} {selectedPackInfo.packUnit}
                                </span>
                              </div>
                            </div>
                            <div className="col-span-full bg-blue-50 p-2 rounded">
                              <p className="text-blue-800 text-xs">
                                📦 Pack Size: 1 {selectedMedObj.unit} = {selectedPackInfo.packSize} {selectedPackInfo.packUnit}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Prescription Mode Selection */}
                  {selectedMedObj && selectedPackInfo?.hasPackInfo && (
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Prescribe In:</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedMedicine({...selectedMedicine, prescriptionMode: 'units', quantity: ''})}
                          className={`p-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                            selectedMedicine.prescriptionMode === 'units'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                          }`}
                        >
                          <FaPills className="mx-auto mb-1 text-lg" />
                          {selectedPackInfo.packUnit.charAt(0).toUpperCase() + selectedPackInfo.packUnit.slice(1)}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedMedicine({...selectedMedicine, prescriptionMode: 'packs', quantity: ''})}
                          className={`p-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                            selectedMedicine.prescriptionMode === 'packs'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                          }`}
                        >
                          <FaBoxOpen className="mx-auto mb-1 text-lg" />
                          {selectedMedObj.unit.charAt(0).toUpperCase() + selectedMedObj.unit.slice(1)}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quantity Input */}
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                      Quantity{' '}
                      {selectedMedObj && (
                        <span className="text-blue-600">
                          (in {selectedMedicine.prescriptionMode === 'units' ? selectedPackInfo?.packUnit : selectedMedObj.unit})
                        </span>
                      )}
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        placeholder="Enter quantity"
                        min="0.01"
                        step="0.01"
                        value={selectedMedicine.quantity} 
                        onChange={(e) => setSelectedMedicine({...selectedMedicine, quantity: e.target.value})} 
                        className="input-field flex-1 text-sm md:text-base" 
                        disabled={!selectedMedicine.medicineId}
                      />
                      <button 
                        type="button" 
                        onClick={handleAddMedicine} 
                        className="btn-primary text-sm md:text-base font-bold whitespace-nowrap px-4 md:px-6"
                        disabled={!selectedMedicine.medicineId || !selectedMedicine.quantity}
                      >
                        + Add
                      </button>
                    </div>
                    {selectedMedObj && selectedMedicine.quantity && selectedPackInfo?.hasPackInfo && (
                      <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        {selectedMedicine.prescriptionMode === 'units' ? (
                          <p>
                            Will deduct: <strong>{(parseFloat(selectedMedicine.quantity) / selectedPackInfo.packSize).toFixed(2)} {selectedMedObj.unit}</strong> from inventory
                          </p>
                        ) : (
                          <p>
                            Patient receives: <strong>{(parseFloat(selectedMedicine.quantity) * selectedPackInfo.packSize).toFixed(1)} {selectedPackInfo.packUnit}</strong>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Prescribed List */}
                {formData.prescribedMedicines.length > 0 ? (
                  <div className="space-y-2 mt-4">
                    <p className="font-semibold text-green-700 text-sm md:text-base">
                      ✅ Prescribed Medicines ({formData.prescribedMedicines.length}):
                    </p>
                    {formData.prescribedMedicines.map((med, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 md:p-4 bg-white rounded-lg border-2 border-green-300 shadow-sm">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm md:text-lg text-gray-800 break-words">
                            {idx + 1}. {med.baseName}
                          </p>
                          {med.hasPackInfo && (
                            <p className="text-xs md:text-sm text-blue-600 font-medium mt-1">
                              📦 {med.packSize} {med.packUnit}/{med.databaseUnit}
                            </p>
                          )}
                          <div className="mt-2 space-y-1">
                            <p className="text-xs md:text-sm font-bold text-green-700">
                              ➜ Patient: {med.quantityInUnits.toFixed(med.quantityInUnits % 1 === 0 ? 0 : 1)} {med.packUnit}
                            </p>
                            <p className="text-xs md:text-sm font-semibold text-orange-600">
                              ➜ Deduct: {med.quantityInPacks.toFixed(2)} {med.databaseUnit}
                            </p>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveMedicine(idx)} 
                          className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 md:px-4 py-2 rounded-lg font-semibold text-sm transition-colors w-full md:w-auto min-h-[44px]"
                        >
                          <FaTrash className="text-sm" />
                          <span>Remove</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 md:py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 mt-4">
                    <p className="text-gray-500 text-xs md:text-sm">No medicines prescribed yet</p>
                  </div>
                )}
              </div>

              {/* Amount Charged - COMPLETELY FIXED */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 md:p-4 rounded-lg border-2 border-green-300">
                <label className="label text-base md:text-lg font-bold text-green-900">Amount Charged (Rs.)</label>
                <input 
                  type="text"
                  inputMode="decimal"
                  value={formData.amountCharged} 
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow only numbers and decimal point
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setFormData({...formData, amountCharged: value});
                    }
                  }} 
                  className="input-field text-lg md:text-xl font-bold" 
                  placeholder="0.00" 
                />
              </div>

              <div>
                <label className="label">Doctor Notes</label>
                <textarea value={formData.doctorNotes} onChange={(e) => setFormData({...formData, doctorNotes: e.target.value})} className="input-field" rows="3"></textarea>
              </div>

              <div>
                <label className="label">Follow-up Date</label>
                <input type="date" value={formData.followUpDate} onChange={(e) => setFormData({...formData, followUpDate: e.target.value})} className="input-field" />
              </div>

              <div className="flex flex-col md:flex-row gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">Save Patient Record</button>
                <button type="button" onClick={() => router.back()} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}