import React, { useEffect, useState } from 'react';
import { useUser } from './UserProvider';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useDebounce } from '../hooks/useDebounce';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  fulfilled: 'bg-green-100 text-green-800',
  blocked: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function Fulfillment() {
  const { user } = useUser();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const debouncedSearch = useDebounce(search, 500); // 500ms debounce delay
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showAudit, setShowAudit] = useState(false);
  const [auditLog, setAuditLog] = useState([]);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, [status, debouncedSearch]);

  async function fetchOrders() {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    let url = `/api/fulfillment/orders?status=${status}&search=${encodeURIComponent(debouncedSearch)}`;
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
    if (res.ok) fetchOrders();
  }

  async function openAuditLog(orderId) {
    setShowAudit(true);
    setAuditLog([]);
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
      <h2 className="text-2xl font-bold mb-4">Fulfillment Dashboard</h2>
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
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left">Order ID</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Tracking</th>
              <th className="p-3 text-left">Total</th>
              <th className="p-3 text-left">Created</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center p-6">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="text-center p-6">No orders found.</td></tr>
            ) : orders.map(order => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-mono text-xs">{order.id.slice(0, 8)}</td>
                <td className="p-3">
                  <div className="font-medium">{order.users?.name || 'N/A'}</div>
                  <div className="text-xs text-gray-500">{order.users?.email}</div>
                </td>
                <td className="p-3">
                  <select
                    className={`rounded px-2 py-1 ${STATUS_COLORS[order.status]}`}
                    value={order.status}
                    onChange={e => updateOrder(order.id, { status: e.target.value })}
                  >
                    {STATUS_OPTIONS.filter(opt => opt.value !== 'all').map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
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
      {showAudit && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-2xl relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={() => setShowAudit(false)}>&times;</button>
            <h3 className="text-xl font-bold mb-2">Order Audit Log</h3>
            <div className="overflow-y-auto max-h-64">
              {auditLog.length === 0 ? (
                <div className="text-gray-500">No audit log entries.</div>
              ) : auditLog.map(entry => (
                <div key={entry.id} className="mb-2 p-2 border rounded bg-gray-50">
                  <div className="text-xs text-gray-600 mb-1">{new Date(entry.created_at).toLocaleString()} by {entry.users?.email || entry.updated_by}</div>
                  <div className="text-sm font-semibold">{entry.action}</div>
                  <div className="text-xs text-gray-700">{entry.notes}</div>
                  <pre className="bg-gray-100 rounded p-1 text-xs overflow-x-auto">{JSON.stringify(entry.new_values, null, 2)}</pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 