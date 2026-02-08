import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Printer, Truck } from 'lucide-react';
import { generatePDF } from '../utils/pdfGenerator';
import { API_BASE_URL, BASE_URL } from '../apiConfig';

const POS = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerContact, setCustomerContact] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' or 'card'
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [isDelivery, setIsDelivery] = useState(false);

    useEffect(() => {
        fetch(`${API_BASE_URL}/products`)
            .then(res => res.json())
            .then(data => setProducts(data))
            .catch(err => console.error("Error fetching products", err));
    }, []);

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            const currentQty = existing ? existing.quantity : 0;

            if (currentQty + 1 > product.stock_quantity) {
                alert(`Cannot add more "${product.name}". Only ${product.stock_quantity} in stock.`);
                return prev;
            }

            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (id, change) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + change);
                if (change > 0 && newQty > item.stock_quantity) {
                    alert(`Only ${item.stock_quantity} in stock for "${item.name}"`);
                    return item;
                }
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + (isDelivery ? parseFloat(deliveryFee || 0) : 0);

    // Simplified generatePDF call using utility

    const handleCheckout = () => {
        if (cart.length === 0) return alert("Cart is empty!");

        const orderData = {
            customer_name: customerName,
            customer_contact: customerContact,
            items: cart,
            total_amount: total,
            payment_method: paymentMethod,
            type: isDelivery ? 'delivery' : 'immediate',
            delivery_fee: isDelivery ? parseFloat(deliveryFee || 0) : 0
        };

        fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(errData => {
                        throw new Error(errData.error || "Failed to place order.");
                    });
                }
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    // Generate PDF immediately
                    generatePDF({
                        id: data.id,
                        created_at: new Date(),
                        customer_name: customerName,
                        customer_contact: customerContact,
                        items: cart,
                        total_amount: total,
                        delivery_fee: isDelivery ? (parseFloat(deliveryFee) || 0) : 0,
                        type: isDelivery ? 'delivery' : 'immediate'
                    });

                    alert(`Order Placed Successfully! Order ID: ${data.id}`);
                    setCart([]);
                    setCustomerName('');
                    setCustomerContact('');
                    setDeliveryFee(0);
                    setIsDelivery(false);
                }
            })
            .catch(err => {
                console.error(err);
                alert(err.message);
            });
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] gap-6 p-4 md:p-6">
            {/* Product Selection Area */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-1/2 md:h-full">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-200 outline-none"
                            placeholder="Search for cakes, pastries..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-auto p-4 grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map(product => (
                        <div
                            key={product.id}
                            className="border border-gray-100 rounded-lg p-3 hover:shadow-md cursor-pointer transition-shadow flex flex-col"
                            onClick={() => addToCart(product)}
                        >
                            <div className="h-24 md:h-32 bg-gray-100 rounded-md mb-2 overflow-hidden">
                                {product.image_url && (
                                    <img
                                        src={product.image_url.startsWith('http') ? product.image_url : `${BASE_URL}${product.image_url}`}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                            <h3 className="font-medium text-gray-800 text-sm md:text-base">{product.name}</h3>
                            <p className="text-pink-500 font-bold mt-auto text-sm">
                                Rs. {product.price} <span className="text-[10px] text-gray-400 font-normal uppercase">/ {product.unit || 'pcs'}</span>
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cart & Checkout Area */}
            <div className="w-full md:w-96 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-1/2 md:h-full">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Current Order</h2>
                    <span className="bg-pink-100 text-pink-600 px-2 py-1 rounded-full text-xs font-bold">{cart.length} items</span>
                </div>

                <div className="flex-1 overflow-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                        <div className="text-center text-gray-400 mt-4 md:mt-10">Cart is empty</div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-medium text-gray-800 text-sm">{item.name}</h4>
                                    <p className="text-xs text-gray-500">Rs. {item.price} <span className="text-[10px] uppercase">/ {item.unit || 'pcs'}</span> x {item.quantity}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-100 rounded"><Minus size={14} /></button>
                                    <span className="w-4 text-center text-sm">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-100 rounded"><Plus size={14} /></button>
                                    <button onClick={() => removeFromCart(item.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 text-sm">
                    <div className="space-y-2 mb-2">
                        <input
                            placeholder="Customer Name"
                            className="w-full p-2 border rounded bg-white"
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                        />
                        <input
                            placeholder="Contact Number"
                            className="w-full p-2 border rounded bg-white hidden md:block"
                            value={customerContact}
                            onChange={e => setCustomerContact(e.target.value)}
                        />
                    </div>

                    {/* Delivery Section */}
                    <div className="mb-2 p-2 bg-pink-50 rounded-lg">
                        <div className="flex items-center cursor-pointer" onClick={() => setIsDelivery(!isDelivery)}>
                            <div className={`w-4 h-4 border-2 rounded mr-2 flex items-center justify-center ${isDelivery ? 'bg-pink-500 border-pink-500' : 'border-gray-400'}`}>
                                {isDelivery && <div className="w-2 h-2 bg-white rounded-full"></div>}
                            </div>
                            <span className="font-medium text-gray-700 flex items-center"><Truck size={14} className="mr-1" /> Add Delivery</span>
                        </div>
                        {isDelivery && (
                            <div className="mt-2 flex items-center">
                                <span className="text-gray-600 mr-2">Fee: Rs.</span>
                                <input
                                    type="number"
                                    value={deliveryFee}
                                    onChange={e => setDeliveryFee(e.target.value)}
                                    className="w-20 p-1 border rounded"
                                    min="0"
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <button
                            className={`py-2 rounded flex items-center justify-center space-x-1 ${paymentMethod === 'cash' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-white border'}`}
                            onClick={() => setPaymentMethod('cash')}
                        >
                            <Banknote size={16} /> <span>Cash</span>
                        </button>
                        <button
                            className={`py-2 rounded flex items-center justify-center space-x-1 ${paymentMethod === 'card' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-white border'}`}
                            onClick={() => setPaymentMethod('card')}
                        >
                            <CreditCard size={16} /> <span>Card</span>
                        </button>
                    </div>

                    <div className="space-y-1 mb-2">
                        <div className="flex justify-between text-gray-500">
                            <span>Subtotal</span><span>Rs. {subtotal.toFixed(2)}</span>
                        </div>
                        {isDelivery && (
                            <div className="flex justify-between text-pink-600">
                                <span>Delivery</span><span>Rs. {parseFloat(deliveryFee || 0).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-lg text-gray-800">
                            <span>Total</span><span>Rs. {total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-lg font-bold flex items-center justify-center space-x-2 transition-colors"
                    >
                        <Printer size={18} /> <span>Print & Download PDF</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default POS;
