import React, { useState, useEffect } from 'react';
import { ref, onValue, set, remove } from 'firebase/database';
import { database } from '../../config/firebase';
import { User } from '../../types';
import { Edit, UserCheck, Trash2, Search, Filter, X, Save, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

type UserRole = 'admin' | 'employee' | 'customer' | 'editor' | 'viewer';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [sortField, setSortField] = useState<'name' | 'email' | 'role' | 'joined'>('joined');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const usersRef = ref(database, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      setIsLoading(false);
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const usersList: User[] = Object.keys(usersData).map(key => ({
          uid: key,
          ...usersData[key],
        }));
        setUsers(usersList);
        setFilteredUsers(usersList);
      } else {
        setUsers([]);
        setFilteredUsers([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let result = [...users];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user => 
        user.email?.toLowerCase().includes(query) || 
        user.displayName?.toLowerCase().includes(query)
      );
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'name':
          aValue = a.displayName || a.email || '';
          bValue = b.displayName || b.email || '';
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'role':
          aValue = a.role || '';
          bValue = b.role || '';
          break;
        case 'joined':
          aValue = a.createdAt || 0;
          bValue = b.createdAt || 0;
          break;
        default:
          return 0;
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredUsers(result);
  }, [users, searchQuery, roleFilter, sortField, sortDirection]);

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const user = users.find(u => u.uid === userId);
      if (user) {
        const userRef = ref(database, `users/${userId}`);
        await set(userRef, { ...user, role: newRole });
        toast.success('User role updated successfully!');
      }
    } catch (error) {
      toast.error('Failed to update user role');
      console.error(error);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    
    try {
      await remove(ref(database, `users/${deleteConfirmUser.uid}`));
      toast.success('User deleted successfully');
      setDeleteConfirmUser(null);
    } catch (error) {
      toast.error('Failed to delete user');
      console.error(error);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'employee': return 'bg-blue-100 text-blue-800';
      case 'editor': return 'bg-purple-100 text-purple-800';
      case 'viewer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSort = (field: 'name' | 'email' | 'role' | 'joined') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <ChevronDown className="w-4 h-4 opacity-30" />;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {isFilterOpen && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Filter Users</h3>
            <button onClick={() => setIsFilterOpen(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="employee">Employee</option>
                <option value="customer">Customer</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <div className="flex gap-2">
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as typeof sortField)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="joined">Joined Date</option>
                  <option value="name">Name</option>
                  <option value="email">Email</option>
                  <option value="role">Role</option>
                </select>
                <button
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                >
                  {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
          <p className="text-gray-500">
            {users.length === 0 
              ? "There are no users in the system yet." 
              : "Try adjusting your search or filter criteria."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile view */}
          <div className="block sm:hidden space-y-3">
            {filteredUsers.map(user => (
              <div key={user.uid} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt="Profile" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserCheck className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-grow">
                    <div className="font-medium text-gray-900">{user.displayName || user.email}</div>
                    <div className="text-sm text-gray-500 mb-2">{user.email}</div>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(user.role as UserRole)}`}>
                        {user.role}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-4 mt-4 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 text-sm font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirmUser(user)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-red-50 text-red-700 rounded-md hover:bg-red-100 text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop view */}
          <div className="hidden sm:block overflow-hidden bg-white rounded-lg shadow-md border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      <span>User</span>
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Role</span>
                      <SortIcon field="role" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('joined')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Joined</span>
                      <SortIcon field="joined" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map(user => (
                  <tr key={user.uid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {user.profileImage ? (
                          <img src={user.profileImage} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <UserCheck className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{user.displayName || user.email}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex text-xs leading-5 font-semibold px-2.5 py-0.5 rounded-full ${getRoleColor(user.role as UserRole)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="text-blue-600 hover:text-blue-900 p-1.5 rounded-md hover:bg-blue-50 transition-colors"
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmUser(user)}
                          className="text-red-600 hover:text-red-900 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                          title="Delete user"
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
        </>
      )}

      {/* User details modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center rounded-t-xl">
              <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
              <button 
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-500 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex flex-col items-center text-center">
                {selectedUser.profileImage ? (
                  <img src={selectedUser.profileImage} alt="Profile" className="w-20 h-20 rounded-full object-cover mb-4 ring-4 ring-gray-100" />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 ring-4 ring-gray-100">
                    <UserCheck className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <h3 className="text-xl font-semibold text-gray-900">{selectedUser.displayName || selectedUser.email}</h3>
                <p className="text-gray-500">{selectedUser.email}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={selectedUser.role}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, role: e.target.value as UserRole })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="customer">Customer</option>
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Joined</label>
                    <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <div className={`text-xs px-2 py-1 rounded-full inline-block ${getRoleColor(selectedUser.role as UserRole)}`}>
                      {selectedUser.role}
                    </div>
                  </div>
                </div>

                {/* Show any other fields dynamically */}
                {Object.entries(selectedUser).map(([key, value]) => {
                  if (['uid', 'displayName', 'email', 'role', 'createdAt', 'profileImage', 'phoneNumber'].includes(key)) {
                    return null;
                  }
                  return (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{key}</label>
                      <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">
                        {String(value)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex gap-3 rounded-b-xl">
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateUserRole(selectedUser.uid, selectedUser.role as UserRole);
                  setSelectedUser(null);
                }}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
                  <p className="text-gray-500 mt-1">
                    Are you sure you want to delete {deleteConfirmUser.displayName || deleteConfirmUser.email}? This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;