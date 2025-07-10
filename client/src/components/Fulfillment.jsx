import React, { useEffect, useState, useMemo } from 'react';
import { useUser } from './UserProvider';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useDebounce } from '../hooks/useDebounce';
import apiClient from '../utils/apiClient';
import OrderDetailsModal from './OrderDetailsModal';

// This is a simplified version of the backend constants.
// In a real-world app, you might fetch this from the server or use a shared module.
const STATUSES = {
  pending: { label: "Pending", operational_statuses: ["Awaiting Payment"] },
  in_progress: { label: "In Progress", operational_statuses: ["Payment Confirmed", "Design Review", "Material Sourcing", "Cutting & Milling", "Assembly", "Sanding & Finishing", "Final Quality Check"] },
  fulfilled: { label: "Fulfilled", operational_statuses: ["Packaging", "Awaiting Carrier Pickup", "Shipped", "Delivered"] },
  on_hold: { label: "On Hold", operational_statuses: ["Blocked", "On Hold - Awaiting Customer Response", "On Hold - Supply Issue", "On Hold - Shop Backlog"] },
  cancelled: { label: "Cancelled", operational_statuses: ["Cancelled"] },
};

const GRANULAR_STATUS_OPTIONS = [
  // pending
  "Awaiting Payment",
  // in_progress
  "Payment Confirmed",
  "Design Review",
  "Material Sourcing",
  "Cutting & Milling",
  "Assembly",
  "Sanding & Finishing",
  "Final Quality Check",
  // fulfilled
  "Packaging",
  "Awaiting Carrier Pickup",
  "Shipped",
  "Delivered",
  // on_hold
  "Blocked",
  "On Hold - Awaiting Customer Response",
  "On Hold - Supply Issue",
  "On Hold - Shop Backlog",
  // cancelled
  "Cancelled",
];

const STATUS_COLORS = {
  // pending
  "Awaiting Payment": "bg-yellow-100 text-yellow-800",
  // in_progress
  "Payment Confirmed": "bg-blue-100 text-blue-800",
  "Design Review": "bg-blue-100 text-blue-800",
  "Material Sourcing": "bg-blue-100 text-blue-800",
  "Cutting & Milling": "bg-blue-100 text-blue-800",
  "Assembly": "bg-blue-100 text-blue-800",
  "Sanding & Finishing": "bg-blue-100 text-blue-800",
  "Final Quality Check": "bg-blue-100 text-blue-800",
  // fulfilled
  "Packaging": "bg-green-100 text-green-800",
  "Awaiting Carrier Pickup": "bg-green-100 text-green-800",
  "Shipped": "bg-green-100 text-green-800",
  "Delivered": "bg-green-100 text-green-800",
  // on_hold
  "Blocked": "bg-red-100 text-red-800",
  "On Hold - Awaiting Customer Response": "bg-red-100 text-red-800",
  "On Hold - Supply Issue": "bg-red-100 text-red-800",
  "On Hold - Shop Backlog": "bg-red-100 text-red-800",
  // cancelled
  "Cancelled": "bg-gray-100 text-gray-800",
};

