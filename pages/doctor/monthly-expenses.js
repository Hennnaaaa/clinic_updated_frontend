import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaCalendar, FaTimes, FaMoneyBillWave } from 'react-icons/fa';

export default function MonthlyExpenses() {
  const { user, isAdmin } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('all');
  
  const [formData, setFormData] = useState({
    expenseDate: new Date().toISOString().split('T')[0],
    description: '',
    amount: ''
  });

  useEffect(() => {
    fetchExpenses();
  }, [selectedYear, selectedMonth]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (selectedMonth === 'all') {
        const startDate = `${selectedYear}-01-01`;
        const endDate = `${selectedYear}-12-31`;
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      } else {
        const monthStart = `${selectedYear}-${selectedMonth.padStart(2, '0')}-01`;
        const lastDay = new Date(selectedYear, parseInt(selectedMonth), 0).getDate();
        const monthEnd = `${selectedYear}-${selectedMonth.padStart(2, '0')}-${lastDay}`;
        params.append('startDate', monthStart);
        params.append('endDate', monthEnd);
      }

      const response = await api.get(`/monthly-expenses?${params.toString()}`);
      setExpenses(response.data.expenses || []);
    } catch (error) {
      console.error('Fetch expenses error:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.expenseDate || !formData.amount) {
      toast.error('Please fill date and amount');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    try {
      if (editingExpense) {
        await api.put(`/monthly-expenses/${editingExpense.id}`, formData);
        toast.success('Expense updated');
      } else {
        await api.post('/monthly-expenses', formData);
        toast.success('Expense added');
      }
      closeModal();
      fetchExpenses();
    } catch (error) {
      console.error('Save expense error:', error);
      toast.error(error.response?.data?.error || 'Failed to save expense');
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      expenseDate: expense.expenseDate,
      description: expense.description || '',
      amount: expense.amount
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;

    try {
      await api.delete(`/monthly-expenses/${id}`);
      toast.success('Expense deleted');
      fetchExpenses();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingExpense(null);
    setFormData({
      expenseDate: new Date().toISOString().split('T')[0],
      description: '',
      amount: ''
    });
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <ProtectedRoute allowedRoles={['admin', 'doctor']}>
      <Head><title>Monthly Expenses</title></Head>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Monthly Expenses</h2>
              <p className="text-sm text-gray-600 mt-1">
                {isAdmin ? 'View and manage clinic expenses' : 'Track clinic operational costs'}
              </p>
            </div>
            {/* ONLY DOCTORS CAN ADD EXPENSES */}
            {!isAdmin && (
              <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
                <FaPlus /> Add Expense
              </button>
            )}
          </div>

          {/* Admin Notice */}
          {isAdmin && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Admin View:</strong> You can view and delete expenses, but only doctors can add or edit them.
              </p>
            </div>
          )}

          {/* Filters */}
          <div className="card">
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Year</label>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="input-field">
                    {[2024, 2025, 2026, 2027].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Month</label>
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="input-field">
                    <option value="all">All Months</option>
                    {monthNames.map((month, idx) => (
                      <option key={idx} value={String(idx + 1)}>{month}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="card bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
                  <p className="text-3xl md:text-4xl font-bold text-red-600">
                    Rs. {getTotalExpenses().toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {expenses.length} expense{expenses.length !== 1 ? 's' : ''} • {' '}
                    {selectedMonth === 'all' ? selectedYear : `${monthNames[parseInt(selectedMonth) - 1]} ${selectedYear}`}
                  </p>
                </div>
                <FaMoneyBillWave className="text-5xl md:text-6xl text-red-400" />
              </div>
            </div>
          </div>

          {/* Expenses List */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-xl font-bold">Expense Records</h3>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="spinner"></div>
                </div>
              ) : expenses.length === 0 ? (
                <div className="text-center py-12">
                  <FaMoneyBillWave className="text-5xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No expenses for selected period</p>
                  {!isAdmin && (
                    <button onClick={() => setShowModal(true)} className="btn-primary mt-4">
                      Add First Expense
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Added By</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Amount</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {expenses.map(expense => (
                        <tr key={expense.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-700">
                            <div className="flex items-center gap-2">
                              <FaCalendar className="text-gray-400 text-xs" />
                              {new Date(expense.expenseDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {expense.description || <span className="text-gray-400 italic">No description</span>}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {expense.user?.fullName || 'Unknown'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-lg font-bold text-red-600">
                              Rs. {parseFloat(expense.amount).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-2">
                              {/* ONLY DOCTORS CAN EDIT */}
                              {!isAdmin && (
                                <button 
                                  onClick={() => handleEdit(expense)} 
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit"
                                >
                                  <FaEdit />
                                </button>
                              )}
                              {/* ONLY ADMIN CAN DELETE */}
                              {isAdmin && (
                                <button 
                                  onClick={() => handleDelete(expense.id)} 
                                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete"
                                >
                                  <FaTrash />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                      <tr>
                        <td colSpan="3" className="px-4 py-4 text-right font-bold text-gray-800 text-lg">
                          Total:
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-2xl font-bold text-red-600">
                            Rs. {getTotalExpenses().toFixed(2)}
                          </span>
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add/Edit Modal - ONLY FOR DOCTORS */}
        {showModal && !isAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
              <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center">
                <h3 className="text-xl font-bold">
                  {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                </h3>
                <button 
                  onClick={closeModal} 
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="label">Date *</label>
                  <input
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label">Amount (Rs.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="input-field text-xl font-bold"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    rows="3"
                    placeholder="What is this expense for? (optional)"
                  ></textarea>
                  <p className="text-xs text-gray-500 mt-1">
                    e.g., "Office rent - January", "Electricity bill", "Staff salary"
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    {editingExpense ? 'Update' : 'Add'} Expense
                  </button>
                  <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  );
}