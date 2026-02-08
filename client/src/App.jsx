import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Box, ClipboardList, Package, FileBarChart, LogOut, Menu, X } from 'lucide-react';

import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import POS from './components/POS';
import OrderList from './components/OrderList';
import Inventory from './components/Inventory';
import Reports from './components/Reports';
import Login from './components/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

const SidebarLink = ({ to, icon: Icon, label, onClick }) => (
    <Link
        to={to}
        onClick={onClick}
        className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-pink-100 hover:text-pink-600 transition-colors"
    >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
    </Link>
);

const ProtectedRoute = ({ children }) => {
    const { token } = useAuth();
    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

const Layout = () => {
    const { logout, user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMenu = () => setIsMobileMenuOpen(false);

    return (
        <div className="flex h-screen bg-gray-50 flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden bg-white p-4 flex justify-between items-center shadow-sm z-20">
                <div className="flex items-center space-x-2">
                    <img src="/logo.png" alt="Logo" className="h-8" />
                    <h1 className="text-xl font-bold text-pink-500">Rishi's Cake</h1>
                </div>
                <button onClick={toggleMenu} className="p-2 text-gray-600">
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar Overlay for Mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
                    onClick={closeMenu}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:translate-x-0 transition-transform duration-200 ease-in-out
                w-64 bg-white shadow-lg border-r border-gray-100 flex flex-col z-20
            `}>
                <div className="p-6 border-b border-gray-100 hidden md:block text-center">
                    <img src="/logo.png" alt="Rishi's Cake House" className="h-16 mx-auto mb-3" />
                    <h1 className="text-xl font-bold text-pink-500">Rishi's Cake House</h1>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Baking happiness since 2014</p>
                </div>

                <nav className="p-4 space-y-2 flex-1">
                    <SidebarLink to="/" icon={LayoutDashboard} label="Dashboard" onClick={closeMenu} />
                    <SidebarLink to="/products" icon={Package} label="Products" onClick={closeMenu} />
                    <SidebarLink to="/billing" icon={ShoppingCart} label="Billing" onClick={closeMenu} />
                    <SidebarLink to="/orders" icon={ClipboardList} label="Orders" onClick={closeMenu} />
                    <SidebarLink to="/inventory" icon={Box} label="Inventory" onClick={closeMenu} />
                    <SidebarLink to="/reports" icon={FileBarChart} label="Reports" onClick={closeMenu} />
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <span className="text-sm font-bold text-gray-600 truncate max-w-[100px]">{user?.username}</span>
                        <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full">{user?.role}</span>
                    </div>
                    <button
                        onClick={() => { logout(); closeMenu(); }}
                        className="flex items-center space-x-3 p-3 w-full rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto w-full">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/products" element={<ProductList />} />
                    <Route path="/billing" element={<POS />} />
                    <Route path="/orders" element={<OrderList />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/reports" element={<Reports />} />
                </Routes>
            </div>
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/*" element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    } />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
