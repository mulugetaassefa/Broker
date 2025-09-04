import React, { useState, useEffect } from 'react';
import { Search, User, Edit, Trash2 } from 'lucide-react';

import api from '../../services/api';
import { toast } from 'react-toastify';
import UserForm from '../../components/admin/UserForm';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [openUserForm, setOpenUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch users from API
  const fetchUsers = async ({ page = pagination.page, search = searchTerm } = {}) => {
    try {
      setError(null);
      setLoading(true);
      const res = await api.users.getAll({ page, limit: pagination.limit, search });
      // Expecting shape like { users, totalUsers, totalPages }
      const list = res.users || res.data?.users || [];
      const total = res.totalUsers ?? res.data?.totalUsers ?? list.length;
      setUsers(list);
      setPagination(prev => ({ ...prev, page, total }));
    } catch (e) {
      console.error('Failed to load users:', e);
      setError('Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers({ page: 1, search: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = users.filter(user => {
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const email = user.email || '';
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleEditClick = (user) => {
    setEditingUser(user);
    setOpenUserForm(true);
  };

  const handleSaveUser = async (data) => {
    try {
      if (editingUser?._id) {
        await api.users.update(editingUser._id, data);
        toast.success('User updated successfully');
      } else {
        await api.users.create(data);
        toast.success('User created successfully');
      }
      setOpenUserForm(false);
      setEditingUser(null);
      fetchUsers({ page: pagination.page, search: searchTerm });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save user');
      throw e; // allow UserForm to manage its own loading state
    }
  };

  const handleDelete = async (user) => {
    const confirmed = window.confirm(`Delete user ${user.email}? This cannot be undone.`);
    if (!confirmed) return;
    try {
      setDeletingId(user._id);
      await api.users.delete(user._id);
      toast.success('User deleted successfully');
      // Optimistic remove
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      // Refresh to sync totals/pagination
      fetchUsers({ page: pagination.page, search: searchTerm });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const toggleSelectAll = (e) => {
    setSelectedUsers(e.target.checked ? filteredUsers.map(u => u._id) : []);
  };

  const getStatusBadge = (isActive) => {
    const label = isActive ? 'active' : 'inactive';
    const styles = isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Users</h1>
        <button
          onClick={() => { setEditingUser(null); setOpenUserForm(true); }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <User className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => {
              const val = e.target.value;
              setSearchTerm(val);
              // Debounce-like simple fetch: fetch after short delay
              clearTimeout(window.__usersFetchTimer);
              window.__usersFetchTimer = setTimeout(() => {
                fetchUsers({ page: 1, search: val });
              }, 300);
            }}
            className="block w-full pl-10 pr-3 py-2 border rounded-md"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 text-red-600 text-sm">{error}</div>
      )}

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-blue-50 p-3 rounded-lg mb-4 flex justify-between items-center">
          <span className="text-sm text-blue-700">
            {selectedUsers.length} selected
          </span>
          <div className="space-x-2">
            <button className="px-3 py-1 text-sm bg-white border rounded-md">
              Activate
            </button>
            <button className="px-3 py-1 text-sm bg-white border rounded-md">
              Deactivate
            </button>
            <button className="px-3 py-1 text-sm text-red-600 bg-white border rounded-md">
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={selectedUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => toggleSelectUser(user._id)}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <div className="font-medium">{`${user.firstName || ''} ${user.lastName || ''}`.trim()}</div>
                      <div className="text-sm text-gray-500">ID: {user._id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">{user.email}</div>
                  <div className="text-sm text-gray-500">{user.phone}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs bg-gray-100 rounded-full">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(user.isActive)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className={`text-red-600 hover:text-red-900 ${deletingId === user._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Delete"
                      disabled={deletingId === user._id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Form Dialog */}
      <UserForm
        open={openUserForm}
        onClose={() => { setOpenUserForm(false); setEditingUser(null); }}
        user={editingUser}
        onSave={handleSaveUser}
      />
    </div>
  );
};

export default ManageUsers;
