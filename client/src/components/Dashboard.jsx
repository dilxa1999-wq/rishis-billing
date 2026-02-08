import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, AlertTriangle, TrendingUp } from 'lucide-react';

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

  useEffect(() => {
    // Fetch stats from API
    // In a real scenario without the backend running, this will fail, 
    // so we should probably mock it or handle the error gracefully for the UI demo.
    fetch('/api/stats')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => setStats(data))
      .catch(err => {
        console.log("Failed to fetch stats (Backend might be offline)", err);
        // Fallback for demo purposes if backend is off
        setStats({ dailySales: 0, totalOrders: 0, lowStockCount: 0 });
      });
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
        <div className="text-gray-500 h-32 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-lg">
          No recent orders
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
