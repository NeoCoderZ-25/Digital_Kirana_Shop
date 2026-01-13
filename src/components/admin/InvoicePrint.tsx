import { forwardRef } from 'react';
import { format } from 'date-fns';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { name: string } | null;
  variant: { name: string } | null;
}

interface InvoicePrintProps {
  order: {
    id: string;
    created_at: string;
    status: string;
    total_price: number;
    payment_method: string;
    payment_status: string;
    address: {
      label: string;
      address: string;
      phone: string | null;
      city: string | null;
      state: string | null;
      pincode: string | null;
    } | null;
    profile: { username: string; email: string; phone: string | null } | null;
    items: OrderItem[];
  };
}

const InvoicePrint = forwardRef<HTMLDivElement, InvoicePrintProps>(({ order }, ref) => {
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryCharge = subtotal >= 499 ? 0 : 40;

  return (
    <div ref={ref} className="p-8 bg-white text-black min-h-screen" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
        <div>
          <h1 className="text-3xl font-bold">INVOICE</h1>
          <p className="text-gray-600 mt-1">Tax Invoice / Bill of Supply</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold">Your Store Name</h2>
          <p className="text-sm text-gray-600">123 Business Street</p>
          <p className="text-sm text-gray-600">City, State - 123456</p>
          <p className="text-sm text-gray-600">GSTIN: 00AAAAA0000A1Z5</p>
        </div>
      </div>

      {/* Order Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-bold text-gray-700 mb-2">Bill To:</h3>
          <p className="font-semibold">{order.profile?.username || 'Customer'}</p>
          {order.address && (
            <>
              <p className="text-sm">{order.address.address}</p>
              <p className="text-sm">
                {order.address.city}, {order.address.state} - {order.address.pincode}
              </p>
            </>
          )}
          {order.profile?.phone && <p className="text-sm">Phone: {order.profile.phone}</p>}
          {order.profile?.email && <p className="text-sm">Email: {order.profile.email}</p>}
        </div>
        <div className="text-right">
          <table className="ml-auto text-sm">
            <tbody>
              <tr>
                <td className="pr-4 py-1 text-gray-600">Invoice No:</td>
                <td className="font-semibold">INV-{order.id.slice(0, 8).toUpperCase()}</td>
              </tr>
              <tr>
                <td className="pr-4 py-1 text-gray-600">Order ID:</td>
                <td className="font-semibold">{order.id.slice(0, 8).toUpperCase()}</td>
              </tr>
              <tr>
                <td className="pr-4 py-1 text-gray-600">Date:</td>
                <td className="font-semibold">{format(new Date(order.created_at), 'PPP')}</td>
              </tr>
              <tr>
                <td className="pr-4 py-1 text-gray-600">Payment:</td>
                <td className="font-semibold capitalize">{order.payment_method}</td>
              </tr>
              <tr>
                <td className="pr-4 py-1 text-gray-600">Status:</td>
                <td className="font-semibold capitalize">{order.payment_status}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-8">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left p-3 border">S.No</th>
            <th className="text-left p-3 border">Item Description</th>
            <th className="text-center p-3 border">Qty</th>
            <th className="text-right p-3 border">Unit Price</th>
            <th className="text-right p-3 border">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, index) => (
            <tr key={item.id}>
              <td className="p-3 border">{index + 1}</td>
              <td className="p-3 border">
                {item.product?.name || 'Product'}
                {item.variant && <span className="text-gray-600 text-sm"> ({item.variant.name})</span>}
              </td>
              <td className="text-center p-3 border">{item.quantity}</td>
              <td className="text-right p-3 border">₹{item.price.toFixed(2)}</td>
              <td className="text-right p-3 border">₹{(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <table className="w-64">
          <tbody>
            <tr>
              <td className="py-2 text-gray-600">Subtotal:</td>
              <td className="py-2 text-right">₹{subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="py-2 text-gray-600">Delivery Charges:</td>
              <td className="py-2 text-right">{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge.toFixed(2)}`}</td>
            </tr>
            <tr className="border-t-2 border-black font-bold text-lg">
              <td className="py-3">Grand Total:</td>
              <td className="py-3 text-right">₹{order.total_price.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-t pt-4 text-center text-sm text-gray-600">
        <p>Thank you for your business!</p>
        <p className="mt-2">This is a computer-generated invoice. No signature required.</p>
      </div>
    </div>
  );
});

InvoicePrint.displayName = 'InvoicePrint';

export default InvoicePrint;
