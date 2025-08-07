import React, { useState, useEffect } from 'react';
import { ref, onValue, set, push, remove } from 'firebase/database';
import { database } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { Employee, StockGroup, User } from '../../types';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  UserCheck, 
  UserX,
  Shield,
  Briefcase,
  Phone,
  Mail
} from 'lucide-react';
import toast from 'react-hot-toast';

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stockGroups, setStockGroups] = useState<StockGroup[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    userId: '',
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    assignedStockGroups: [] as string[],
    permissions: {
      canManageInventory: true,
      canViewReports: true,
      canProcessOrders: false,
    },
    isActive: true,
  });

  useEffect(() => {
    // Load employees
    const employeesRef = ref(database, 'employees');
    const unsubscribeEmployees = onValue(employeesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const employeesList: Employee[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        }));
        setEmployees(employeesList);
      }
    });

    // Load stock groups
    const stockGroupsRef = ref(database, 'stockGroups');
    const unsubscribeStockGroups = onValue(stockGroupsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const groupsList: StockGroup[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        }));
        setStockGroups(groupsList);
      }
    });

    // Load users
    const usersRef = ref(database, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const usersList: User[] = Object.keys(data).map(key => ({
          uid: key,
          ...data[key],
        }));
        setUsers(usersList.filter(user => user.role === 'employee' || user.role === 'customer'));
      }
    });

    return () => {
      unsubscribeEmployees();
      unsubscribeStockGroups();
      unsubscribeUsers();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const employeeData = {
        ...formData,
        updatedAt: new Date().toISOString(),
        ...(editingEmployee ? {} : { createdAt: new Date().toISOString() }),
      };

      if (editingEmployee) {
        const employeeRef = ref(database, `employees/${editingEmployee.id}`);
        await set(employeeRef, employeeData);
        toast.success('Employee updated successfully!');
      } else {
        const employeesRef = ref(database, 'employees');
        await push(employeesRef, employeeData);
        toast.success('Employee created successfully!');
      }

      resetForm();
    } catch (error) {
      toast.error('Failed to save employee');
      console.error('Error saving employee:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      userId: employee.userId,
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      phone: employee.phone || '',
      department: employee.department,
      position: employee.position,
      assignedStockGroups: employee.assignedStockGroups || [],
      permissions: employee.permissions,
      isActive: employee.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (employeeId: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      try {
        const employeeRef = ref(database, `employees/${employeeId}`);
        await remove(employeeRef);
        toast.success('Employee deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete employee');
        console.error('Error deleting employee:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      employeeId: '',
      name: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      assignedStockGroups: [],
      permissions: {
        canManageInventory: true,
        canViewReports: true,
        canProcessOrders: false,
      },
      isActive: true,
    });
    setEditingEmployee(null);
    setShowForm(false);
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Employee Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search employees..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Mobile Cards / Desktop Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Mobile View */}
        <div className="block lg:hidden">
          <div className="divide-y divide-gray-200">
            {filteredEmployees.map((employee) => (
              <div key={employee.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{employee.name}</h3>
                      {employee.isActive ? (
                        <UserCheck className="w-4 h-4 text-green-600" />
                      ) : (
                        <UserX className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        {employee.email}
                      </div>
                      {employee.phone && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2" />
                          {employee.phone}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Briefcase className="w-4 h-4 mr-2" />
                        {employee.position} - {employee.department}
                      </div>
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        ID: {employee.employeeId}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(employee)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(employee.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Groups
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                      <div className="text-sm text-gray-500">{employee.email}</div>
                      <div className="text-sm text-gray-500">ID: {employee.employeeId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{employee.position}</div>
                    <div className="text-sm text-gray-500">{employee.department}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(employee.assignedStockGroups || []).map((groupId) => {
                        const group = stockGroups.find(g => g.id === groupId);
                        return group ? (
                          <span key={groupId} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {group.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      employee.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(employee)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(employee.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 lg:p-6">
              <h3 className="text-lg lg:text-xl font-semibold">
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select User *
                  </label>
                  <select
                    required
                    value={formData.userId}
                    onChange={(e) => {
                      const selectedUser = users.find(u => u.uid === e.target.value);
                      setFormData({ 
                        ...formData, 
                        userId: e.target.value,
                        name: selectedUser?.displayName || selectedUser?.email.split('@')[0] || '',
                        email: selectedUser?.email || ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a user</option>
                    {users.map(user => (
                      <option key={user.uid} value={user.uid}>
                        {user.displayName || user.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="EMP001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Inventory Management"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Stock Manager"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+91 9876543210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Stock Groups
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {stockGroups.map(group => (
                    <label key={group.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(formData.assignedStockGroups || []).includes(group.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              assignedStockGroups: [...(formData.assignedStockGroups || []), group.id]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              assignedStockGroups: (formData.assignedStockGroups || []).filter(id => id !== group.id)
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{group.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canManageInventory}
                      onChange={(e) => setFormData({
                        ...formData,
                        permissions: { ...formData.permissions, canManageInventory: e.target.checked }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm">Can Manage Inventory</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canViewReports}
                      onChange={(e) => setFormData({
                        ...formData,
                        permissions: { ...formData.permissions, canViewReports: e.target.checked }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm">Can View Reports</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canProcessOrders}
                      onChange={(e) => setFormData({
                        ...formData,
                        permissions: { ...formData.permissions, canProcessOrders: e.target.checked }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm">Can Process Orders</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Active Employee</span>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingEmployee ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;