function AssigneeDropdown({ order, departmentHeads, fetchDepartmentMembers, updateOrder }) {
  const [options, setOptions] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    async function loadOptions() {
      setLoading(true);
      const stage = order.granular_status;
      const deptHead = departmentHeads.find(dh => dh.stage === stage);
      let members = await fetchDepartmentMembers(stage);
      let opts = [];
      // Only include department head for the stage
      if (deptHead) {
        opts.push({ id: deptHead.department_head_id || deptHead.id, name: deptHead.name || '[No Name]', email: deptHead.email || '[No Email]', role: 'department_head' });
      }
      // Add department members for the stage
      if (members && members.length > 0) {
        opts = opts.concat(members.map(m => ({ id: m.id, name: m.name, email: m.email, role: 'department_member' })));
      }
      // Deduplicate by id
      const uniqueOpts = Array.from(new Map(opts.map(o => [o.id, o])).values());
      setOptions(uniqueOpts);
      setLoading(false);
      // If the current assignee is not valid, auto-select department head
      const validIds = uniqueOpts.map(o => o.id);
      if (order.assignee && !validIds.includes(order.assignee.id) && deptHead) {
        updateOrder(order.id, { assignee_id: deptHead.department_head_id || deptHead.id });
      }
    }
    loadOptions();
    // eslint-disable-next-line
  }, [order.granular_status, departmentHeads]);

  // Find the selected option for display
  const selectedOption = options.find(opt => opt.id === order.assignee?.id);
  const selectedLabel = selectedOption
    ? `${selectedOption.name} (${selectedOption.email})`
    : 'Unassigned';

  return (
    <select
      className="rounded px-2 py-1 border"
      value={order.assignee?.id || ''}
      onChange={e => updateOrder(order.id, { assignee_id: e.target.value })}
      disabled={loading}
    >
      <option value="">Unassigned</option>
      {options.map(opt => (
        <option key={opt.id} value={opt.id}>
          {opt.name} ({opt.email}){opt.role === 'department_head' ? ' [Head]' : ''}
        </option>
      ))}
    </select>
  );
}

