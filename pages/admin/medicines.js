import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import api from '../../utils/api';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaBoxOpen, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function AdminMedicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 0,
    unit: 'units',
    reorderLevel: 10,
    description: ''
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
    } finally {
      setLoading(false);
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
        packUnit: match[3],
        hasPackInfo: true
      };
    }
    
    return {
      baseName: name,
      hasPackInfo: false
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMedicine) {
        await api.put(`/medicines/${editingMedicine.id}`, formData);
        toast.success('Medicine updated successfully');
      } else {
        await api.post('/medicines', formData);
        toast.success('Medicine added successfully');
      }
      setShowModal(false);
      resetForm();
      fetchMedicines();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      try {
        await api.delete(`/medicines/${id}`);
        toast.success('Medicine deleted successfully');
        fetchMedicines();
      } catch (error) {
        toast.error('Failed to delete medicine');
      }
    }
  };

  const handleEdit = (medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      name: medicine.name,
      category: medicine.category,
      quantity: medicine.quantity,
      unit: medicine.unit,
      reorderLevel: medicine.reorderLevel,
      description: medicine.description || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingMedicine(null);
    setFormData({
      name: '',
      category: '',
      quantity: 0,
      unit: 'units',
      reorderLevel: 10,
      description: ''
    });
  };

  const filteredMedicines = medicines.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Head>
        <title>Medicine Inventory - Admin</title>
      </Head>
      
      <Layout>
        <div className="space-y-4 md:space-y-6">
          {/* Header with Total Count */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Medicine Inventory</h1>
            <p className="text-sm md:text-base text-gray-600">
              Total Medicines: <span className="font-bold text-blue-600">{filteredMedicines.length}</span>
              {searchTerm && ` (filtered from ${medicines.length})`}
            </p>
          </div>

          {/* Search & Add Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
            <div className="w-full sm:flex-1 sm:max-w-md">
              <div className="relative">
                <FaSearch className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm md:text-base" />
                <input
                  type="text"
                  placeholder="Search medicines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10 md:pl-12 text-sm md:text-base w-full"
                />
              </div>
            </div>
            <button 
              onClick={() => { resetForm(); setShowModal(true); }} 
              className="btn-primary w-full sm:w-auto text-sm md:text-base whitespace-nowrap"
            >
              <FaPlus className="inline mr-2" /> Add Medicine
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="spinner"></div></div>
          ) : (
            <div className="card">
              {/* Table with Horizontal Scroll - Works on Mobile & Desktop */}
              <div className="overflow-x-auto overflow-y-visible">
                <table className="w-full" style={{ minWidth: '800px' }}>
                  <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <tr>
                      <th className="px-3 md:px-4 py-3 md:py-4 text-left text-sm md:text-base font-semibold whitespace-nowrap">Name</th>
                      <th className="px-3 md:px-4 py-3 md:py-4 text-left text-sm md:text-base font-semibold whitespace-nowrap">Category</th>
                      <th className="px-3 md:px-4 py-3 md:py-4 text-left text-sm md:text-base font-semibold whitespace-nowrap">Quantity</th>
                      <th className="px-3 md:px-4 py-3 md:py-4 text-left text-sm md:text-base font-semibold whitespace-nowrap">Pack Info</th>
                      <th className="px-3 md:px-4 py-3 md:py-4 text-left text-sm md:text-base font-semibold whitespace-nowrap">Status</th>
                      <th className="px-3 md:px-4 py-3 md:py-4 text-left text-sm md:text-base font-semibold whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredMedicines.map((medicine) => {
                      const packInfo = parsePackInfo(medicine.name);
                      const totalUnits = packInfo.hasPackInfo ? medicine.quantity * packInfo.packSize : null;
                      
                      return (
                        <tr key={medicine.id} className="hover:bg-gray-50">
                          <td className="px-3 md:px-4 py-3 md:py-4">
                            <div>
                              <p className="font-semibold text-gray-800 text-sm md:text-base">{packInfo.baseName}</p>
                              {packInfo.hasPackInfo && (
                                <p className="text-xs text-blue-600 mt-1">
                                  <FaBoxOpen className="inline mr-1" />
                                  {packInfo.packSize} {packInfo.packUnit}/pack
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-3 md:px-4 py-3 md:py-4">
                            <span className="badge badge-info text-xs md:text-sm">{medicine.category}</span>
                          </td>
                          <td className="px-3 md:px-4 py-3 md:py-4">
                            <div>
                              <p className="font-bold text-sm md:text-base">{medicine.quantity} {medicine.unit}</p>
                              {totalUnits && (
                                <p className="text-xs text-gray-600">
                                  ({totalUnits.toLocaleString()} {packInfo.packUnit})
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-3 md:px-4 py-3 md:py-4">
                            {packInfo.hasPackInfo ? (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded whitespace-nowrap">
                                {packInfo.packSize}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 md:px-4 py-3 md:py-4">
                            {medicine.quantity === 0 ? (
                              <span className="badge badge-error text-xs md:text-sm whitespace-nowrap">Out</span>
                            ) : medicine.quantity <= medicine.reorderLevel ? (
                              <span className="badge badge-warning text-xs md:text-sm whitespace-nowrap">Low</span>
                            ) : (
                              <span className="badge badge-success text-xs md:text-sm whitespace-nowrap">OK</span>
                            )}
                          </td>
                          <td className="px-3 md:px-4 py-3 md:py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleEdit(medicine)} 
                                className="text-primary-600 hover:text-primary-800 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                title="Edit"
                              >
                                <FaEdit className="text-base md:text-lg" />
                              </button>
                              <button 
                                onClick={() => handleDelete(medicine.id)} 
                                className="text-red-600 hover:text-red-800 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                title="Delete"
                              >
                                <FaTrash className="text-base md:text-lg" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Empty State */}
              {filteredMedicines.length === 0 && (
                <div className="text-center py-12 px-4">
                  <p className="text-gray-500 text-sm md:text-base">No medicines found</p>
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="mt-4 text-blue-600 hover:text-blue-800 text-sm md:text-base"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Add/Edit Modal - Mobile Optimized */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-center rounded-t-lg">
                  <h3 className="text-lg md:text-xl font-bold">
                    {editingMedicine ? 'Edit Medicine' : 'Add Medicine'}
                  </h3>
                  <button 
                    onClick={() => setShowModal(false)} 
                    className="text-white hover:text-gray-200"
                  >
                    <FaTimes className="text-xl" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div>
                    <label className="label text-sm md:text-base">Medicine Name *</label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      className="input-field text-sm md:text-base" 
                      required 
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tip: For packaged medicines, use format: "Name (1 pack = X units)"<br />
                      Example: "Tab Panadol (1 pack = 200 tablets)"
                    </p>
                  </div>

                  <div>
                    <label className="label text-sm md:text-base">Category *</label>
                    <input 
                      type="text" 
                      value={formData.category} 
                      onChange={(e) => setFormData({...formData, category: e.target.value})} 
                      className="input-field text-sm md:text-base" 
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label text-sm md:text-base">Quantity *</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={formData.quantity} 
                        onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})} 
                        className="input-field text-sm md:text-base" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="label text-sm md:text-base">Unit *</label>
                      <input 
                        type="text" 
                        value={formData.unit} 
                        onChange={(e) => setFormData({...formData, unit: e.target.value})} 
                        className="input-field text-sm md:text-base" 
                        required 
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        e.g., packs, jars, bottles
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="label text-sm md:text-base">Reorder Level *</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.reorderLevel} 
                      onChange={(e) => setFormData({...formData, reorderLevel: parseFloat(e.target.value) || 0})} 
                      className="input-field text-sm md:text-base" 
                      required 
                    />
                  </div>

                  <div>
                    <label className="label text-sm md:text-base">Description</label>
                    <textarea 
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})} 
                      className="input-field text-sm md:text-base" 
                      rows="3"
                    ></textarea>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3 pt-4">
                    <button type="submit" className="btn-primary flex-1 text-sm md:text-base order-1">
                      {editingMedicine ? 'Update Medicine' : 'Add Medicine'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowModal(false)} 
                      className="btn-secondary flex-1 text-sm md:text-base order-2"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}