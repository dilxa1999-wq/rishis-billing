import React, { useState, useEffect } from 'react';
import { Archive, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../apiConfig';

const Inventory = () => {
    const [ingredients, setIngredients] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newIng, setNewIng] = useState({ name: '', unit: '', current_stock: '', low_stock_threshold: '' });

    const fetchInventory = () => {
        fetch(`${API_BASE_URL}/inventory`)
            .then(res => res.json())
            .then(data => setIngredients(data))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const handleAddIngredient = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/inventory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newIng)
            });
            if (res.ok) {
                setShowForm(false);
                setNewIng({ name: '', unit: '', current_stock: '', low_stock_threshold: '' });
                fetchInventory();
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteIngredient = async (id) => {
        if (!window.confirm("Delete this ingredient tracker?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/inventory/${id}`, { method: 'DELETE' });
            if (res.ok) fetchInventory();
        } catch (err) { console.error(err); }
    };

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

    const updateStock = (id, newStock) => {
        setIngredients(prev => prev.map(ing => ing.id === id ? { ...ing, current_stock: parseFloat(newStock) } : ing));
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Inventory Control</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg flex items-center"
                >
                    <Plus size={20} className="mr-2" /> Add Ingredient
                </button>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">New Ingredient</h2>
                        <form onSubmit={handleAddIngredient} className="space-y-4">
                            <input placeholder="Name" className="w-full border rounded-lg p-2" required onChange={e => setNewIng({ ...newIng, name: e.target.value })} />
                            <input placeholder="Unit (e.g. KG, Liters)" className="w-full border rounded-lg p-2" required onChange={e => setNewIng({ ...newIng, unit: e.target.value })} />
                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="Initial Stock" type="number" step="any" className="w-full border rounded-lg p-2" onChange={e => setNewIng({ ...newIng, current_stock: e.target.value })} />
                                <input placeholder="Low Threshold" type="number" step="any" className="w-full border rounded-lg p-2" onChange={e => setNewIng({ ...newIng, low_stock_threshold: e.target.value })} />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-pink-500 text-white rounded-lg">Add</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
                                            step="any"
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
                                    <td className="p-4 text-right space-x-2">
                                        <button
                                            onClick={() => updateDBStock(ing.id, ing.current_stock)}
                                            disabled={savingId === ing.id}
                                            className="text-pink-500 hover:text-pink-600 font-bold text-sm bg-pink-50 px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {savingId === ing.id ? 'Saving...' : 'Save'}
                                        </button>
                                        <button onClick={() => handleDeleteIngredient(ing.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 size={16} />
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