export default function Fulfillment() {
  const { user } = useUser();
  const [orders, setOrders] = useState([]); // all orders fetched from API
  const [filteredOrders, setFilteredOrders] = useState([]); // orders after in-memory search filter
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [operationalStatus, setOperationalStatus] = useState('all');
  const [assignee, setAssignee] = useState('all');
  const debouncedSearch = useDebounce(search, 500); // 500ms debounce delay
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [auditedOrderId, setAuditedOrderId] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [operationsUsers, setOperationsUsers] = useState([]);
  const [departmentHeads, setDepartmentHeads] = useState([]);
  const [departmentMembers, setDepartmentMembers] = useState({});

  const operationalStatusOptions = useMemo(() => {
    if (status === 'all') {
      return GRANULAR_STATUS_OPTIONS;
    }
    return STATUSES[status]?.operational_statuses || [];
  }, [status]);

  useEffect(() => {
    // If the selected operational status is no longer valid for the new customer status, reset it.
    if (operationalStatus !== 'all' && !operationalStatusOptions.includes(operationalStatus)) {
      setOperationalStatus('all');
    }
  }, [status, operationalStatus, operationalStatusOptions]);

  // Fetch all orders (without search param)
  const fetchOrders = async () => {
    setLoading(true);
    try {
      let params;
      if (user?.role === 'department_head' || user?.role === 'department_member') {
        params = {};
      } else {
        params = {
          status,
          granular_status: operationalStatus,
          assignee,
        };
      }
      const { data } = await apiClient.get('/fulfillment/orders', { params });
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // In-memory search and filter
  useEffect(() => {
    const searchLower = search.toLowerCase();
    setFilteredOrders(
      orders.filter(order =>
        // Status filter
        (status === 'all' || order.status === status) &&
        // Operational status filter
        (operationalStatus === 'all' || order.granular_status === operationalStatus) &&
        // Search filter
        (
          (order.id && order.id.toLowerCase().includes(searchLower)) ||
          (order.users && order.users.email && order.users.email.toLowerCase().includes(searchLower)) ||
          (order.tracking_number && order.tracking_number.toLowerCase().includes(searchLower)) ||
          (order.users && order.users.name && order.users.name.toLowerCase().includes(searchLower))
        )
      )
    );
  }, [search, orders, status, operationalStatus]);

  // Fetch orders when filters (except search) change
  useEffect(() => {
    fetchOrders();
    fetchOperationsUsers();
    fetchDepartmentHeads();
    // eslint-disable-next-line
  }, [status, operationalStatus, assignee]);

  async function fetchOperationsUsers() {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    const res = await fetch('/api/fulfillment/operations-users', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (data.success) {
      setOperationsUsers(data.users);
    }
  }

  async function fetchDepartmentHeads() {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    const res = await fetch('/api/fulfillment/department-heads', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    console.log('Fetched department heads:', data);
    if (data.success) setDepartmentHeads(data.department_heads);
  }

  async function updateOrder(orderId, updates) {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    const res = await fetch(`/api/fulfillment/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(updates),
    });

    if (res.ok) {
      fetchOrders();
      if (auditedOrderId === orderId) {
        openAuditLog(orderId, false);
      }
    } else {
      const data = await res.json().catch(() => ({})); // Handle cases where body is not JSON
      alert('Failed to update order: ' + (data.message || 'Unknown server error'));
    }
  }

  async function openAuditLog(orderId, clearPrevious = true) {
    setAuditedOrderId(orderId);
    if (clearPrevious) {
      setAuditLog([]);
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    const res = await fetch(`/api/fulfillment/orders/${orderId}/audit`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    setAuditLog(data.auditLog || []);
  }

  async function fetchDepartmentMembers(stage) {
    if (!stage) return [];
    if (departmentMembers[stage]) return departmentMembers[stage];
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    const res = await fetch(`/api/fulfillment/department-members?stage=${encodeURIComponent(stage)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (data.members) {
      setDepartmentMembers(prev => ({ ...prev, [stage]: data.members }));
      return data.members;
    }
    return [];
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Fulfillment Dashboard</h2>
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="flex-grow min-w-[200px]">
          <input
            type="text"
            placeholder="Search by email, order ID, tracking..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        {/* Only show filters for admin/operations */}
        {!(user?.role === 'department_head' || user?.role === 'department_member') && (
          <>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white"
            >
              <option value="all">All Statuses</option>
              {Object.keys(STATUSES).map(statusKey => (
                <option key={statusKey} value={statusKey}>
                  {STATUSES[statusKey].label}
                </option>
              ))}
            </select>
            <select
              value={operationalStatus}
              onChange={(e) => setOperationalStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white"
              disabled={operationalStatusOptions.length === 0}
            >
              <option value="all">All Operational Statuses</option>
              {operationalStatusOptions.map(opStatus => (
                <option key={opStatus} value={opStatus}>
                  {opStatus}
                </option>
              ))}
            </select>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white"
            >
              <option value="all">All Assignees</option>
              {departmentHeads.map(dh => (
                <option key={dh.id} value={dh.email}>{dh.name} ({dh.email})</option>
              ))}
            </select>
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold ml-2"
              onClick={() => {
                setStatus('all');
                setOperationalStatus('all');
                setAssignee('all');
                setSearch('');
              }}
            >
              Clear All Filters
            </button>
          </>
        )}
      </div>
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left">Order ID</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Status (Customer)</th>
              <th className="p-3 text-left">Status (Operational)</th>
              <th className="p-3 text-left">Assignee</th>
              <th className="p-3 text-left">Task Status</th>
              <th className="p-3 text-left">Tracking</th>
              <th className="p-3 text-left">Total</th>
              <th className="p-3 text-left">Created</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center p-6">Loading...</td></tr>
            ) : filteredOrders.length === 0 ? (
              <tr><td colSpan={10} className="text-center p-6">No orders found.</td></tr>
            ) : filteredOrders.map(order => {
              const isAssignedHead = user?.role === 'department_head' && order.current_department_head_id === user.id;
              const isAssignedMember = user?.role === 'department_member' && order.current_department_member_id === user.id;
              return (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{order.id.slice(0, 8)}</td>
                  <td className="p-3">
                    <div className="font-medium">{order.users?.name || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{order.users?.email}</div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      {
                        pending: 'bg-yellow-200 text-yellow-900',
                        in_progress: 'bg-blue-200 text-blue-900',
                        fulfilled: 'bg-green-200 text-green-900',
                        on_hold: 'bg-red-200 text-red-900',
                        cancelled: 'bg-gray-200 text-gray-900'
                      }[order.status]
                    }`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3">
                    <select
                      className={`rounded px-2 py-1 w-full ${STATUS_COLORS[order.granular_status] || 'bg-gray-100'}`}
                      value={order.granular_status}
                      onChange={e => updateOrder(order.id, { granular_status: e.target.value })}
                    >
                      {GRANULAR_STATUS_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    {/* Assignee Dropdown for admin, operations, and department head; read-only for others */}
                    {['admin', 'operations', 'department_head'].includes(user?.role) ? (
                      <AssigneeDropdown
                        order={order}
                        departmentHeads={departmentHeads}
                        fetchDepartmentMembers={fetchDepartmentMembers}
                        updateOrder={updateOrder}
                      />
                    ) : (
                      <span>
                        {order.assignee ? `${order.assignee.name} (${order.assignee.email})` : 'Unassigned'}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {/* Task Status Dropdown or Text */}
                    {(isAssignedHead || isAssignedMember) ? (
                      <select
                        className="rounded px-2 py-1 border"
                        value={order.task_status || 'in-progress'}
                        onChange={e => {
                          // PATCH /orders/:orderId/task-status
                          const newStatus = e.target.value;
                          const updateTaskStatus = async () => {
                            const { data: sessionData } = await supabase.auth.getSession();
                            const accessToken = sessionData?.session?.access_token;
                            const res = await fetch(`/api/fulfillment/orders/${order.id}/task-status`, {
                              method: 'PATCH',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${accessToken}`,
                              },
                              body: JSON.stringify({ task_status: newStatus }),
                            });
                            if (res.ok) {
                              fetchOrders();
                            } else {
                              const data = await res.json().catch(() => ({}));
                              alert('Failed to update task status: ' + (data.message || 'Unknown server error'));
                            }
                          };
                          updateTaskStatus();
                        }}
                      >
                        <option value="in-progress">In Progress</option>
                        <option value="complete">Complete</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100">
                        {order.task_status || 'in-progress'}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <input
                      className="input w-32"
                      value={order.tracking_number || ''}
                      placeholder="Tracking #"
                      onChange={e => updateOrder(order.id, { tracking_number: e.target.value })}
                    />
                    <div className="text-xs text-gray-500">{order.tracking_carrier}</div>
                  </td>
                  <td className="p-3">${order.total_price?.toFixed(2)}</td>
                  <td className="p-3">{new Date(order.created_at).toLocaleString()}</td>
                  <td className="p-3 flex gap-2">
                    <button
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      onClick={() => setSelectedOrder(order)}
                    >View</button>
                    <button
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      onClick={() => openAuditLog(order.id)}
                    >Audit</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <OrderDetailsModal 
        order={selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        operationsUsers={operationsUsers}
        onOrderUpdate={fetchOrders}
      />

      {/* Audit log modal */}
      {auditedOrderId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-2xl relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={() => setAuditedOrderId(null)}>&times;</button>
            <h3 className="text-xl font-bold mb-2">Order Audit Log</h3>
            <div className="overflow-y-auto max-h-64">
              {auditLog.length === 0 ? (
                <div className="text-gray-500">No audit log entries.</div>
              ) : auditLog.map(entry => (
                <div key={entry.id} className="mb-2 p-2 border rounded bg-gray-50">
                  <div className="text-xs text-gray-600 mb-1">{new Date(entry.created_at).toLocaleString()} by {entry.users?.email || entry.updated_by}</div>
                  <div className="text-sm font-semibold">{entry.action}</div>
                  <div className="text-xs text-gray-700">{entry.notes}</div>
                  {entry.new_values && (
                    <pre className="bg-gray-100 rounded p-1 text-xs overflow-x-auto">
                      {typeof entry.new_values === 'string' 
                        ? JSON.stringify(JSON.parse(entry.new_values), null, 2)
                        : JSON.stringify(entry.new_values, null, 2)
                      }
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 