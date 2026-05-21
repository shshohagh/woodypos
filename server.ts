/**
 * @license
 * Wood Trading POS System
 * Developer: Rameez Scripts
 * Version: 1.0.0
 * Date: April 2026
 * Description: Wood Trading System for Cars, Pieces, and Sales.
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';

// Constants
const PORT = 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// In-memory Database (Simulating Google Sheets)
// In a real app, this would be persisted to a file or database
let DB: any = {
  Users: [],
  Categories: [],
  Sub_Categories: [], // Cars
  Suppliers: [],
  Customers: [],
  Wood_Stocks: [],
  Purchases: [],
  Sales: [],
  Sale_Items: [],
  Payments: [],
  Expenses: [],
  Settings: {},
  Activity_Logs: []
};

// --- AUTH UTILS ---
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// --- SETUP DEMO DATA ---
function setupDemoData() {
  console.log("Seeding Demo Data for April 2026...");
  
  // Settings
  DB.Settings = {
    business_name: "Premium Woods Ltd.",
    address: "123 Timber Lane, Forest District",
    phone: "+880 1234 567890",
    email: "contact@premiumwoods.com",
    currency: "USD"
  };

  // Users
  DB.Users = [
    { id: "1", name: "Admin User", email: "admin@example.com", password: "password123", role: "admin", status: "active" },
    { id: "2", name: "Manager User", email: "manager@example.com", password: "password123", role: "manager", status: "active" },
    { id: "3", name: "Cashier User", email: "cashier@example.com", password: "password123", role: "cashier", status: "active" },
    { id: "4", name: "Warehouse Staff", email: "warehouse@example.com", password: "password123", role: "warehouse_staff", status: "active" }
  ];

  // Categories & Sub-Categories (Cars)
  DB.Categories = [
    { id: "cat1", name: "Teak" },
    { id: "cat2", name: "Mahogany" },
    { id: "cat3", name: "Oak" }
  ];

  DB.Sub_Categories = [
    { id: "car1", name: "CAR-APR-001", cat_id: "cat1", supplier_id: "sup1", date: "2026-04-01" },
    { id: "car2", name: "CAR-APR-002", cat_id: "cat2", supplier_id: "sup2", date: "2026-04-05" }
  ];

  // Suppliers & Customers
  DB.Suppliers = [
    { id: "sup1", name: "Timber Exports Inc", phone: "123-456" },
    { id: "sup2", name: "Global Wood Co", phone: "654-321" }
  ];

  DB.Customers = [
    { id: "cus1", name: "Grand Furniture", phone: "999-000", total_purchases: 1200 },
    { id: "cus2", name: "Elite Decor", phone: "888-111", total_purchases: 800 }
  ];

  // Wood Stocks
  // Piece Serial: CAR-CAT-INDEX
  for (let i = 1; i <= 20; i++) {
    const width = 10 + Math.random() * 5;
    const length = 5 + Math.random() * 10;
    const cft = (width * length) / 144; // Example calculation
    DB.Wood_Stocks.push({
      serial: `W-${1000 + i}`,
      car_id: i <= 10 ? "car1" : "car2",
      width: width.toFixed(2),
      length: length.toFixed(2),
      cft: cft.toFixed(2),
      buy_rate: 45,
      sell_rate: 65,
      status: "available",
      created_at: "2026-04-02"
    });
  }

  // Sales (Historical for April 2026)
  for (let d = 1; d <= 15; d++) {
    const date = `2026-04-${String(d).padStart(2, '0')}`;
    const amount = 500 + Math.random() * 1000;
    DB.Sales.push({
      id: `S-${100 + d}`,
      customer_id: d % 2 === 0 ? "cus1" : "cus2",
      date: date,
      total_amount: amount,
      paid_amount: amount * 0.8,
      status: "partially_paid"
    });
  }

  // Expenses
  DB.Expenses = [
    { id: "e1", title: "Electricity Bill", amount: 150, category: "Utility", date: "2026-04-10" },
    { id: "e2", title: "Transport", amount: 300, category: "Logistics", date: "2026-04-12" }
  ];

  console.log("Seeding complete.");
}

setupDemoData();

async function startServer() {
  const app = express();
  app.use(express.json());

  // --- API ROUTES ---

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = DB.Users.find((u: any) => u.email === email && u.password === password);
    if (user) {
      const { password, ...userWithoutPass } = user;
      res.json({ success: true, user: userWithoutPass });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  // Auth: Forgot Password (Mock MailApp)
  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    const user = DB.Users.find((u: any) => u.email === email);
    if (user) {
      const otp = generateOTP();
      user.otp = otp;
      user.otp_expires = Date.now() + 10 * 60 * 1000;
      console.log(`[MAILAPP SIMULATION] Sending OTP ${otp} to ${email}`);
      res.json({ success: true, message: "OTP sent to your email" });
    } else {
      res.status(404).json({ success: false, message: "Email not found" });
    }
  });

  // Auth: Reset Password
  app.post('/api/auth/reset-password', (req, res) => {
    const { email, otp, newPassword } = req.body;
    const user = DB.Users.find((u: any) => u.email === email && u.otp === otp && u.otp_expires > Date.now());
    if (user) {
      user.password = newPassword;
      user.otp = null;
      user.otp_expires = null;
      res.json({ success: true, message: "Password reset successful" });
    } else {
      res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }
  });

  // Dashboard Stats
  app.get('/api/dashboard/stats', (req, res) => {
    const totalSales = DB.Sales.reduce((acc: number, s: any) => acc + s.total_amount, 0);
    const totalStock = DB.Wood_Stocks.filter((w: any) => w.status === 'available').length;
    const totalCustomers = DB.Customers.length;
    
    // Daily Sales for chart
    const salesByDate: any = {};
    DB.Sales.forEach((s: any) => {
      salesByDate[s.date] = (salesByDate[s.date] || 0) + s.total_amount;
    });
    const salesChart = Object.keys(salesByDate).map(date => ({ date, amount: salesByDate[date] })).sort((a,b) => a.date.localeCompare(b.date));

    res.json({
      summary: [
        { label: "Total Sales", value: `$${totalSales.toFixed(2)}`, trend: "+12%" },
        { label: "Available Stock", value: totalStock, trend: "-5%" },
        { label: "Total Customers", value: totalCustomers, trend: "+2" }
      ],
      charts: {
        dailySales: salesChart,
        stockByCategory: DB.Categories.map((c: any) => ({
          name: c.name,
          value: DB.Wood_Stocks.filter((w: any) => {
             const car = DB.Sub_Categories.find((sc: any) => sc.id === w.car_id);
             return car && car.cat_id === c.id;
          }).length
        }))
      }
    });
  });

  // Wood Inventory
  app.get('/api/inventory', (req, res) => {
    const inventory = DB.Wood_Stocks.map((item: any) => {
      const car = DB.Sub_Categories.find((c: any) => c.id === item.car_id);
      return { ...item, car_name: car?.name || "N/A" };
    });
    res.json(inventory);
  });

  app.post('/api/inventory', (req, res) => {
    // LockService logic would go here
    const newItem = { ...req.body, id: Date.now().toString() };
    DB.Wood_Stocks.push(newItem);
    res.json({ success: true, item: newItem });
  });

  // POS Search
  app.get('/api/pos/search', (req, res) => {
    const { query } = req.query;
    const results = DB.Wood_Stocks.filter((w: any) => 
      w.status === 'available' && 
      (w.serial.toLowerCase().includes((query as string || "").toLowerCase()))
    );
    res.json(results);
  });

  // POS Sale
  app.post('/api/pos/sale', (req, res) => {
    const { customer_id, items, total_amount, paid_amount, payment_method } = req.body;
    const saleId = `S-${Date.now()}`;
    
    // Create Sale
    const newSale = {
      id: saleId,
      customer_id,
      date: new Date().toISOString().split('T')[0],
      total_amount,
      paid_amount,
      payment_method,
      status: "completed"
    };
    DB.Sales.push(newSale);

    // Update Stock
    items.forEach((item: any) => {
      const stockItem = DB.Wood_Stocks.find((w: any) => w.serial === item.serial);
      if (stockItem) {
        stockItem.status = "sold";
      }
      DB.Sale_Items.push({
        sale_id: saleId,
        serial: item.serial,
        qty: item.qty || 1,
        rate: item.sell_rate
      });
    });

    res.json({ success: true, saleId });
  });

  // Settings
  app.get('/api/settings', (req, res) => {
    res.json(DB.Settings);
  });

  // Customers (for POS dropdown)
  app.get('/api/customers', (req, res) => {
    res.json(DB.Customers);
  });

  // --- VITE MIDDLEWARE ---
  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Woody POS Server running on http://localhost:${PORT}`);
  });
}

startServer();
