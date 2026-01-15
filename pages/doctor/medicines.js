import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import api from '../../utils/api';
import { FaSearch, FaBoxOpen } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function DoctorMedicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredMedicines = medicines.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute allowedRoles={['doctor']}>
      <Head><title>Medicines - Doctor</title></Head>
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

          {/* Search Bar */}
          <div className="w-full md:max-w-md">
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

          {loading ? (
            <div className="flex justify-center py-12"><div className="spinner"></div></div>
          ) : (
            <div className="card">
              {/* Table with Horizontal Scroll - Works on Mobile & Desktop */}
              <div className="overflow-x-auto overflow-y-visible">
                <table className="w-full" style={{ minWidth: '700px' }}>
                  <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <tr>
                      <th className="px-3 md:px-4 py-3 md:py-4 text-left text-sm md:text-base font-semibold whitespace-nowrap">Medicine Name</th>
                      <th className="px-3 md:px-4 py-3 md:py-4 text-left text-sm md:text-base font-semibold whitespace-nowrap">Category</th>
                      <th className="px-3 md:px-4 py-3 md:py-4 text-left text-sm md:text-base font-semibold whitespace-nowrap">Quantity Available</th>
                      <th className="px-3 md:px-4 py-3 md:py-4 text-left text-sm md:text-base font-semibold whitespace-nowrap">Pack Info</th>
                      <th className="px-3 md:px-4 py-3 md:py-4 text-left text-sm md:text-base font-semibold whitespace-nowrap">Status</th>
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
                              <span className="badge badge-error text-xs md:text-sm whitespace-nowrap">Out of Stock</span>
                            ) : medicine.quantity <= medicine.reorderLevel ? (
                              <span className="badge badge-warning text-xs md:text-sm whitespace-nowrap">Low Stock</span>
                            ) : (
                              <span className="badge badge-success text-xs md:text-sm whitespace-nowrap">Available</span>
                            )}
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
        </div>
      </Layout>
    </ProtectedRoute>
  );
}