import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from './UserProvider';
import { supabase } from '../utils/supabaseClient'; // Assuming you have this configured
// Import shadcn/ui MultiSelect
import { MultiSelect } from "./ui/multi-select";

function AdminDashboard() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [userRoleFilters, setUserRoleFilters] = useState({
    admin: false,
    operations: false,
    department_head: false,
    department_member: false,
  });
  const ALL_ROLES = ['admin', 'operations', 'department_head', 'department_member', 'customer'];
  const [userSearch, setUserSearch] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [auditLog, setAuditLog] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [auditLogFilter, setAuditLogFilter] = useState('all');

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
    fetchAllUsers();
  }, []);

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

  // Add state and handler for user stages selection
  const [userStages, setUserStages] = useState({});
  const [stageError, setStageError] = useState('');
  async function handleUserStagesChange(userId, selectedStages, role) {
    // Find current stages for this user
    const currentStages = userStages[userId] || [];
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    // Add new stages
    for (const stage of selectedStages) {
      if (role === 'department_member' && selectedStages.length > 1) {
        setStageError('Department members can only be assigned to one stage.');
        return;
      }
      setStageError('');
      if (!currentStages.includes(stage)) {
        if (role === 'department_member') {
          // Validate userId and stage
          if (!userId || typeof userId !== 'string' || !stage || typeof stage !== 'string') {
            setError('Invalid user or stage for department member assignment.');
            continue;
          }
          // Call backend to add stage for department member
          const res = await fetch(`/api/admin/department-members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({ user_id: userId, stage })
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            setError(err.message || 'Failed to assign stage to department member.');
          }
        } else {
          // Call backend to add stage for department head
          await fetch(`/api/admin/department-heads/${userId}/stages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({ stage })
          });
        }
      }
    }
    // Remove unselected stages
    for (const stage of currentStages) {
      if (!selectedStages.includes(stage)) {
        // Call backend to remove stage
        await fetch(`/api/admin/department-heads/${userId}/stages/${encodeURIComponent(stage)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      }
    }
    setUserStages(prev => ({ ...prev, [userId]: selectedStages }));
  }

  // When loading users, also fetch their current stages and set userStages
  useEffect(() => {
    async function fetchUserStages() {
      const stagesMap = {};
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      for (const user of allUsers) {
        if (user.role === 'department_head') {
          // Fetch from department_head_stages
          const res = await fetch(`/api/admin/department-heads/${user.id}/stages`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const data = await res.json();
          stagesMap[user.id] = data || [];
        } else if (user.role === 'department_member') {
          // Fetch from department_members
          const res = await fetch(`/api/admin/department-members?user_id=${user.id}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const data = await res.json();
          // Assume data.department_members is an array of member records, each with a 'stage' property
          stagesMap[user.id] = data.department_members
            ? data.department_members.map(m => m.stage)
            : [];
        }
      }
      setUserStages(stagesMap);
    }
    if (allUsers.length > 0) fetchUserStages();
  }, [allUsers]);

  // Fetch audit log entries (impersonation events)
  useEffect(() => {
    if (activeTab !== 'audit') return;
    async function fetchAuditLog() {
      setAuditLoading(true);
      setAuditError('');
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        const res = await fetch('/api/admin/audit-log?actions=impersonation_started,impersonation_ended', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (data.success) setAuditLog(data.entries);
        else setAuditError(data.message || 'Failed to fetch audit log');
      } catch (e) {
        setAuditError('Failed to fetch audit log');
      } finally {
        setAuditLoading(false);
      }
    }
    fetchAuditLog();
  }, [activeTab]);

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
    <div className="min-h-screen w-full flex flex-col p-6 bg-gray-50">
      <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
      <div className="mb-6 flex gap-4">
        <button className={`px-4 py-2 rounded font-semibold ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`} onClick={() => setActiveTab('users')}>Manage Users</button>
        <button className={`px-4 py-2 rounded font-semibold ${activeTab === 'audit' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`} onClick={() => setActiveTab('audit')}>Audit Log</button>
      </div>
      {activeTab === 'users' && (
        <>
          <h3 className="text-xl font-semibold mb-4">Manage Users</h3>
          {stageError && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
              {stageError}
            </div>
          )}
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
                      <td className="p-3 flex gap-2 items-center">
                        <select
                          value={user.role}
                          onChange={e => handleUserRoleChange(user.id, e.target.value)}
                          className="rounded px-2 py-1 border"
                        >
                          {ALL_ROLES.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                        {/* Replace the single stage dropdown with a multi-select for department_head and department_member */}
                        {(user.role === 'department_head' || user.role === 'department_member') && (
                          <MultiSelect
                            options={OPERATIONAL_STAGES.map(stage => ({ label: stage, value: stage }))}
                            values={userStages[user.id] || user.stages || []}
                            onChange={selected => handleUserStagesChange(user.id, selected, user.role)}
                            placeholder="Select Stages"
                            className="min-w-[180px]"
                          />
                        )}
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
        </>
      )}
      {activeTab === 'audit' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Impersonation Audit Log</h3>
          <div className="mb-4 flex gap-2">
            <button
              className={`px-3 py-1 rounded font-semibold ${auditLogFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setAuditLogFilter('all')}
            >All Events</button>
            <button
              className={`px-3 py-1 rounded font-semibold ${auditLogFilter === 'impersonation' ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setAuditLogFilter('impersonation')}
            >Impersonation Events</button>
            <button
              className={`px-3 py-1 rounded font-semibold ${auditLogFilter === 'direct' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setAuditLogFilter('direct')}
            >Direct Actions</button>
          </div>
          {auditLoading ? (
            <div>Loading...</div>
          ) : auditError ? (
            <div className="text-red-600">{auditError}</div>
          ) : auditLog.length === 0 ? (
            <div className="text-gray-500">No impersonation events found.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left">Timestamp</th>
                  <th className="p-3 text-left">Action</th>
                  <th className="p-3 text-left">Admin</th>
                  <th className="p-3 text-left">Target User</th>
                  <th className="p-3 text-left">Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLog
                  .filter(entry => {
                    if (auditLogFilter === 'impersonation') return !!entry.details?.impersonator_email;
                    if (auditLogFilter === 'direct') return !entry.details?.impersonator_email;
                    return true;
                  })
                  .map(entry => {
                    const isImpersonation = !!entry.details?.impersonator_email;
                    return (
                      <tr key={entry.id} className={isImpersonation ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''}>
                        <td className="p-3 font-mono text-xs">{new Date(entry.created_at).toLocaleString()}</td>
                        <td className="p-3 font-semibold">
                          {entry.action}
                          {isImpersonation && (
                            <span className="ml-2 px-2 py-1 bg-yellow-200 text-yellow-900 rounded text-xs font-bold">Impersonation</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isImpersonation
                            ? `${entry.details.impersonator_email} (as ${entry.details.target_email})`
                            : entry.details?.impersonator_email || entry.user_id}
                        </td>
                        <td className="p-3">{entry.details?.target_email || entry.target_user_id}</td>
                        <td className="p-3">
                          <pre className="bg-gray-100 rounded p-1 text-xs overflow-x-auto">{JSON.stringify(entry.details, null, 2)}</pre>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
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

function EditDepartmentMemberForm({ member, departmentHeads, onSave, onCancel, fetchDepartmentHeads, fetchDepartmentMembers }) {
  const [form, setForm] = React.useState({ ...member });
  const [error, setError] = React.useState('');

  // Deduplicate department heads by department_head_id
  const uniqueDepartmentHeads = Array.from(
    new Map(departmentHeads.map(h => [h.department_head_id, h])).values()
  );

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

  // UUID validation function
  const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Debug logging
    console.log('Form data being submitted:', form);
    console.log('Department head ID:', form.department_head_id);
    console.log('Department heads available:', departmentHeads);

    // Validate department_head_id is a UUID
    if (form.department_head_id && !isValidUUID(form.department_head_id)) {
      setError(`Invalid department head ID: ${form.department_head_id}. Expected UUID format.`);
      console.error('Invalid department_head_id:', form.department_head_id);
      return;
    }

    // Validate that the department_head_id exists in departmentHeads
    if (form.department_head_id && !uniqueDepartmentHeads.find(h => h.department_head_id === form.department_head_id)) {
      setError(`Selected department head not found in available options.`);
      console.error('Department head not found:', form.department_head_id);
      return;
    }

    // If department head was changed, update the mapping for the stage
    if (form.department_head_id !== member.department_head_id) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        const res = await fetch('/api/admin/department-heads/stage-assignment', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ stage: form.stage, new_department_head_id: form.department_head_id })
        });
        if (!res.ok) {
          const err = await res.json();
          setError(err.message || 'Failed to update department head for stage.');
          return;
        }
        // Refresh department heads and members after update
        if (fetchDepartmentHeads) await fetchDepartmentHeads();
        if (fetchDepartmentMembers) await fetchDepartmentMembers();
      } catch (err) {
        setError('Failed to update department head for stage.');
        return;
      }
    }

    // Call onSave to close modal and refresh
    onSave(form);
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
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
          onChange={e => {
            const value = e.target.value;
            console.log('Department head selected:', value);
            setForm(f => ({ ...f, department_head_id: value }));
          }}
          required
          className="input"
        >
          <option value="">Select Department Head</option>
          {uniqueDepartmentHeads.map(head => {
            console.log('Rendering department head option:', head.department_head_id, head.name, head.email);
            return (
              <option key={head.department_head_id} value={head.department_head_id}>
                {head.name} ({head.email})
              </option>
            );
          })}
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