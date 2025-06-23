import React, { useState, useEffect } from 'react';
import { useUser } from './UserProvider';
import { supabase } from '../utils/supabaseClient'; // Assuming you have this configured

function AdminDashboard() {
  const { user } = useUser();
  const [operationsUsers, setOperationsUsers] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchOperationsUsers = async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    try {
      const response = await fetch('/api/admin/users?role=operations', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to fetch users');
      }
      const data = await response.json();
      setOperationsUsers(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperationsUsers();
  }, []);

  const handleRoleChange = async (targetUserEmail, newRole) => {
    setError('');
    setMessage('');
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    try {
      const response = await fetch('/api/admin/users/role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ email: targetUserEmail, role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update role');
      }
      
      setMessage(`Successfully set role for ${targetUserEmail} to ${newRole}.`);
      setNewUserEmail('');
      fetchOperationsUsers(); // Refresh the list
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleAddOperator = (e) => {
    e.preventDefault();
    if (!newUserEmail) {
      setError('Please enter an email address.');
      return;
    }
    handleRoleChange(newUserEmail, 'operations');
  };

  const handleRemoveOperator = (email) => {
    if (window.confirm(`Are you sure you want to remove ${email} from the operations role? Their role will be set to 'customer'.`)) {
      handleRoleChange(email, 'customer');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Admin - User Role Management</h2>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
      {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{message}</div>}

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold mb-4">Add Operations User</h3>
        <form onSubmit={handleAddOperator} className="flex items-center gap-4">
          <input
            type="email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            placeholder="Enter user's email"
            className="input flex-grow"
            required
          />
          <button type="submit" className="btn-primary">
            Make Operator
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          The user must already have an account. This tool only changes their role.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Current Operations Users</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {operationsUsers.length > 0 ? (
                  operationsUsers.map((opUser) => (
                    <tr key={opUser.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{opUser.email}</td>
                      <td className="p-3">{opUser.name || 'N/A'}</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleRemoveOperator(opUser.email)}
                          className="text-red-600 hover:text-red-800 font-semibold"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="p-3 text-center text-gray-500">
                      No users with the 'operations' role found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard; 