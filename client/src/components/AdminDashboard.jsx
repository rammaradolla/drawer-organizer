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
  const [departmentHeads, setDepartmentHeads] = useState([]);
  const [editingHead, setEditingHead] = useState(null);
  const [activeTab, setActiveTab] = useState('operations');

  // List of all operational stages
  const OPERATIONAL_STAGES = [
    "Payment Confirmed",
    "Design Review",
    "Material Sourcing",
    "Cutting & Milling",
    "Assembly",
    "Sanding & Finishing",
    "Final Quality Check",
    "Packaging",
    "Awaiting Carrier Pickup",
    "Shipped",
    "Delivered"
  ];

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

  async function fetchDepartmentHeads() {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    const res = await fetch('/api/admin/department-heads', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (data.success) setDepartmentHeads(data.department_heads);
  }

  useEffect(() => {
    fetchDepartmentHeads();
  }, []);

  async function saveDepartmentHead(head) {
    const method = head.id ? 'PUT' : 'POST';
    const url = head.id ? `/api/admin/department-heads/${head.id}` : '/api/admin/department-heads';
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(head),
    });
    await fetchDepartmentHeads();
    setEditingHead(null);
  }

  async function deleteDepartmentHead(id) {
    await fetch(`/api/admin/department-heads/${id}`, { method: 'DELETE' });
    await fetchDepartmentHeads();
  }

  // Modal component
  function Modal({ children, onClose }) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white rounded-lg shadow-lg p-10 min-w-[600px] max-w-[98vw] relative">
          <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl" onClick={onClose}>&times;</button>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
      <div className="flex gap-4 mb-6">
        <button className={`px-4 py-2 rounded ${activeTab === 'operations' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} onClick={() => setActiveTab('operations')}>Operations Users</button>
        <button className={`px-4 py-2 rounded ${activeTab === 'departmentHeads' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} onClick={() => setActiveTab('departmentHeads')}>Department Heads</button>
      </div>
      {activeTab === 'operations' && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Add Operations User</h3>
          <form onSubmit={handleAddOperator} className="flex items-center gap-4 mb-6">
            <input
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="Enter user's email"
              className="input flex-grow"
              required
            />
            <button type="submit" className="btn-primary">Make Operator</button>
          </form>
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
      )}
      {activeTab === 'departmentHeads' && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Department Heads</h3>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left">Stage</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Phone</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departmentHeads.length > 0 ? (
                  departmentHeads.map(head => (
                    <tr key={head.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{head.stage}</td>
                      <td className="p-3">{head.name}</td>
                      <td className="p-3">{head.email}</td>
                      <td className="p-3">{head.phone}</td>
                      <td className="p-3">
                        <button className="text-blue-600 hover:text-blue-800 font-semibold mr-2" onClick={() => setEditingHead({ ...head })}>Edit</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-3 text-center text-gray-500">
                      No department heads found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {editingHead && (
              <Modal onClose={() => setEditingHead(null)}>
                <EditDepartmentHeadForm
                  head={editingHead}
                  onSave={async (updatedHead) => { await saveDepartmentHead(updatedHead); }}
                  onCancel={() => setEditingHead(null)}
                />
              </Modal>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EditDepartmentHeadForm({ head, onSave, onCancel }) {
  const [form, setForm] = React.useState({ ...head });
  return (
    <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); onSave(form); }}>
      <div className="flex flex-col gap-2">
        <label className="font-semibold">Stage</label>
        <input value={form.stage || ''} readOnly className="input bg-gray-100 cursor-not-allowed" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="font-semibold">Name</label>
        <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" required className="input" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="font-semibold">Email</label>
        <input value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" required className="input" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="font-semibold">Phone</label>
        <input value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="input" />
      </div>
      <div className="flex gap-2 mt-2">
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
        <button type="button" className="px-4 py-2 bg-gray-300 text-gray-800 rounded" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default AdminDashboard; 