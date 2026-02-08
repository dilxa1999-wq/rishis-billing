const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'cakehouse.db'), (err) => {
    if (err) console.error('Database opening error: ', err);
});

const products = [
    // Cakes
    { name: 'Chocolaty Cake', category: 'Cakes', price: 500, stock: 10 },
    { name: 'Black Forest Cake', category: 'Cakes', price: 600, stock: 10 },
    { name: 'Pineapple Cake', category: 'Cakes', price: 450, stock: 10 },
    { name: 'Swiss Truffle Cake', category: 'Cakes', price: 700, stock: 8 },
    { name: 'Blueberry Cheese Cake', category: 'Cakes', price: 900, stock: 5 },
    { name: 'Red Velvet Cake', category: 'Cakes', price: 850, stock: 5 },
    { name: 'Chocolate Chip Cake', category: 'Cakes', price: 550, stock: 8 },
    { name: 'Rainbow Cake', category: 'Cakes', price: 1000, stock: 3 },

    // Breads
    { name: 'Wheat Bread (400g)', category: 'Breads', price: 60, stock: 20 },
    { name: 'White Bread (400g)', category: 'Breads', price: 50, stock: 25 },
    { name: 'Multigrain Bread', category: 'Breads', price: 70, stock: 15 },
    { name: 'Garlic Bread', category: 'Breads', price: 80, stock: 10 },
    { name: 'Burger Bun (2pc)', category: 'Breads', price: 30, stock: 30 },
    { name: 'Pav (6pc)', category: 'Breads', price: 40, stock: 30 },

    // Pastries & Snacks
    { name: 'Pineapple Pastry', category: 'Pastries', price: 80, stock: 20 },
    { name: 'Black Forest Pastry', category: 'Pastries', price: 90, stock: 20 },
    { name: 'Chocolate Truffle Pastry', category: 'Pastries', price: 110, stock: 15 },
    { name: 'Aloo Puff', category: 'Snacks', price: 30, stock: 50 },
    { name: 'Paneer Roll', category: 'Snacks', price: 60, stock: 20 },
    { name: 'Chicken Puff', category: 'Snacks', price: 50, stock: 20 },
    { name: 'Veg Burger', category: 'Snacks', price: 80, stock: 15 },

    // Cookies
    { name: 'Choco Chunk Cookies', category: 'Cookies', price: 150, stock: 25 },
    { name: 'Butter Almond Cookies', category: 'Cookies', price: 180, stock: 20 },
    { name: 'Jeera Cookies', category: 'Cookies', price: 120, stock: 30 },
    { name: 'Coconut Cookies', category: 'Cookies', price: 130, stock: 25 }
];

const seed = async () => {
    console.log("Seeding products...");

    // Helper to run query
    const run = (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });

    try {
        // Insert products (categories removed)
        for (const p of products) {
            // Determine unit based on name or category hint
            let unit = 'pcs';
            if (p.name.includes('KG') || p.category === 'Cookies') unit = 'KG';
            if (p.category === 'Snacks') unit = 'pcs';

            await run(`
                INSERT INTO products (name, price, stock_quantity, description, unit) 
                VALUES (?, ?, ?, 'Freshly baked', ?)
            `, [p.name, p.price, p.stock, unit]);
        }

        console.log("Seeding complete!");
    } catch (err) {
        console.error("Seeding failed:", err);
    } finally {
        db.close();
    }
};

seed();
