import React, { useEffect, useState, useMemo } from 'react';
import { useUser } from './UserProvider';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useDebounce } from '../hooks/useDebounce';

// This is a simplified version of the backend constants.
// In a real-world app, you might fetch this from the server or use a shared module.
const STATUSES = {
  pending: { operational_statuses: ["Awaiting Payment"] },
  in_progress: { operational_statuses: ["Payment Confirmed", "Design Review", "Material Sourcing", "Cutting & Milling", "Assembly", "Sanding & Finishing", "Final Quality Check"] },
  fulfilled: { operational_statuses: ["Packaging", "Awaiting Carrier Pickup", "Shipped", "Delivered"] },
  on_hold: { operational_statuses: ["Blocked", "On Hold - Awaiting Customer Response", "On Hold - Supply Issue", "On Hold - Shop Backlog"] },
  cancelled: { operational_statuses: ["Cancelled"] },
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

export default function Fulfillment() {
  const { user } = useUser();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [operationalStatus, setOperationalStatus] = useState('all');
  const debouncedSearch = useDebounce(search, 500); // 500ms debounce delay
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [auditedOrderId, setAuditedOrderId] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [operationsUsers, setOperationsUsers] = useState([]);

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

  // Update page title for operations users
  useEffect(() => {
    if (user && user.role === 'operations') {
      document.title = 'Fulfillment Dashboard - Drawer Organizer';
    } else if (user && user.role === 'admin') {
      document.title = 'Fulfillment Management - Drawer Organizer';
    } else {
      document.title = 'Fulfillment - Drawer Organizer';
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
    fetchOperationsUsers();
    // eslint-disable-next-line
  }, [status, operationalStatus, debouncedSearch]);

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

  async function fetchOrders() {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    let url = `/api/fulfillment/orders?status=${status}&granular_status=${operationalStatus}&search=${encodeURIComponent(debouncedSearch)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
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

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">
        {user && user.role === 'admin' ? 'Fulfillment Management' : 'Fulfillment Dashboard'}
      </h2>
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by email, order ID, tracking..."
          className="input w-full md:w-72"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="input w-full md:w-48"
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="on_hold">On Hold</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          className="input w-full md:w-48"
          value={operationalStatus}
          onChange={e => setOperationalStatus(e.target.value)}
        >
          <option value="all">All Operational Statuses</option>
          {operationalStatusOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
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
              <th className="p-3 text-left">Tracking</th>
              <th className="p-3 text-left">Total</th>
              <th className="p-3 text-left">Created</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center p-6">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={9} className="text-center p-6">No orders found.</td></tr>
            ) : orders.map(order => (
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
                  <select
                    className="input w-full"
                    value={order.assignee_id || ''}
                    onChange={e => updateOrder(order.id, { assignee_id: e.target.value || null })}
                  >
                    <option value="">Unassigned</option>
                    {operationsUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name || u.email}</option>
                    ))}
                  </select>
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
            ))}
          </tbody>
        </table>
      </div>
      {/* Order details modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-2xl relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={() => setSelectedOrder(null)}>&times;</button>
            <h3 className="text-xl font-bold mb-2">Order Details</h3>
            <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto max-h-64">{JSON.stringify(selectedOrder, null, 2)}</pre>
          </div>
        </div>
      )}
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