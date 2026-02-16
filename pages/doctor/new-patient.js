import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import { FaTrash, FaBoxOpen, FaPills, FaInfoCircle, FaMoneyBillWave, FaCalculator, FaFlask } from 'react-icons/fa';

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
    amountCharged: 0,      // Medicine charges (entered by doctor)
    extraExpenses: 0       // Lab/procedure charges (entered by doctor)
  });
  
  const [selectedMedicine, setSelectedMedicine] = useState({ 
    medicineId: '', 
    quantity: '',
    prescriptionMode: 'units'
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

  const parsePackInfo = (name) => {
    const packRegex = /^(.+?)\s*\(1 (?:pack|jar) = (\d+)\s+(\w+)\)$/i;
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
      prescriptionMode: packInfo?.hasPackInfo ? 'units' : 'packs'
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

    let quantityInUnits, quantityInPacks;
    
    if (selectedMedicine.prescriptionMode === 'units') {
      quantityInUnits = quantity;
      quantityInPacks = quantity / packInfo.packSize;
    } else {
      quantityInPacks = quantity;
      quantityInUnits = quantity * packInfo.packSize;
    }

    if (medicine.quantity < quantityInPacks) {
      const available = packInfo.hasPackInfo 
        ? `${medicine.quantity * packInfo.packSize} ${packInfo.packUnit} (${medicine.quantity} ${medicine.unit})`
        : `${medicine.quantity} ${medicine.unit}`;
      toast.error(`Insufficient stock! Only ${available} available.`);
      return;
    }

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
          baseName: packInfo.baseName,
          quantityInUnits: quantityInUnits,
          quantityInPacks: quantityInPacks,
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
      const dataToSend = {
        ...formData,
        amountCharged: formData.amountCharged || 0,
        extraExpenses: formData.extraExpenses || 0,
        prescribedMedicines: formData.prescribedMedicines.map(med => ({
          medicineId: med.medicineId,
          name: med.name,
          quantityToDeduct: med.quantityInPacks,
          quantityForDisplay: med.quantityInUnits,
          unit: med.databaseUnit,
          displayUnit: med.packUnit,
          dosage: med.prescriptionMode === 'units'
            ? `${med.quantityInUnits} ${med.packUnit}`
            : `${med.quantityInPacks} ${med.databaseUnit}`
        }))
      };

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

  // Calculate grand total
  const grandTotal = (parseFloat(formData.amountCharged) || 0) + (parseFloat(formData.extraExpenses) || 0);

  return (
    <ProtectedRoute allowedRoles={['doctor']}>
      <Head><title>New Patient - Doctor</title></Head>
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="card">
            <div className="card-header">
              <h3 className="text-xl md:text-2xl font-bold">New Patient Record</h3>
            </div>
            <form onSubmit={handleSubmit} className="card-body space-y-4 md:space-y-6">
              {/* Patient Basic Info */}
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

              {/* Medicine Prescription System - UNCHANGED, keeping your existing logic */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 md:p-4 rounded-lg border-2 border-blue-200">
                <div className="flex items-start gap-2 mb-3">
                  <FaPills className="text-blue-600 text-lg md:text-xl mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <label className="label !mb-1 text-base md:text-lg font-bold text-blue-900">
                      Prescribe Medicines *
                    </label>
                  </div>
                </div>
                
                <div className="space-y-3">
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

              {/* SEPARATE FIELDS: Medicine Charges */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 md:p-4 rounded-lg border-2 border-green-300">
                <div className="flex items-center gap-2 mb-2">
                  <FaMoneyBillWave className="text-green-600 text-lg" />
                  <label className="label !mb-0 text-base md:text-lg font-bold text-green-900">
                    Medicine Charges (Rs.)
                  </label>
                </div>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  value={formData.amountCharged} 
                  onChange={(e) => setFormData({...formData, amountCharged: parseFloat(e.target.value) || 0})} 
                  className="input-field text-lg md:text-xl font-bold" 
                  placeholder="0.00" 
                />
                <p className="text-xs md:text-sm text-green-700 mt-2">
                  💊 Total cost for prescribed medicines
                </p>
              </div>

              {/* SEPARATE FIELDS: Extra Expenses */}
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-3 md:p-4 rounded-lg border-2 border-orange-300">
                <div className="flex items-center gap-2 mb-2">
                  <FaFlask className="text-orange-600 text-lg" />
                  <label className="label !mb-0 text-base md:text-lg font-bold text-orange-900">
                    Extra Expenses (Rs.)
                  </label>
                </div>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  value={formData.extraExpenses} 
                  onChange={(e) => setFormData({...formData, extraExpenses: parseFloat(e.target.value) || 0})} 
                  className="input-field text-lg md:text-xl font-bold" 
                  placeholder="0.00" 
                />
                <p className="text-xs md:text-sm text-orange-700 mt-2">
                  🔬 Lab tests, procedures, medical supplies, etc.
                </p>
              </div>

              {/* TOTAL DISPLAY: Shows Sum of Both Fields */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 md:p-4 rounded-lg border-2 border-blue-300">
                <h3 className="text-base md:text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <FaCalculator className="text-blue-600" />
                  Bill Summary
                </h3>
                <div className="space-y-2 text-sm md:text-base">
                  <div className="flex justify-between items-center p-2 bg-white rounded">
                    <span className="text-gray-700 font-medium">💊 Medicine Charges:</span>
                    <span className="font-semibold text-green-600">Rs. {(formData.amountCharged || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded">
                    <span className="text-gray-700 font-medium">🔬 Extra Expenses:</span>
                    <span className="font-semibold text-orange-600">Rs. {(formData.extraExpenses || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded border-t-2 border-blue-400">
                    <span className="font-bold text-blue-900 text-base md:text-lg">💰 Grand Total:</span>
                    <span className="font-bold text-blue-600 text-lg md:text-2xl">Rs. {grandTotal.toFixed(2)}</span>
                  </div>
                </div>
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