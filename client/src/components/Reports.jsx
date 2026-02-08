import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import { Download } from 'lucide-react';

const Reports = () => {
    // Mock data for visualization since backend history might be empty
    const data = [
        { name: 'Mon', sales: 4000 },
        { name: 'Tue', sales: 3000 },
        { name: 'Wed', sales: 2000 },
        { name: 'Thu', sales: 2780 },
        { name: 'Fri', sales: 1890 },
        { name: 'Sat', sales: 2390 },
        { name: 'Sun', sales: 3490 },
    ];

    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.text("Rishi's Cake House - Weekly Sales Report", 10, 10);
        let y = 30;
        data.forEach(day => {
            doc.text(`${day.name}: Rs. ${day.sales}`, 10, y);
            y += 10;
        });
        doc.save("sales_report.pdf");
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
                <button
                    onClick={downloadPDF}
                    className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg flex items-center"
                >
                    <Download size={20} className="mr-2" /> Download PDF
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Weekly Sales Overview</h2>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="sales" fill="#ec4899" name="Sales (Rs.)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Reports;
