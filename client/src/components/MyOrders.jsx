import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from './UserProvider';

const statusColors = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function MyOrders() {
  const { user } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await axios.get('/api/order/user/' + user.id);
        setOrders(data.orders || []);
      } catch (err) {
        setError('Failed to fetch orders.');
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchOrders();
  }, [user]);

  if (loading) return <div className="p-8 text-center">Loading your orders...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  if (!orders.length) {
    return (
      <div className="p-8 text-center text-slate-600">
        <div className="text-2xl font-bold mb-2">No Orders Yet</div>
        <div className="mb-4">You haven't placed any orders yet.</div>
        <a href="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold">Start Shopping</a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h2 className="text-3xl font-bold mb-6 text-center">My Orders</h2>
      <div className="grid gap-6">
        {orders.map(order => (
          <div key={order.id} className="bg-white shadow rounded-lg p-6 flex flex-col gap-2 border">
            <div className="flex flex-wrap justify-between items-center mb-2">
              <div className="text-lg font-semibold text-slate-800">Order #{order.id}</div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>{order.status}</span>
            </div>
            <div className="flex flex-wrap justify-between items-center text-sm text-slate-600 mb-2">
              <div>Placed: {new Date(order.created_at).toLocaleString()}</div>
              <div>Total: <span className="font-bold text-blue-700">${order.total_price?.toFixed(2)}</span></div>
            </div>
            <div className="flex flex-wrap gap-4 mt-2">
              {(order.cart_json || []).map((item, idx) => (
                <div key={idx} className="flex flex-col items-center border rounded p-2 bg-slate-50 min-w-[120px]">
                  <img src={item.image2D || item.image3D} alt="Design" className="w-16 h-12 object-contain mb-1 border" />
                  <div className="text-xs text-slate-700 font-medium">{item.dimensions.width}" × {item.dimensions.depth}" × {item.dimensions.height}"</div>
                  <div className="text-xs text-slate-500">Qty: {item.quantity || 1}</div>
                  <div className="text-xs text-blue-700 font-bold">${item.price?.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 