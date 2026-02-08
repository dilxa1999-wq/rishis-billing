const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET || 'super_secret_cake_key_change_in_production'; // Use env var for production

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Database Setup
const db = new sqlite3.Database('cakehouse.db', (err) => {
    if (err) console.error('Database opening error: ', err);
});

// Helper functions for Async/Await with sqlite3
const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

const dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const dbAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// Initialize Tables
const initDb = async () => {
    try {
        await dbRun(`
          CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            unit TEXT DEFAULT 'pcs',
            price REAL NOT NULL,
            image_url TEXT,
            description TEXT,
            stock_quantity REAL DEFAULT 0
          );
        `);
        await dbRun(`
          CREATE TABLE IF NOT EXISTS ingredients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            unit TEXT NOT NULL,
            current_stock REAL DEFAULT 0,
            low_stock_threshold REAL DEFAULT 5
          );
        `);
        await dbRun(`
          CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT,
            customer_contact TEXT,
            total_amount REAL NOT NULL,
            payment_method TEXT,
            status TEXT DEFAULT 'completed',
            type TEXT DEFAULT 'immediate',
            pickup_datetime TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            delivery_fee REAL DEFAULT 0
          );
        `);
        await dbRun(`
          CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER,
            product_id INTEGER,
            quantity REAL NOT NULL,
            price_at_sale REAL NOT NULL,
            unit_at_sale TEXT DEFAULT 'pcs',
            FOREIGN KEY(order_id) REFERENCES orders(id),
            FOREIGN KEY(product_id) REFERENCES products(id)
          );
        `);
        await dbRun(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'staff'
          );
        `);

        try {
            await dbRun('ALTER TABLE products ADD COLUMN unit TEXT DEFAULT "pcs"');
        } catch (e) { /* ignore */ }
        try {
            await dbRun('ALTER TABLE order_items ADD COLUMN unit_at_sale TEXT DEFAULT "pcs"');
        } catch (e) { /* ignore */ }

        // Seed Admin User
        const checkUsers = await dbGet('SELECT count(*) as count FROM users');
        if (checkUsers.count === 0) {
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync('admin123', salt);
            await dbRun('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', ['admin', hash, 'admin']);
            console.log("Admin user created: admin / admin123");
        }
    } catch (err) {
        console.error("Error initializing database:", err);
    }
};

initDb();

// Multer Config for Image Uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
})
const upload = multer({ storage: storage })

// --- Middleware ---
const authenticateToken = (req, res, next) => {
    // Authentication disabled as per user request to remove admin login requirement
    req.user = { id: 1, username: 'admin', role: 'admin' };
    next();
};

// --- API Endpoints ---

// Auth
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);

        if (!user) return res.status(400).json({ error: "User not found" });

        const validPassword = bcrypt.compareSync(password, user.password_hash);
        if (!validPassword) return res.status(400).json({ error: "Invalid password" });

        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '12h' });
        res.json({ token, username: user.username, role: user.role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Products
app.get('/api/products', async (req, res) => {
    try {
        const products = await dbAll('SELECT * FROM products');
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/products', authenticateToken, upload.single('image'), async (req, res) => {
    const { name, price, description, stock_quantity, unit } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    // Hardened parsing: ensure numbers are actually numbers, default to 0 if invalid/empty
    const parsedPrice = parseFloat(price) || 0;
    const parsedStock = parseFloat(stock_quantity) || 0;

    try {
        const result = await dbRun(`
      INSERT INTO products(name, price, image_url, description, stock_quantity, unit)
        VALUES(?, ?, ?, ?, ?, ?)
            `, [name, parsedPrice, image_url, description || '', parsedStock, unit || 'pcs']);
        res.json({ id: result.lastID });
    } catch (err) {
        console.error("Product Creation Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/categories', (req, res) => {
    res.json([]);
});

// Inventory
app.get('/api/inventory', async (req, res) => {
    try {
        const ingredients = await dbAll('SELECT * FROM ingredients');
        res.json(ingredients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/inventory/:id', async (req, res) => {
    const { current_stock } = req.body;
    try {
        await dbRun('UPDATE ingredients SET current_stock = ? WHERE id = ?', [current_stock, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/inventory', async (req, res) => {
    const { name, unit, current_stock, low_stock_threshold } = req.body;
    try {
        const result = await dbRun(
            'INSERT INTO ingredients (name, unit, current_stock, low_stock_threshold) VALUES (?, ?, ?, ?)',
            [name, unit, current_stock || 0, low_stock_threshold || 5]
        );
        res.status(201).json({ id: result.lastID, success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/inventory/:id', async (req, res) => {
    try {
        await dbRun('DELETE FROM ingredients WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Orders & Billing
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await dbAll('SELECT * FROM orders ORDER BY created_at DESC');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/orders/:id', async (req, res) => {
    const orderId = req.params.id;
    try {
        const order = await dbGet('SELECT * FROM orders WHERE id = ?', [orderId]);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        const items = await dbAll(`
            SELECT oi.*, p.name 
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
            `, [orderId]);

        res.json({ ...order, items });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/orders', async (req, res) => {
    const { customer_name, customer_contact, items, total_amount, payment_method, type, pickup_datetime, delivery_fee } = req.body;
    try {
        // Validation: Check stock before processing
        for (const item of items) {
            const product = await dbGet('SELECT name, stock_quantity FROM products WHERE id = ?', [item.id]);
            if (!product) throw new Error(`Product ${item.id} not found`);
            if (product.stock_quantity < item.quantity) {
                return res.status(400).json({ error: `Not enough stock for ${product.name}. (Available: ${product.stock_quantity})` });
            }
        }

        const orderResult = await dbRun(`
      INSERT INTO orders(customer_name, customer_contact, total_amount, payment_method, type, pickup_datetime, delivery_fee)
        VALUES(?, ?, ?, ?, ?, ?, ?)
            `, [customer_name, customer_contact, total_amount, payment_method, type || 'immediate', pickup_datetime, delivery_fee || 0]);

        const orderId = orderResult.lastID;
        for (const item of items) {
            await dbRun(`
        INSERT INTO order_items(order_id, product_id, quantity, price_at_sale, unit_at_sale)
        VALUES(?, ?, ?, ?, ?)
            `, [orderId, item.id, item.quantity, item.price, item.unit || 'pcs']);

            await dbRun(`
        UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?
            `, [item.quantity, item.id]);
        }
        res.json({ id: orderId, success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/orders/bulk-delete', async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: "Invalid IDs" });

    try {
        const placeholders = ids.map(() => '?').join(',');

        // Restore stock
        const items = await dbAll(`SELECT product_id, quantity FROM order_items WHERE order_id IN(${placeholders})`, ids);
        for (const item of items) {
            await dbRun('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [item.quantity, item.product_id]);
        }

        await dbRun(`DELETE FROM order_items WHERE order_id IN(${placeholders})`, ids);
        await dbRun(`DELETE FROM orders WHERE id IN(${placeholders})`, ids);
        res.json({ success: true });
    } catch (err) {
        console.error("Bulk Delete Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/orders/:id', async (req, res) => {
    const orderId = req.params.id;
    console.log(`Single Delete Request: Order ID ${orderId}`);
    try {
        // Restore stock before deleting items
        const items = await dbAll('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
        for (const item of items) {
            await dbRun('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [item.quantity, item.product_id]);
        }

        await dbRun('DELETE FROM order_items WHERE order_id = ?', [orderId]);
        const result = await dbRun('DELETE FROM orders WHERE id = ?', [orderId]);

        if (result.changes === 0) {
            return res.status(404).json({ error: "Order not found" });
        }
        res.json({ success: true });
    } catch (err) {
        console.error(`Single Delete Error for ID ${orderId}: `, err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/orders', async (req, res) => {
    console.log("Clear All Orders Request");
    try {
        await dbRun('DELETE FROM order_items');
        await dbRun('DELETE FROM orders');
        console.log("Clear All Orders Success");
        res.json({ success: true });
    } catch (err) {
        console.error("Clear All Orders Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Dashboard Stats
app.get('/api/stats', async (req, res) => {
    const today = new Date().toISOString().split('T')[0];

    try {
        const dailySales = await dbGet(`
        SELECT SUM(total_amount) as total FROM orders WHERE date(created_at) = ?
            `, [today]);

        const totalOrders = await dbGet(`
        SELECT count(*) as count FROM orders WHERE date(created_at) = ?
            `, [today]);

        const lowStock = await dbGet(`
        SELECT count(*) as count FROM products WHERE stock_quantity < 5
            `);

        res.json({
            dailySales: dailySales.total || 0,
            totalOrders: totalOrders.count || 0,
            lowStockCount: lowStock.count || 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reports
app.get('/api/reports/sales', async (req, res) => {
    try {
        // Get last 7 days of sales
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toISOString().split('T')[0]);
        }

        const reportData = [];
        for (const day of days) {
            const sales = await dbGet(`
                SELECT SUM(total_amount) as total 
                FROM orders 
                WHERE date(created_at) = ?
            `, [day]);

            const dayName = new Date(day).toLocaleDateString('en-US', { weekday: 'short' });
            reportData.push({ name: dayName, sales: sales.total || 0 });
        }
        res.json(reportData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
