import React, { useState } from 'react';

const DetailRow = ({ label, value, className = '' }) => (
  <div className={`flex justify-between py-2 border-b ${className}`}>
    <span className="font-medium text-gray-600">{label}</span>
    <span className="text-gray-800 text-right">{value}</span>
  </div>
);

const CartItemCard = ({ item }) => {
  // Support both an array and individual fields for 3D images
  const image3DList =
    Array.isArray(item.image3DList) && item.image3DList.length > 0
      ? item.image3DList
      : [item.image3D, item.image3D_1, item.image3D_2, item.image3D_3].filter(Boolean);

  return (
    <div className="bg-gray-50 p-3 rounded-lg border print:border-none print:shadow-none print:break-after-page">
      <div className="flex flex-row gap-4 print:flex-col">
        <div className="flex flex-row space-x-2 print:flex-col print:space-x-0 print:gap-4">
          {item.image2D && (
            <a href={item.image2D} target="_blank" rel="noopener noreferrer" title="Click to open 2D image in a new tab" className="print:w-full">
              <img src={item.image2D} alt="2D Design" className="w-24 h-20 object-contain border rounded bg-white cursor-pointer hover:opacity-80 transition-opacity print:w-full print:h-auto" />
            </a>
          )}
          {/* Render all available 3D images */}
          {image3DList.map((img, idx) => (
            <a key={img || idx} href={img} target="_blank" rel="noopener noreferrer" title={`Click to open 3D image ${idx + 1} in a new tab`} className="print:w-full">
              <img src={img} alt={`3D Design ${idx + 1}`} className="w-24 h-20 object-contain border rounded bg-white cursor-pointer hover:opacity-80 transition-opacity print:w-full print:h-auto" />
            </a>
          ))}
        </div>
        <div className="flex-1">
          <h4 className="font-bold">{item.wood_type} Organizer</h4>
          <p className="text-sm text-gray-600">
            {item.dimensions?.width}" x {item.dimensions?.depth}" x {item.dimensions?.height}"
          </p>
          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
          <p className="text-lg font-semibold text-blue-600 mt-1">${item.price?.toFixed(2)}</p>
          
          {/* Customer Notes */}
          {item.customerNotes && (
            <div className="mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
              <div className="text-xs font-medium text-blue-800 mb-1">Customer Notes:</div>
              <div className="text-sm text-blue-700">{item.customerNotes}</div>
            </div>
          )}

          {/* Drawer Photo */}
          {item.drawerPhotoUrl && (
            <div className="mt-2">
              <div className="text-xs font-medium text-gray-700 mb-1">Customer's Drawer Photo:</div>
              <a href={item.drawerPhotoUrl} target="_blank" rel="noopener noreferrer" title="Click to open drawer photo in a new tab">
                <img 
                  src={item.drawerPhotoUrl} 
                  alt="Customer's drawer" 
                  className="w-24 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function OrderDetailsModal({ order, onClose }) {
  const [activeTab, setActiveTab] = useState('details');

  if (!order) return null;

  return (
    <div className="printable-area fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-bold text-gray-800">Order Details</h3>
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.print()}
              className="no-print px-4 py-2 rounded-md text-sm font-medium bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              Print
            </button>
            <button className="no-print text-2xl font-light text-gray-500 hover:text-gray-900" onClick={onClose}>&times;</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="no-print p-2 bg-gray-50 border-b">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'details' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              Formatted Details
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'json' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              Raw JSON
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Customer & Order Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-bold text-lg mb-2">Customer</h4>
                  <DetailRow label="Name" value={order.users?.name || 'N/A'} />
                  <DetailRow label="Email" value={order.users?.email || 'N/A'} />
                  <DetailRow label="User ID" value={order.user_id} />
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-bold text-lg mb-2">Order Summary</h4>
                  <DetailRow label="Order ID" value={order.id} />
                  <DetailRow label="Status" value={order.status?.replace('_', ' ')} />
                  <DetailRow label="Operational Status" value={order.granular_status} />
                  <DetailRow label="Total Price" value={`$${order.total_price?.toFixed(2)}`} />
                  <DetailRow label="Created At" value={new Date(order.created_at).toLocaleString()} />
                </div>
              </div>

              {/* Cart Items */}
              <div>
                <h4 className="font-bold text-lg mb-2">Items Ordered</h4>
                <div className="space-y-4">
                  {order.cart_json?.map((item, index) => (
                    <CartItemCard key={item.id || index} item={item} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <pre className="bg-gray-900 text-white rounded p-4 text-xs overflow-x-auto">
              {JSON.stringify(order, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
} 