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
    <div className="w-full py-4 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">My Orders</h2>
        <div className="grid gap-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white shadow rounded-lg p-4 flex flex-col gap-3 border">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div className="text-base font-semibold text-slate-800">Order #{order.id.slice(0, 8)}</div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-slate-600">Placed: {new Date(order.created_at).toLocaleDateString()}</div>
                <div className="text-sm text-slate-600">Total: <span className="font-bold text-blue-700">${order.total_price?.toFixed(2)}</span></div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>{order.status}</span>
              </div>
            </div>
            {/* Addresses */}
            {(order.billing_street || order.shipping_street) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 rounded">
                <div>
                  <h4 className="font-semibold text-xs text-gray-700 mb-1">Billing Address</h4>
                  <div className="text-xs text-gray-600 leading-relaxed">
                    {order.billing_street && <div>{order.billing_street}</div>}
                    {order.billing_city && order.billing_state && (
                      <div>{order.billing_city}, {order.billing_state} {order.billing_zip}</div>
                    )}
                    {order.billing_country && <div>{order.billing_country}</div>}
                    {order.billing_phone && <div className="mt-0.5">Phone: {order.billing_phone}</div>}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-gray-700 mb-1">Shipping Address</h4>
                  <div className="text-xs text-gray-600 leading-relaxed">
                    {order.shipping_street && <div>{order.shipping_street}</div>}
                    {order.shipping_city && order.shipping_state && (
                      <div>{order.shipping_city}, {order.shipping_state} {order.shipping_zip}</div>
                    )}
                    {order.shipping_country && <div>{order.shipping_country}</div>}
                    {order.shipping_phone && <div className="mt-0.5">Phone: {order.shipping_phone}</div>}
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              {(order.cart_json || []).map((item, idx) => (
                <div key={idx} className="flex flex-col border rounded p-3 bg-slate-50 w-full">
                  <div className="flex flex-row gap-4 mb-3">
                    {item.image2D && (
                      <div className="flex flex-col items-center flex-1">
                        <div className="text-xs text-gray-500 mb-2 font-medium">2D View</div>
                        <div className="w-full max-w-md h-[300px] border rounded bg-white shadow-sm flex items-center justify-center">
                          <img src={item.image2D} alt="2D Design" className="w-full h-full object-contain" />
                        </div>
                      </div>
                    )}
                    {item.image3D && (
                      <div className="flex flex-col items-center flex-1">
                        <div className="text-xs text-gray-500 mb-2 font-medium">3D View</div>
                        <div className="w-full max-w-md h-[300px] border rounded bg-white shadow-sm flex items-center justify-center">
                          <img src={item.image3D} alt="3D Design" className="w-full h-full object-contain" />
                        </div>
                      </div>
                    )}
                    {!item.image2D && !item.image3D && (
                      <div className="w-full h-48 border rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400">No Image</div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 items-center justify-center">
                    <div className="text-xs text-slate-700 font-medium">{item.dimensions?.width || 'N/A'}" × {item.dimensions?.depth || 'N/A'}" × {item.dimensions?.height || 'N/A'}"</div>
                    <div className="text-xs text-slate-500">Qty: {item.quantity || 1}</div>
                    <div className="text-sm text-blue-700 font-bold">${item.price?.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
} 