import React, { useState, useEffect } from "react";
import { ref, onValue, set, remove } from "firebase/database";
import { database } from "../../config/firebase";
import { User } from "../../types";
import {
  Edit,
  UserCheck,
  Trash2,
  Search,
  Filter,
  X,
  Save,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Calendar,
  User as UserIcon,
  Loader,
  Shield,
  ShieldOff,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

type UserRole = "admin" | "employee" | "customer" | "editor" | "viewer";

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [verificationFilter, setVerificationFilter] = useState<
    "all" | "verified" | "unverified"
  >("all");
  const [sortField, setSortField] = useState<
    "name" | "email" | "role" | "joined"
  >("joined");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const usersRef = ref(database, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      setIsLoading(false);
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const usersList: User[] = Object.keys(usersData).map((key) => ({
          uid: key,
          ...usersData[key],
        }));

        // Sort with unverified accounts first
        usersList.sort((a, b) => {
          const aVerified = a.emailVerified || false;
          const bVerified = b.emailVerified || false;
          if (aVerified !== bVerified) {
            return aVerified ? 1 : -1;
          }
          return 0;
        });

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
      result = result.filter(
        (user) =>
          user.email?.toLowerCase().includes(query) ||
          user.displayName?.toLowerCase().includes(query) ||
          (user.phone && user.phone.includes(query))
      );
    }

    // Apply role filter
    if (roleFilter !== "all") {
      result = result.filter((user) => user.role === roleFilter);
    }

    // Apply verification filter
    if (verificationFilter !== "all") {
      result = result.filter((user) =>
        verificationFilter === "verified"
          ? user.emailVerified
          : !user.emailVerified
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case "name":
          aValue = a.displayName || a.email || "";
          bValue = b.displayName || b.email || "";
          break;
        case "email":
          aValue = a.email || "";
          bValue = b.email || "";
          break;
        case "role":
          aValue = a.role || "";
          bValue = b.role || "";
          break;
        case "joined":
          aValue = a.createdAt || 0;
          bValue = b.createdAt || 0;
          break;
        default:
          return 0;
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredUsers(result);
  }, [
    users,
    searchQuery,
    roleFilter,
    verificationFilter,
    sortField,
    sortDirection,
  ]);

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    setIsUpdating(true);
    try {
      const user = users.find((u) => u.uid === userId);
      if (user) {
        const userRef = ref(database, `users/${userId}`);
        await set(userRef, { ...user, role: newRole });
        toast.success("User role updated successfully!");
      }
    } catch (error) {
      toast.error("Failed to update user role");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;

    setIsDeleting(true);
    try {
      await remove(ref(database, `users/${deleteConfirmUser.uid}`));
      toast.success("User deleted successfully");
      setDeleteConfirmUser(null);
    } catch (error) {
      toast.error("Failed to delete user");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border border-red-200";
      case "employee":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "editor":
        return "bg-purple-100 text-purple-800 border border-purple-200";
      case "viewer":
        return "bg-green-100 text-green-800 border border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getTimeDifference = (timestamp: string | number) => {
    const now = new Date();
    const created = new Date(timestamp); // works with both string & number
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) {
      return "Today";
    } else if (diffDays === 1) {
      return "1 day ago";
    } else if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else if (diffDays < 365) {
      const diffMonths = Math.floor(diffDays / 30);
      return `${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;
    } else {
      const diffYears = Math.floor(diffDays / 365);
      return `${diffYears} ${diffYears === 1 ? "year" : "years"} ago`;
    }
  };

  const handleSort = (field: "name" | "email" | "role" | "joined") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field)
      return <ChevronDown className="w-4 h-4 opacity-30" />;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
          <p className="text-gray-500">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-500 mt-1">
            {filteredUsers.length}{" "}
            {filteredUsers.length === 1 ? "user" : "users"} found
            {verificationFilter !== "all" && ` (${verificationFilter})`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-2 px-4 py-2.5 bg-white border rounded-lg transition-colors ${
              isFilterOpen
                ? "border-blue-500 ring-1 ring-blue-500"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {(roleFilter !== "all" ||
              verificationFilter !== "all" ||
              sortField !== "joined") && (
              <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                !
              </span>
            )}
          </button>
        </div>
      </div>

      {isFilterOpen && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-900">Filter Users</h3>
            <button
              onClick={() => setIsFilterOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) =>
                  setRoleFilter(e.target.value as UserRole | "all")
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verification
              </label>
              <select
                value={verificationFilter}
                onChange={(e) =>
                  setVerificationFilter(
                    e.target.value as "all" | "verified" | "unverified"
                  )
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">All Users</option>
                <option value="verified">Verified Only</option>
                <option value="unverified">Unverified Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <div className="flex gap-2">
                <select
                  value={sortField}
                  onChange={(e) =>
                    setSortField(e.target.value as typeof sortField)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="joined">Joined Date</option>
                  <option value="name">Name</option>
                  <option value="email">Email</option>
                  <option value="role">Role</option>
                </select>
                <button
                  onClick={() =>
                    setSortDirection(sortDirection === "asc" ? "desc" : "asc")
                  }
                  className="px-3 py-2.5 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0"
                  aria-label={`Sort ${
                    sortDirection === "asc" ? "descending" : "ascending"
                  }`}
                >
                  {sortDirection === "asc" ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No users found
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {users.length === 0
              ? "There are no users in the system yet."
              : "Try adjusting your search or filter criteria to find what you're looking for."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <div
              key={user.uid}
              className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-all ${
                !user.emailVerified
                  ? "border-orange-300 bg-orange-50"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt="Profile"
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">
                      {user.displayName || user.email}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  </div>
                </div>
                {user.emailVerified ? (
                  <span title="Verified">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  </span>
                ) : (
                  <span title="Unverified">
                    <XCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 p-2 rounded-lg">
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <Shield className="w-3 h-3" />
                    <span>Role</span>
                  </div>
                  <div
                    className={`text-xs font-medium px-2 py-1 rounded-full text-center ${getRoleColor(
                      user.role as UserRole
                    )}`}
                  >
                    {user.role}
                  </div>
                </div>

                <div className="bg-gray-50 p-2 rounded-lg">
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <Clock className="w-3 h-3" />
                    <span>Joined</span>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {getTimeDifference(user.createdAt)}
                  </div>
                </div>
              </div>

              {user.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded-lg mb-4">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{user.phone}</span>
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setSelectedUser(user)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 text-sm font-medium transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => setDeleteConfirmUser(user)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-red-50 text-red-700 rounded-md hover:bg-red-100 text-sm font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User details modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center rounded-t-xl z-10">
              <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-500 p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-col items-center text-center">
                {selectedUser.profileImage ? (
                  <img
                    src={selectedUser.profileImage}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover mb-4 ring-4 ring-gray-100"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 ring-4 ring-gray-100">
                    <UserIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <h3 className="text-xl font-semibold text-gray-900 truncate max-w-full px-2">
                  {selectedUser.displayName || selectedUser.email}
                </h3>
                <p className="text-gray-500 truncate max-w-full px-2">
                  {selectedUser.email}
                </p>

                <div className="flex items-center gap-2 mt-2">
                  {selectedUser.emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <CheckCircle className="w-4 h-4" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                      <XCircle className="w-4 h-4" /> Unverified
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={selectedUser.role}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        role: e.target.value as UserRole,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="customer">Customer</option>
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs uppercase font-medium">
                        Joined
                      </span>
                    </div>
                    <div className="text-sm text-gray-900">
                      {formatDate(selectedUser.createdAt)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getTimeDifference(selectedUser.createdAt)}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Shield className="w-4 h-4" />
                      <span className="text-xs uppercase font-medium">
                        Status
                      </span>
                    </div>
                    <div
                      className={`text-xs px-2.5 py-1 rounded-full inline-block ${getRoleColor(
                        selectedUser.role as UserRole
                      )}`}
                    >
                      {selectedUser.role}
                    </div>
                  </div>
                </div>

                {selectedUser.phone && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Phone className="w-4 h-4" />
                      <span className="text-xs uppercase font-medium">
                        Phone
                      </span>
                    </div>
                    <div className="text-sm text-gray-900">
                      {selectedUser.phone}
                    </div>
                  </div>
                )}

                {/* Show any other fields dynamically */}
                {Object.entries(selectedUser).map(([key, value]) => {
                  if (
                    [
                      "uid",
                      "displayName",
                      "email",
                      "role",
                      "createdAt",
                      "profileImage",
                      "phone",
                      "emailVerified",
                    ].includes(key) ||
                    !value
                  ) {
                    return null;
                  }
                  return (
                    <div key={key} className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs uppercase font-medium text-gray-500 mb-1 capitalize">
                        {key}
                      </div>
                      <div className="text-sm text-gray-900">
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
                className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateUserRole(
                    selectedUser.uid,
                    selectedUser.role as UserRole
                  );
                  setSelectedUser(null);
                }}
                disabled={isUpdating}
                className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl w-full max-w-md animate-scaleIn">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete User
                  </h3>
                  <p className="text-gray-500 mt-1">
                    Are you sure you want to delete{" "}
                    <span className="font-medium">
                      {deleteConfirmUser.displayName || deleteConfirmUser.email}
                    </span>
                    ? This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete User"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
