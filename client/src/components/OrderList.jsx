import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, CheckCircle, Clock as Pending, Download, Trash2, XCircle } from 'lucide-react';
import { generatePDF } from '../utils/pdfGenerator';

const OrderList = () => {
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('all'); // 'all', 'immediate', 'advance'
    const [selectedIds, setSelectedIds] = useState([]);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const token = localStorage.getItem('token');

    const fetchOrders = () => {
        fetch('/api/orders')
            .then(res => res.json())
            .then(data => setOrders(data))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const filteredOrders = filter === 'all'
        ? orders
        : orders.filter(o => o.type === filter);

    const handleDownload = async (orderId) => {
        try {
            console.log("Starting download for order:", orderId);
            const res = await fetch(`/api/orders/${orderId}`);

            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                console.error("Non-JSON response received:", text);
                throw new Error("Server returned an invalid response (not JSON).");
            }

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to fetch order details');
            }
            const fullOrder = await res.json();

            if (!fullOrder.items || fullOrder.items.length === 0) {
                throw new Error("This order has no items to display on the bill.");
            }

            await generatePDF(fullOrder);
        } catch (err) {
            console.error("Critical error in handleDownload:", err);
            alert(`Download Error: ${err.message}`);
        }
    };

    const toggleItems = async (orderId) => {
        if (expandedOrderId === orderId) {
            setExpandedOrderId(null);
            return;
        }

        try {
            const res = await fetch(`/api/orders/${orderId}`);
            if (res.ok) {
                const fullOrder = await res.json();
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, items: fullOrder.items } : o));
                setExpandedOrderId(orderId);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm("Are you sure you want to delete this order?")) return;
        const freshToken = localStorage.getItem('token');
        if (!freshToken) {
            alert("Your session has expired. Please log in again.");
            return;
        }

        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${freshToken}` }
            });
            if (res.ok) {
                fetchOrders();
                setSelectedIds([]);
                setExpandedOrderId(null);
            } else {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Server responded with ${res.status}`);
            }
        } catch (err) {
            console.error(err);
            alert(`Deletion failed: ${err.message}`);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected orders?`)) return;

        const freshToken = localStorage.getItem('token');
        if (!freshToken) {
            alert("Your session has expired. Please log in again.");
            return;
        }

        try {
            const res = await fetch(`/api/orders/bulk-delete`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${freshToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ids: selectedIds })
            });
            if (res.ok) {
                fetchOrders();
                setSelectedIds([]);
                setExpandedOrderId(null);
            } else {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Server responded with ${res.status}`);
            }
        } catch (err) {
            console.error(err);
            alert(`Bulk deletion failed: ${err.message}`);
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredOrders.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredOrders.map(o => o.id));
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm("WARNING: This will delete ALL orders. This cannot be undone. Proceed?")) return;
        const freshToken = localStorage.getItem('token');
        if (!freshToken) {
            alert("Your session has expired. Please log in again.");
            return;
        }

        try {
            const res = await fetch(`/api/orders`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${freshToken}` }
            });
            if (res.ok) {
                fetchOrders();
                setSelectedIds([]);
                setExpandedOrderId(null);
            } else {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Server responded with ${res.status}`);
            }
        } catch (err) {
            console.error(err);
            alert(`Clear all failed: ${err.message}`);
        }
    };

    return (
        <div className="p-4 md:p-6 pb-20 md:pb-6">
            <div className="flex flex-col space-y-4 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Order Tracking</h1>
                    <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                        <button
                            onClick={handleClearAll}
                            className="flex items-center space-x-1 text-red-500 whitespace-nowrap bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium"
                        >
                            <XCircle size={16} /> <span>Clear All</span>
                        </button>
                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center space-x-1 text-white whitespace-nowrap bg-red-500 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm"
                            >
                                <Trash2 size={16} /> <span>Delete ({selectedIds.length})</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-4">
                    <button
                        onClick={toggleSelectAll}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg"
                    >
                        {selectedIds.length === filteredOrders.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <div className="h-6 w-px bg-gray-200"></div>
                    <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === 'all' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'}`}>All</button>
                    <button onClick={() => setFilter('immediate')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === 'immediate' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'}`}>Immediate</button>
                    <button onClick={() => setFilter('advance')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === 'advance' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'}`}>Advance</button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredOrders.length === 0 ? (
                    <div className="text-center text-gray-500 py-10 bg-white rounded-xl border border-dashed border-gray-200">No orders found.</div>
                ) : (
                    filteredOrders.map(order => (
                        <div key={order.id} className={`bg-white rounded-xl shadow-sm border transition-all overflow-hidden ${selectedIds.includes(order.id) ? 'border-pink-300 ring-1 ring-pink-100' : 'border-gray-100'}`}>
                            <div className="p-4 md:p-6">
                                <div className="flex items-start space-x-3 md:space-x-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(order.id)}
                                        onChange={() => toggleSelect(order.id)}
                                        className="mt-1 w-5 h-5 rounded border-gray-300 text-pink-500 focus:ring-pink-500 cursor-pointer"
                                    />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <h3 className="text-lg font-bold text-gray-800">#{order.id}</h3>
                                                {order.type === 'advance' && <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-[10px] rounded-full font-bold uppercase tracking-wider">Advance</span>}
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteOrder(order.id)}
                                                className="text-red-400 hover:text-red-600 p-2 -mt-2 -mr-2 transition-colors flex items-center justify-center rounded-full hover:bg-red-50"
                                                title="Delete Order"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-500 mb-4">
                                            <div className="flex items-center truncate"><User size={14} className="mr-2 flex-shrink-0" /> <span className="truncate">{order.customer_name || 'Walk-in Customer'}</span></div>
                                            {order.customer_contact && <div className="flex items-center"><Phone size={14} className="mr-2 flex-shrink-0" /> {order.customer_contact}</div>}
                                            <div className="flex items-center"><Calendar size={14} className="mr-2 flex-shrink-0" /> {new Date(order.created_at).toLocaleDateString()}</div>
                                            {order.pickup_datetime && (
                                                <div className="flex items-center text-pink-600 font-medium">
                                                    <Clock size={14} className="mr-2 flex-shrink-0" /> Pickup: {new Date(order.pickup_datetime).toLocaleString()}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-4 border-t border-gray-50">
                                            <div>
                                                <h4 className="text-xl md:text-2xl font-black text-gray-800">Rs. {parseFloat(order.total_amount).toFixed(2)}</h4>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{order.payment_method}</p>
                                            </div>
                                            <div className="flex items-center space-x-3 w-full sm:w-auto">
                                                <button
                                                    onClick={() => toggleItems(order.id)}
                                                    className="flex-1 sm:flex-none text-xs font-bold text-pink-500 hover:bg-pink-50 px-3 py-2 rounded-lg border border-pink-100 transition-colors"
                                                >
                                                    {expandedOrderId === order.id ? 'Hide Details' : 'View Items'}
                                                </button>
                                                <button
                                                    onClick={() => handleDownload(order.id)}
                                                    className="flex-1 sm:flex-none bg-pink-500 hover:bg-pink-600 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
                                                    title="Download PDF"
                                                >
                                                    <Download size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        {expandedOrderId === order.id && order.items && (
                                            <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-2">
                                                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Order Items</h5>
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm">
                                                        <span className="text-gray-700 font-medium">{item.quantity}x {item.name}</span>
                                                        <span className="text-gray-500">Rs. {(item.price_at_sale * item.quantity).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                                {order.delivery_fee > 0 && (
                                                    <div className="flex justify-between text-sm text-pink-600 pt-2 border-t border-gray-200">
                                                        <span className="font-bold">Delivery Fee</span>
                                                        <span>Rs. {parseFloat(order.delivery_fee).toFixed(2)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default OrderList;
