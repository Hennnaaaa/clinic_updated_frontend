import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import api from '../../utils/api';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaBoxOpen } from 'react-icons/fa';
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
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-12"
              />
            </div>
            <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary">
              <FaPlus className="inline mr-2" /> Add Medicine
            </button>
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
                      <th>Category</th>
                      <th>Quantity</th>
                      <th>Pack Info</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMedicines.map((medicine) => {
                      const packInfo = parsePackInfo(medicine.name);
                      const totalUnits = packInfo.hasPackInfo ? medicine.quantity * packInfo.packSize : null;
                      
                      return (
                        <tr key={medicine.id}>
                          <td>
                            <div>
                              <p className="font-semibold">{packInfo.baseName}</p>
                              {packInfo.hasPackInfo && (
                                <p className="text-xs text-blue-600 mt-1">
                                  <FaBoxOpen className="inline mr-1" />
                                  {packInfo.packSize} {packInfo.packUnit}/pack
                                </p>
                              )}
                            </div>
                          </td>
                          <td><span className="badge badge-info">{medicine.category}</span></td>
                          <td>
                            <div>
                              <p className="font-bold">{medicine.quantity} {medicine.unit}</p>
                              {totalUnits && (
                                <p className="text-xs text-gray-600">
                                  ({totalUnits.toLocaleString()} {packInfo.packUnit} total)
                                </p>
                              )}
                            </div>
                          </td>
                          <td>
                            {packInfo.hasPackInfo ? (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                Pack Size: {packInfo.packSize}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td>
                            {medicine.quantity === 0 ? (
                              <span className="badge badge-error">Out of Stock</span>
                            ) : medicine.quantity <= medicine.reorderLevel ? (
                              <span className="badge badge-warning">Low Stock</span>
                            ) : (
                              <span className="badge badge-success">In Stock</span>
                            )}
                          </td>
                          <td className="space-x-2">
                            <button onClick={() => handleEdit(medicine)} className="text-primary-600 hover:text-primary-800">
                              <FaEdit />
                            </button>
                            <button onClick={() => handleDelete(medicine.id)} className="text-red-600 hover:text-red-800">
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {showModal && (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="card-header">
                  <h3 className="text-xl font-bold">{editingMedicine ? 'Edit Medicine' : 'Add Medicine'}</h3>
                </div>
                <form onSubmit={handleSubmit} className="card-body space-y-4">
                  <div>
                    <label className="label">Medicine Name</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input-field" required />
                    <p className="text-xs text-gray-500 mt-1">
                      Tip: For packaged medicines, use format: "Name (1 pack = X units)"<br />
                      Example: "Tab Panadol (1 pack = 200 tablets)"
                    </p>
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="input-field" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Quantity</label>
                      <input type="number" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})} className="input-field" required />
                    </div>
                    <div>
                      <label className="label">Unit</label>
                      <input type="text" value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="input-field" required />
                      <p className="text-xs text-gray-500 mt-1">
                        e.g., packs, bottles, tablets
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="label">Reorder Level</label>
                    <input type="number" value={formData.reorderLevel} onChange={(e) => setFormData({...formData, reorderLevel: parseInt(e.target.value)})} className="input-field" required />
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="input-field" rows="3"></textarea>
                  </div>
                  <div className="flex gap-4">
                    <button type="submit" className="btn-primary flex-1">Save</button>
                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
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