import React, { useState, useEffect } from 'react';
import { Archive, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '../apiConfig';

const Inventory = () => {
    const [ingredients, setIngredients] = useState([]);
    const [savingId, setSavingId] = useState(null);

    const fetchInventory = () => {
        fetch(`${API_BASE_URL}/inventory`)
            .then(res => res.json())
            .then(data => setIngredients(data))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const updateDBStock = async (id, newStock) => {
        setSavingId(id);
        try {
            const res = await fetch(`${API_BASE_URL}/inventory/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ current_stock: parseFloat(newStock) })
            });
            if (res.ok) {
                fetchInventory(); // Refresh list
            } else {
                alert("Failed to save inventory update");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSavingId(null);
        }
    };

    // Mock functionality for demo since we didn't build the full backend editing for inventory in the quick plan
    // In a full app, this would make API calls to update stock
    const updateStock = (id, newStock) => {
        setIngredients(prev => prev.map(ing => ing.id === id ? { ...ing, current_stock: parseFloat(newStock) } : ing));
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Inventory Control</h1>
                <button className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg flex items-center">
                    <Archive size={20} className="mr-2" /> Add Ingredient
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="p-4">Ingredient Name</th>
                            <th className="p-4">Unit</th>
                            <th className="p-4">Current Stock</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ingredients.length === 0 ? (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-500">No ingredients tracking yet.</td></tr>
                        ) : (
                            ingredients.map(ing => (
                                <tr key={ing.id} className="border-t border-gray-50 hover:bg-pink-50 transition-colors">
                                    <td className="p-4 font-medium text-gray-800">{ing.name}</td>
                                    <td className="p-4 text-gray-500">{ing.unit}</td>
                                    <td className="p-4">
                                        <input
                                            type="number"
                                            value={ing.current_stock}
                                            onChange={(e) => updateStock(ing.id, e.target.value)}
                                            className="w-24 border rounded p-1 text-center"
                                        />
                                    </td>
                                    <td className="p-4">
                                        {ing.current_stock <= ing.low_stock_threshold ? (
                                            <span className="flex items-center text-red-500 text-sm font-bold">
                                                <AlertTriangle size={16} className="mr-1" /> Low Stock
                                            </span>
                                        ) : (
                                            <span className="text-green-500 text-sm font-bold">In Stock</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => updateDBStock(ing.id, ing.current_stock)}
                                            disabled={savingId === ing.id}
                                            className="text-pink-500 hover:text-pink-600 font-bold text-sm bg-pink-50 px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {savingId === ing.id ? 'Saving...' : 'Save Update'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Inventory;
