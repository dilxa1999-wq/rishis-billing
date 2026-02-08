import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, AlertTriangle, TrendingUp } from 'lucide-react';
import { API_BASE_URL } from '../apiConfig';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
    <div className={`p-4 rounded-full ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <p className="text-gray-500 text-sm">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    dailySales: 0,
    totalOrders: 0,
    lowStockCount: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    // Fetch stats
    fetch(`${API_BASE_URL}/stats`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => setStats({
        dailySales: data.dailySales || 0,
        totalOrders: data.totalOrders || 0,
        lowStockCount: data.lowStockCount || 0
      }))
      .catch(err => console.error(err));

    // Fetch recent orders
    fetch(`${API_BASE_URL}/orders`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => setRecentOrders(data.slice(0, 5)))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">{new Date().toLocaleDateString()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Daily Sales"
          value={`Rs. ${(stats.dailySales || 0).toLocaleString()}`}
          icon={DollarSign}
          color="bg-mint-400"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders || 0}
          icon={ShoppingBag}
          color="bg-pink-500"
        />
        <StatCard
          title="Low Stock Alerts"
          value={stats.lowStockCount || 0}
          icon={AlertTriangle}
          color="bg-orange-400"
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <TrendingUp className="mr-2 text-pink-500" /> Recent Activity
        </h2>
        <div className="space-y-4">
          {recentOrders.length === 0 ? (
            <div className="text-gray-500 h-32 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-lg">
              No recent orders
            </div>
          ) : (
            recentOrders.map(order => (
              <div key={order.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 font-bold">
                    #{order.id}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{order.customer_name || 'Walk-in Customer'}</p>
                    <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">Rs. {parseFloat(order.total_amount).toFixed(2)}</p>
                  <p className={`text-[10px] font-bold uppercase ${order.status === 'completed' ? 'text-green-500' : 'text-yellow-500'}`}>{order.status}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
