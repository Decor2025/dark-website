import React, { useState, useEffect } from 'react';
import { ref, onValue, set, remove } from 'firebase/database';
import { database } from '../../config/firebase';
import { User } from '../../types';
import { Edit, UserCheck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

type UserRole = 'admin' | 'employee' | 'customer' | 'editor' | 'viewer';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const usersRef = ref(database, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const usersList: User[] = Object.keys(usersData).map(key => ({
          uid: key,
          ...usersData[key],
        }));
        setUsers(usersList);
      }
    });

    return () => unsubscribe();
  }, []);

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

  const deleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await remove(ref(database, `users/${userId}`));
      toast.success('User deleted from database.');

      // Call cloud function to delete from Firebase Auth
      // await fetch(`/api/deleteUser?uid=${userId}`, { method: 'DELETE' });
    } catch (error) {
      toast.error('Failed to delete user');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">User Management</h2>

      {/* Mobile view */}
      <div className="block sm:hidden">
        {users.map(user => (
          <div key={user.uid} className="border rounded-lg p-4 mb-4 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center gap-3">
              {user.profileImage ? (
                <img src={user.profileImage} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-gray-600" />
                </div>
              )}
              <div>
                <div className="font-medium">{user.displayName || user.email}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
            </div>
            <div className="text-sm">Role: {user.role}</div>
            <div className="text-sm text-gray-500">
              Joined: {new Date(user.createdAt).toLocaleDateString()}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedUser(user)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-md text-sm"
              >
                View / Edit
              </button>
              <button
                onClick={() => deleteUser(user.uid)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded-md text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop view */}
      <div className="hidden sm:block overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.uid}>
                <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{user.displayName || user.email}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteUser(user.uid)}
                    className="text-red-600 hover:text-red-900 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User details modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg p-6 space-y-4">
            <div className="flex flex-col items-center text-center">
              {selectedUser.profileImage ? (
                <img src={selectedUser.profileImage} alt="Profile" className="w-20 h-20 rounded-full object-cover mb-3" />
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                  <UserCheck className="w-8 h-8 text-gray-600" />
                </div>
              )}
              <h3 className="text-xl font-semibold">{selectedUser.displayName || selectedUser.email}</h3>
              <p className="text-gray-500">{selectedUser.email}</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Role:</span>
                <select
                  value={selectedUser.role}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, role: e.target.value as UserRole })
                  }
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="customer">Customer</option>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              
              
              <div className="flex justify-between">
                <span className="font-medium">Joined:</span>
                <span>{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Show any other fields dynamically */}
              {Object.entries(selectedUser).map(([key, value]) => {
                if (['uid', 'displayName', 'email', 'role', 'createdAt', 'profileImage', 'phoneNumber'].includes(key)) {
                  return null;
                }
                return (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium capitalize">{key}:</span>
                    <span>{String(value)}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => {
                  updateUserRole(selectedUser.uid, selectedUser.role as UserRole);
                  setSelectedUser(null);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  deleteUser(selectedUser.uid);
                  setSelectedUser(null);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
