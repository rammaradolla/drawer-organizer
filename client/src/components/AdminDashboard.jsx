import React, { useState, useEffect, useMemo } from 'react';
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
  const [departmentMembers, setDepartmentMembers] = useState([]);
  const [editingMember, setEditingMember] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [userRoleFilters, setUserRoleFilters] = useState({
    admin: false,
    operations: false,
    department_head: false,
    department_member: false,
  });
  const ALL_ROLES = ['admin', 'operations', 'department_head', 'department_member', 'customer'];
  const [userSearch, setUserSearch] = useState('');
  const [headUsers, setHeadUsers] = useState([]);

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
    if (data.success) {
      setDepartmentHeads(data.department_heads);
    }
  }

  async function fetchHeadUsers() {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    const res = await fetch('/api/admin/users?role=department_head', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (data.success) setHeadUsers(data.users);
  }

  useEffect(() => {
    fetchDepartmentHeads();
    fetchHeadUsers();
  }, []);

  async function fetchDepartmentMembers() {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    const res = await fetch('/api/admin/department-members', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (data.success) setDepartmentMembers(data.department_members);
  }

  useEffect(() => {
    if (activeTab === 'departmentMembers') fetchDepartmentMembers();
  }, [activeTab]);

  async function saveDepartmentMember(member) {
    const method = member.id ? 'PUT' : 'POST';
    const url = member.id ? `/api/admin/department-members/${member.id}` : '/api/admin/department-members';
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(member),
    });
    await fetchDepartmentMembers();
    setEditingMember(null);
  }

  async function deleteDepartmentMember(id) {
    await fetch(`/api/admin/department-members/${id}`, { method: 'DELETE' });
    await fetchDepartmentMembers();
  }

  async function fetchAllUsers() {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    const res = await fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (data.success) setAllUsers(data.users);
  }

  useEffect(() => {
    if (activeTab === 'manageUsers') fetchAllUsers();
  }, [activeTab]);

  async function handleUserRoleChange(userId, newRole) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    await fetch('/api/admin/users/role', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ email: user.email, role: newRole }),
    });
    fetchAllUsers();
  }

  const filteredUsers = useMemo(() => {
    const activeRoles = Object.entries(userRoleFilters).filter(([role, checked]) => checked).map(([role]) => role);
    let users = allUsers;
    if (activeRoles.length > 0) {
      users = users.filter(user => activeRoles.includes(user.role));
    }
    if (userSearch.trim() !== '') {
      const search = userSearch.trim().toLowerCase();
      users = users.filter(user =>
        (user.email && user.email.toLowerCase().includes(search)) ||
        (user.id && user.id.toLowerCase().includes(search))
      );
    }
    return users;
  }, [allUsers, userRoleFilters, userSearch]);

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
        <button className={`px-4 py-2 rounded ${activeTab === 'departmentMembers' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} onClick={() => setActiveTab('departmentMembers')}>Department Members</button>
        <button className={`px-4 py-2 rounded ${activeTab === 'manageUsers' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} onClick={() => setActiveTab('manageUsers')}>Manage Users</button>
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
            <button type="submit" className="btn-primary whitespace-nowrap">Make Operator</button>
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
                  departmentHeads.map((row, idx) => (
                    <tr key={row.stage} className="border-b hover:bg-gray-50">
                      <td className="p-3">{row.stage}</td>
                      <td className="p-3">{row.name || <span className="text-gray-400">Unassigned</span>}</td>
                      <td className="p-3">{row.email || <span className="text-gray-400">Unassigned</span>}</td>
                      <td className="p-3">{row.phone || <span className="text-gray-400">Unassigned</span>}</td>
                      <td className="p-3">
                        <button className="text-blue-600 hover:text-blue-800 font-semibold mr-2" onClick={() => setEditingHead({ ...row })}>Edit</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-3 text-center text-gray-500">
                      No department head assignments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {editingHead && (
              <Modal onClose={() => setEditingHead(null)}>
                <EditDepartmentHeadForm
                  head={editingHead}
                  onSave={() => {
                    setEditingHead(null);
                    fetchDepartmentHeads();
                  }}
                  onCancel={() => setEditingHead(null)}
                  headUsers={headUsers}
                />
              </Modal>
            )}
          </div>
        </div>
      )}
      {activeTab === 'departmentMembers' && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Department Members</h3>
          <button className="mb-4 px-4 py-2 bg-green-600 text-white rounded" onClick={() => setEditingMember({})}>Add Member</button>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Phone</th>
                  <th className="p-3 text-left">Department Head</th>
                  <th className="p-3 text-left">Stage</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departmentMembers.length > 0 ? (
                  departmentMembers.map(member => {
                    const head = departmentHeads.find(h => h.id === member.department_head_id);
                    return (
                      <tr key={member.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{member.name}</td>
                        <td className="p-3">{member.email}</td>
                        <td className="p-3">{member.phone}</td>
                        <td className="p-3">{head ? `${head.name} (${head.email})` : 'Unassigned'}</td>
                        <td className="p-3">{member.stage || ''}</td>
                        <td className="p-3">
                          <button className="text-blue-600 hover:text-blue-800 font-semibold mr-2" onClick={() => setEditingMember({ ...member })}>Edit</button>
                          <button className="text-red-600 hover:text-red-800 font-semibold" onClick={() => deleteDepartmentMember(member.id)}>Delete</button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="p-3 text-center text-gray-500">
                      No department members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {editingMember && (
              <Modal onClose={() => setEditingMember(null)}>
                <EditDepartmentMemberForm
                  member={editingMember}
                  departmentHeads={departmentHeads}
                  onSave={async (updatedMember) => { await saveDepartmentMember(updatedMember); }}
                  onCancel={() => setEditingMember(null)}
                />
              </Modal>
            )}
          </div>
        </div>
      )}
      {activeTab === 'manageUsers' && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Manage Users</h3>
          <div className="mb-4 flex gap-4 items-center">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={userRoleFilters.admin} onChange={e => setUserRoleFilters(f => ({ ...f, admin: e.target.checked }))} />
              Admin
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={userRoleFilters.operations} onChange={e => setUserRoleFilters(f => ({ ...f, operations: e.target.checked }))} />
              Operations
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={userRoleFilters.department_head} onChange={e => setUserRoleFilters(f => ({ ...f, department_head: e.target.checked }))} />
              Department Head
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={userRoleFilters.department_member} onChange={e => setUserRoleFilters(f => ({ ...f, department_member: e.target.checked }))} />
              Department Member
            </label>
            <input
              type="text"
              placeholder="Search by email or ID..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="ml-4 px-2 py-1 border rounded min-w-[220px]"
            />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Role</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-mono text-xs">{user.id}</td>
                      <td className="p-3">{user.name}</td>
                      <td className="p-3">{user.email}</td>
                      <td className="p-3">
                        <select
                          value={user.role}
                          onChange={e => handleUserRoleChange(user.id, e.target.value)}
                          className="rounded px-2 py-1 border"
                        >
                          {ALL_ROLES.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-3 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function EditDepartmentHeadForm({ head, onSave, onCancel, headUsers }) {
  const [form, setForm] = React.useState({ ...head });
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
  // Use form.stage directly for the current stage
  const currentStage = form.stage || '';
  // Track selected department head user, default to current
  const [selectedHeadId, setSelectedHeadId] = React.useState(form.department_head_id || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentStage || !selectedHeadId) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    await fetch('/api/admin/department-heads/stage-assignment', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ stage: currentStage, new_department_head_id: selectedHeadId })
    });
    onSave();
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <label className="font-semibold">Stage</label>
        <input
          type="text"
          value={currentStage}
          readOnly
          className="input bg-gray-100 cursor-not-allowed"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="font-semibold">Department Head User</label>
        <select
          value={selectedHeadId}
          onChange={e => setSelectedHeadId(e.target.value)}
          required
          className="input"
        >
          <option value="">Select Department Head</option>
          {headUsers.map(u => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email}){u.id === form.department_head_id ? ' (current)' : ''}
            </option>
          ))}
        </select>
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

function EditDepartmentMemberForm({ member, departmentHeads, onSave, onCancel }) {
  const [form, setForm] = React.useState({ ...member });
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
  const isEditing = !!form.id;
  return (
    <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); onSave(form); }}>
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
      <div className="flex flex-col gap-2">
        <label className="font-semibold">Department Head</label>
        <select
          value={form.department_head_id || ''}
          onChange={e => setForm(f => ({ ...f, department_head_id: e.target.value }))}
          required
          className="input"
        >
          <option value="">Select Department Head</option>
          {departmentHeads.map(head => (
            <option key={head.id} value={head.id}>{head.name} ({head.email})</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <label className="font-semibold">Stage</label>
        {isEditing ? (
          <input value={form.stage || ''} readOnly className="input bg-gray-100 cursor-not-allowed" />
        ) : (
          <select
            value={form.stage || ''}
            onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}
            required
            className="input"
          >
            <option value="">Select Stage</option>
            {OPERATIONAL_STAGES.map(stage => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
        )}
      </div>
      <div className="flex gap-2 mt-2">
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
        <button type="button" className="px-4 py-2 bg-gray-300 text-gray-800 rounded" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default AdminDashboard; 