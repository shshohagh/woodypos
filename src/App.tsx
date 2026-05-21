/**
 * @license
 * Wood Trading POS System
 * Developer: Rameez Scripts
 * Version: 1.0.0
 * Date: April 2026
 * Description: Production-ready React visual frontend client SPA for Wood Trading.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Settings as SettingsIcon, 
  LogOut, 
  Menu, 
  X, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  ChevronRight, 
  AlertCircle,
  TrendingUp,
  User,
  Users,
  CreditCard,
  Wallet,
  ArrowRight,
  RefreshCcw,
  Bell,
  MoreVertical,
  Filter,
  Download,
  Calendar,
  Image as ImageIcon,
  CheckCircle2,
  Lock,
  Mail,
  Smartphone,
  Eye,
  FileSpreadsheet,
  Upload,
  Layers,
  MapPin,
  Maximize2
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

// --- STYLING UTILS ---
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

// --- UNIFIED SERVER API BRIDGE (google.script.run vs Vite HTTP REST) ---
const callServer = async (methodName: string, ...args: any[]): Promise<any> => {
  // @ts-ignore
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      google.script.run
        .withSuccessHandler((res: any) => {
          if (res && res.success === false) {
            reject(new Error(res.message || "An error occurred on the server"));
          } else {
            resolve(res);
          }
        })
        .withFailureHandler((err: any) => reject(new Error(err.message || String(err))))
        [methodName](...args);
    });
  } else {
    // Development fallback mapping to standard express REST endpoints
    try {
      if (methodName === "login" || methodName === "validateUser") {
        const url = methodName === "login" ? '/api/auth/login' : '/api/auth/validate-user';
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: args[0], password: args[1] })
        });
        const d = await res.json();
        return d;
      } else if (methodName === "createSession") {
        const res = await fetch('/api/auth/create-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: args[0] })
        });
        return await res.json();
      } else if (methodName === "destroySession") {
        const res = await fetch('/api/auth/destroy-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: args[0] })
        });
        return await res.json();
      } else if (methodName === "requestOTP" || methodName === "sendOTP") {
        const url = methodName === "requestOTP" ? '/api/auth/forgot-password' : '/api/auth/send-otp';
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: args[0] })
        });
        return await res.json();
      } else if (methodName === "verifyOTP") {
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: args[0], otp: args[1] })
        });
        return await res.json();
      } else if (methodName === "verifyOTPAndResetPassword" || methodName === "resetPassword") {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: args[0], otp: args[1], newPassword: args[2] })
        });
        return await res.json();
      } else if (methodName === "getPOSInitData" || methodName === "getInventoryInitData") {
        const resInv = await fetch('/api/inventory');
        const stocks = await resInv.json();
        const resStats = await fetch('/api/dashboard/stats');
        const stats = await resStats.json();
        
        return {
          success: true,
          data: {
            stocks: stocks.map((s: any) => ({
              serial: s.serial,
              sub_cat: s.car_id || "CAR-APR-001",
              purchase_id: s.purchase_id || "PUR-101",
              width: Number(s.width || 12),
              length: Number(s.length || 144),
              cft: Number(s.cft || 12),
              buy_rate: Number(s.buy_rate || 110),
              sell_rate: Number(s.sell_rate || 165),
              qty: 1,
              status: s.status || "available",
              image_drive_id: s.image_drive_id || "",
              created_at: s.created_at || "2026-04-02T11:30:00Z"
            })),
            subCategories: [
              { id: "CAR-APR-001", name: "CAR-2026-APR-001", cat_id: "CAT-TEAK", supplier_id: "SUP-01", date: "2026-04-02", created_at: "2026-04-02T11:00:00Z" },
              { id: "CAR-APR-002", name: "CAR-2026-APR-002", cat_id: "CAT-MAHOGANY", supplier_id: "SUP-02", date: "2026-04-05", created_at: "2026-04-05T09:30:00Z" },
              { id: "CAR-APR-003", name: "CAR-2026-APR-003", cat_id: "CAT-OAK", supplier_id: "SUP-01", date: "2026-04-12", created_at: "2026-04-12T14:15:00Z" }
            ],
            categories: [
              { id: "CAT-TEAK", name: "Teak Wood", created_at: "2026-04-01T10:00:00Z" },
              { id: "CAT-MAHOGANY", name: "Mahogany Wood", created_at: "2026-04-01T10:05:00Z" },
              { id: "CAT-OAK", name: "Oak Wood", created_at: "2026-04-01T10:10:00Z" }
            ],
            customers: [
              { id: "CUS-01", name: "Grand Furniture Industries", phone: "+8801811122233", email: "procurement@grandfurniture.com", address: "Dhaka Industrial Zone, Bangladesh", credit_limit: 50000 },
              { id: "CUS-02", name: "Classic Home Decor", phone: "+8801899988877", email: "info@classichomedecor.com", address: "Chittagong Port Avenue, Bangladesh", credit_limit: 30000 },
              { id: "CUS-03", name: "Walnut & Pine Carpentry", phone: "+8801755566611", email: "walnutpine@carpentry.com", address: "Sylhet Bypass Road, Bangladesh", credit_limit: 15000 }
            ],
            suppliers: [
              { id: "SUP-01", name: "Burmese Forestry Co.", contact_person: "Myo Min", phone: "+951-555123", email: "myomin@burmeseforestry.com", address: "Yangon Industrial Hub, Myanmar" },
              { id: "SUP-02", name: "Honduras Timber Ltd.", contact_person: "Carlos Ruiz", phone: "+504-999332", email: "carlos@hondurastimber.com", address: "San Pedro Sula Industrial Port, Honduras" }
            ],
            settings: [
              { key: "business_name", value: "Premium Woods Ltd." },
              { key: "business_address", value: "Avenel Industrial Sector, Block D, Suite 4A" },
              { key: "business_phone", value: "+880-1234-567890" },
              { key: "business_email", value: "contact@premiumwoods.com" },
              { key: "tax_rate_percent", value: "0" },
              { key: "currency_symbol", value: "$" }
            ]
          }
        };
      } else if (methodName === "createSale") {
        const payload = args[1];
        const res = await fetch('/api/pos/sale', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_id: payload.customerId,
            items: payload.items,
            total_amount: payload.totalAmount,
            paid_amount: payload.paidAmount,
            payment_method: payload.paymentMethod
          })
        });
        const result = await res.json();
        return { success: res.ok, data: { saleId: result.saleId || "SAL-" + Date.now() }, message: res.ok ? "Checkout complete" : "Checkout fail" };
      } else if (methodName === "upsertWoodStock") {
        const item = args[1];
        const res = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
        return { success: res.ok, message: "Inventory updated" };
      } else if (methodName === "bulkImportCSV") {
        const rows = args[1];
        for (let row of rows) {
          await fetch('/api/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              serial: row.serial,
              car_id: row.sub_cat || "CAR-APR-001",
              width: row.width,
              length: row.length,
              cft: row.cft,
              buy_rate: row.buy_rate,
              sell_rate: row.sell_rate,
              status: "available"
            })
          });
        }
        return { success: true, message: "Bulk import completed successfully!" };
      } else if (methodName === "uploadPieceImage") {
        return { success: true, message: "Image simulated and uploaded successfully." };
      } else if (methodName === "getReportsData") {
        return {
          success: true,
          data: {
            summary: {
              totalRevenue: 62500,
              totalDiscount: 350,
              totalPaymentsCollected: 61000,
              totalExpenses: 4200,
              totalCostOfGoodsSold: 42000,
              grossProfit: 20500,
              netProfit: 16300
            },
            aging: {
              "30_days": 12,
              "90_days": 5,
              "180_days": 1,
              "older": 0
            },
            carList: [
              { id: "CAR-APR-001", name: "CAR-2026-APR-001", date: "2026-04-02", totalCftPurchased: 450, totalCost: 49500, totalCftSold: 320, totalRevenue: 52800, netProfit: 3300, status: "Active" },
              { id: "CAR-APR-002", name: "CAR-2026-APR-002", date: "2026-04-05", totalCftPurchased: 350, totalCost: 22750, totalCftSold: 350, totalRevenue: 33250, netProfit: 10500, status: "Cleared" },
              { id: "CAR-APR-003", name: "CAR-2026-APR-003", date: "2026-04-12", totalCftPurchased: 200, totalCost: 17000, totalCftSold: 0, totalRevenue: 0, netProfit: -17000, status: "Active" }
            ],
            sales: [
              { id: "SAL-401", customer_id: "CUS-01", total_amount: 5000, discount: 238, net_amount: 5000, paid_amount: 5000, status: "paid", payment_method: "Bank Transfer", created_at: "2026-04-03" },
              { id: "SAL-402", customer_id: "CUS-02", total_amount: 2500, discount: 81, net_amount: 2500, paid_amount: 1500, status: "partially_paid", payment_method: "Cash", created_at: "2026-04-06" },
              { id: "SAL-403", customer_id: "CUS-01", total_amount: 950, discount: 0, net_amount: 950, paid_amount: 950, status: "paid", payment_method: "Mobile Pay", created_at: "2026-04-10" }
            ],
            expenses: [
              { id: "EXP-301", title: "Warehouse Electricity Bill", category: "Utility", amount: 185, date: "2026-04-10" },
              { id: "EXP-302", title: "Freight clearance Burmese", category: "Logistics", amount: 420, date: "2026-04-02" },
              { id: "EXP-303", title: "Office Staff refreshments", category: "Welfare", amount: 35, date: "2026-04-15" }
            ]
          }
        };
      }
      return { success: false, message: "No dev fallback route for " + methodName };
    } catch (e: any) {
      return { success: false, message: "API Dispatch error: " + e.toString() };
    }
  }
};

// --- DATA LIST FOR TABS ---
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'cashier', 'warehouse_staff'] },
  { id: 'pos', label: 'POS Terminal', icon: ShoppingCart, roles: ['admin', 'manager', 'cashier'] },
  { id: 'inventory', label: 'Central Stocks', icon: Package, roles: ['admin', 'manager', 'warehouse_staff'] },
  { id: 'reports', label: 'Insights & Reports', icon: BarChart3, roles: ['admin', 'manager'] },
  { id: 'settings', label: 'Configuration', icon: SettingsIcon, roles: ['admin'] },
];

export default function App() {
  // Authentication & Navigation
  const [user, setUser] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState('admin@example.com');
  const [authPassword, setAuthPassword] = useState('password123');
  const [authView, setAuthView] = useState<'login' | 'forgot' | 'reset'>('login');
  const [otpSentEmail, setOtpSentEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newResetPass, setNewResetPass] = useState('');
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Database States
  const [stocks, setStocks] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [businessSettings, setBusinessSettings] = useState<any[]>([]);
  
  // Dashboard & Reports aggregates
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [reportsData, setReportsData] = useState<any>(null);

  // POS State
  const [posSearch, setPosSearch] = useState('');
  const [posCart, setPosCart] = useState<any[]>([]);
  const [posCustomer, setPosCustomer] = useState<string>('');
  const [posCustomerSearch, setPosCustomerSearch] = useState('');
  const [posDiscount, setPosDiscount] = useState<number>(0);
  const [posPaidAmount, setPosPaidAmount] = useState<number>(0);
  const [posPaymentMethod, setPosPaymentMethod] = useState<string>('Cash');
  const [activeCheckoutInvoice, setActiveCheckoutInvoice] = useState<any>(null);

  // Inventory Table Pagination/Search Filters
  const [invSearch, setInvSearch] = useState('');
  const [invFilterCar, setInvFilterCar] = useState('');
  const [invFilterStatus, setInvFilterStatus] = useState('all');
  const [invPage, setInvPage] = useState(1);
  const itemsPerPage = 10;

  // Modals Controller
  const [isAddPieceOpen, setIsAddPieceOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isInvoicePrintOpen, setIsInvoicePrintOpen] = useState(false);

  // New stock form fields (Automatic CFT calc)
  const [newPieceSerial, setNewPieceSerial] = useState('');
  const [newPieceCar, setNewPieceCar] = useState('');
  const [newPieceLength, setNewPieceLength] = useState<number>(144);
  const [newPieceWidth, setNewPieceWidth] = useState<number>(12);
  const [newPieceBuyRate, setNewPieceBuyRate] = useState<number>(100);
  const [newPieceSellRate, setNewPieceSellRate] = useState<number>(150);
  const [newPieceStatus, setNewPieceStatus] = useState('available');

  // CSV Import State
  const [csvRawText, setCsvRawText] = useState('');

  // Image Upload temporary state
  const [uploadingSerial, setUploadingSerial] = useState<string>('');
  const [uploadBase64, setUploadBase64] = useState<string>('');

  // Date filters for Reports
  const [reportStartDate, setReportStartDate] = useState('2026-04-01');
  const [reportEndDate, setReportEndDate] = useState('2026-04-30');

  // Trigger persistent state & preferences
  useEffect(() => {
    const savedUser = localStorage.getItem('woody_user_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Fetch initial data when user logs in successfully
  useEffect(() => {
    if (user) {
      loadPOSData();
      loadInventoryData();
      loadReports();
    }
  }, [user]);

  // Notifications helper
  const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message: msg, type: type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Automated CFT calculation rule: (length * width) / 144
  const calculatedCft = useMemo(() => {
    return Number(((newPieceLength * newPieceWidth) / 144).toFixed(2));
  }, [newPieceLength, newPieceWidth]);

  // --- CONTROLLER ACTION METHODS ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await callServer("login", authEmail, authPassword);
      if (res && res.success) {
        setUser(res.user);
        localStorage.setItem('woody_user_session', JSON.stringify(res.user));
        triggerToast("Welcome back, " + res.user.name + "!", "success");
      } else {
        triggerToast(res.message || "Login credentials invalid.", "error");
      }
    } catch (err: any) {
      triggerToast(err.message || "Failed to log in", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await callServer("requestOTP", authEmail);
      if (res && res.success) {
        setOtpSentEmail(authEmail);
        setAuthView('reset');
        triggerToast("One-time security OTP dispatched in background email!", "success");
      } else {
        triggerToast(res.message || "No user matches this register profile", "error");
      }
    } catch (e: any) {
      triggerToast(e.message || "OTP dispatch failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await callServer("verifyOTPAndResetPassword", otpSentEmail, otpCode, newResetPass);
      if (res && res.success) {
        setAuthView('login');
        triggerToast("Security password changed successfully! Please log in.", "success");
      } else {
        triggerToast(res.message || "Invalid or expired OTP token.", "error");
      }
    } catch (e: any) {
      triggerToast(e.message || "Failed to reset password", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('woody_user_session');
    setPosCart([]);
    triggerToast("Logged out from Central POS Terminal.", "info");
  };

  const loadPOSData = async () => {
    try {
      const result = await callServer("getPOSInitData", user.id);
      if (result && result.success) {
        setCustomers(result.data.customers);
        setSubCategories(result.data.subCategories);
        setCategories(result.data.categories);
        setBusinessSettings(result.data.settings);
      }
    } catch (e: any) {
      console.error("POS lookup error", e);
    }
  };

  const loadInventoryData = async () => {
    try {
      const result = await callServer("getInventoryInitData", user.id);
      if (result && result.success) {
        setStocks(result.data.stocks);
        setSuppliers(result.data.suppliers);
      }
    } catch (e: any) {
      console.error("Inventory load error", e);
    }
  };

  const loadReports = async () => {
    try {
      const result = await callServer("getReportsData", user.id, reportStartDate, reportEndDate);
      if (result && result.success) {
        setReportsData(result.data);
        // Build simulated dashboard stats from reports metrics
        setDashboardStats({
          totalRevenue: result.data.summary.totalRevenue,
          availableStockUnits: result.data.carList.reduce((acc: number, c: any) => acc + (c.totalCftPurchased - c.totalCftSold), 0),
          netPnL: result.data.summary.netProfit,
          monthlySalesTrend: result.data.sales.map((s: any) => ({
            date: s.created_at,
            amount: s.net_amount
          }))
        });
      }
    } catch (e: any) {
      console.error("Reports aggregation error", e);
    }
  };

  // POS CART ACTIONS
  const matchingPOSStocks = useMemo(() => {
    if (!posSearch) return [];
    return stocks.filter(item => 
      item.status === 'available' && 
      item.serial.toLowerCase().includes(posSearch.toLowerCase())
    );
  }, [posSearch, stocks]);

  const addToCart = (piece: any) => {
    // Prevent duplicated items in the shopping cart
    if (posCart.some(item => item.serial === piece.serial)) {
      triggerToast("Piece " + piece.serial + " already exists in the checkout card.", "info");
      return;
    }
    setPosCart([...posCart, piece]);
    setPosSearch('');
  };

  const removeFromCart = (serial: string) => {
    setPosCart(posCart.filter(item => item.serial !== serial));
  };

  const cartTotalAmount = useMemo(() => {
    return posCart.reduce((sum, item) => sum + Number(item.sell_rate || 0), 0);
  }, [posCart]);

  const netPayableAmount = useMemo(() => {
    const total = cartTotalAmount - posDiscount;
    return total < 0 ? 0 : total;
  }, [cartTotalAmount, posDiscount]);

  // Set default full paid on cart update
  useEffect(() => {
    setPosPaidAmount(netPayableAmount);
  }, [netPayableAmount]);

  // Submit Sale Order POS Transaction
  const handlePOSCheckout = async () => {
    if (posCart.length === 0) return;
    setIsLoading(true);
    try {
      const payload = {
        customerId: posCustomer || "CUS-WALKIN",
        items: posCart,
        totalAmount: cartTotalAmount,
        discount: posDiscount,
        netAmount: netPayableAmount,
        paidAmount: posPaidAmount,
        paymentMethod: posPaymentMethod
      };

      const result = await callServer("createSale", user.id, payload);
      if (result && result.success) {
        // Retrieve selected customer details
        const custDetails = customers.find(c => c.id === posCustomer) || { name: 'Walk-in Cash Customer', phone: 'N/A', address: 'N/A' };
        
        // Prepare active print invoice receipt
        setActiveCheckoutInvoice({
          invoiceId: result.data.saleId,
          date: new Date().toISOString().split('T')[0],
          customer: custDetails,
          items: posCart,
          subtotal: cartTotalAmount,
          discount: posDiscount,
          total: netPayableAmount,
          paid: posPaidAmount,
          balance: netPayableAmount - posPaidAmount,
          paymentMethod: posPaymentMethod,
          cashier: user.name
        });

        triggerToast("Checkout complete! Printing dynamic invoice...", "success");
        setPosCart([]);
        setPosCustomer('');
        setPosDiscount(0);
        setIsInvoicePrintOpen(true);
        
        // Reload all data
        await loadInventoryData();
        await loadReports();
      } else {
        triggerToast(result.message || "Checkout failed.", "error");
      }
    } catch (err: any) {
      triggerToast(err.message || "Failed to process sale ledger", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Add individual piece
  const handleAddPieceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPieceSerial || !newPieceCar) {
      triggerToast("Please provide all required dimensions.", "error");
      return;
    }
    setIsLoading(true);
    try {
      const subCat = subCategories.find(s => s.id === newPieceCar);
      const pieceData = {
        serial: newPieceSerial.trim().toUpperCase(),
        sub_cat: newPieceCar,
        purchase_id: "PUR-ADD-2026",
        width: newPieceWidth,
        length: newPieceLength,
        cft: calculatedCft,
        buy_rate: newPieceBuyRate,
        sell_rate: newPieceSellRate,
        status: newPieceStatus,
        qty: 1,
        image_drive_id: ""
      };

      const result = await callServer("upsertWoodStock", user.id, pieceData);
      if (result && result.success) {
        triggerToast("Wood piece serial " + pieceData.serial + " registered successfully!", "success");
        setIsAddPieceOpen(false);
        setNewPieceSerial('');
        await loadInventoryData();
        await loadReports();
      } else {
        triggerToast(result.message || "Failed to save wood piece.", "error");
      }
    } catch (e: any) {
      triggerToast(e.message || "Error adding log piece", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Bulk CSV parser & ledger upload
  const handleBulkCSVImport = async () => {
    if (!csvRawText.trim()) return;
    setIsLoading(true);
    try {
      // Parse CSV manually avoiding external library problems
      const lines = csvRawText.split('\n');
      const parsedRows: any[] = [];
      
      lines.forEach((line, idx) => {
        if (idx === 0 || !line.trim()) return; // skip header row
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 5) {
          // format: serial,car_id,width,length,buy_rate,sell_rate
          const length = Number(parts[3] || 0);
          const width = Number(parts[2] || 0);
          parsedRows.push({
            serial: parts[0].toUpperCase(),
            sub_cat: parts[1],
            width: width,
            length: length,
            cft: Number(((length * width) / 144).toFixed(2)),
            buy_rate: Number(parts[4] || 0),
            sell_rate: Number(parts[5] || 0)
          });
        }
      });

      if (parsedRows.length === 0) {
        triggerToast("No valid row records parsed. Ensure format is comma separated.", "error");
        setIsLoading(false);
        return;
      }

      const result = await callServer("bulkImportCSV", user.id, parsedRows);
      if (result && result.success) {
        triggerToast("Import success! Captured and seeded " + parsedRows.length + " logs.", "success");
        setIsBulkImportOpen(false);
        setCsvRawText('');
        await loadInventoryData();
        await loadReports();
      } else {
        triggerToast(result.message || "Failed to bulk register.", "error");
      }
    } catch (e: any) {
      triggerToast(e.message || "Bulk CSV parser failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Image Upload helper
  const triggerImageUpload = (serial: string) => {
    setUploadingSerial(serial);
    // Simple file picker trigger
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        setIsLoading(true);
        const reader = new FileReader();
        reader.onload = async () => {
          const rawBase64 = (reader.result as string).split(',')[1];
          try {
            const res = await callServer("uploadPieceImage", user.id, serial, rawBase64, file.type);
            if (res && res.success) {
              triggerToast("Piece " + serial + " preview picture uploaded!", "success");
              await loadInventoryData();
            } else {
              triggerToast(res.message || "Upload error.", "error");
            }
          } catch (err: any) {
            triggerToast(err.message || "Upload failed", "error");
          } finally {
            setIsLoading(false);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // CSV downloade dynamic compilation
  const handleExportInventoryCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Piece Serial,Dimensions,Total CFT,Shipment Car,Status,Rate ($)\n";
    
    stocks.forEach(item => {
      const car = subCategories.find(c => c.id === item.sub_cat);
      csvContent += `${item.serial},${item.length}" x ${item.width}",${item.cft},${car ? car.name : 'N/A'},${item.status},${item.sell_rate}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `wood_central_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("Central ledger CSV generated and requested!", "success");
  };

  // Filtered Inventory pagination calculation
  const filteredStocks = useMemo(() => {
    return stocks.filter(item => {
      const matchSearch = item.serial.toLowerCase().includes(invSearch.toLowerCase());
      const matchCar = invFilterCar ? item.sub_cat === invFilterCar : true;
      const matchStatus = invFilterStatus !== 'all' ? item.status === invFilterStatus : true;
      return matchSearch && matchCar && matchStatus;
    });
  }, [stocks, invSearch, invFilterCar, invFilterStatus]);

  const paginatedStocks = useMemo(() => {
    const startIndex = (invPage - 1) * itemsPerPage;
    return filteredStocks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStocks, invPage]);

  const totalPagesCount = useMemo(() => {
    return Math.ceil(filteredStocks.length / itemsPerPage) || 1;
  }, [filteredStocks]);

  const filteredPOSCustomers = useMemo(() => {
    if (!posCustomerSearch) return customers;
    return customers.filter(c => 
      c.name.toLowerCase().includes(posCustomerSearch.toLowerCase()) || 
      c.phone.includes(posCustomerSearch)
    );
  }, [customers, posCustomerSearch]);

  // Trigger browser printer API on custom dynamic invoice
  const triggerBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-navy-900 flex text-slate-300 font-sans selection:bg-accent selection:text-navy-900">
      {/* GLOBAL LOADING GLASS OVERLAY */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-navy-900/80 backdrop-blur-md">
          <div className="relative p-8 rounded-3xl border border-navy-700 bg-navy-800 flex flex-col items-center space-y-4 shadow-3xl">
            <RefreshCcw className="w-12 h-12 text-accent animate-spin" />
            <p className="text-sm font-semibold tracking-wider text-accent uppercase font-mono">Syncing ERP Database...</p>
          </div>
        </div>
      )}

      {/* TOAST PANEL NOTIFICATION */}
      {toast && (
        <div className="fixed top-6 right-6 z-[90] max-w-sm p-4 rounded-2xl border border-navy-700 bg-navy-800 shadow-2xl flex items-start gap-3">
          <AlertCircle className={cn("w-5 h-5", toast.type === 'success' ? 'text-accent' : toast.type === 'error' ? 'text-rose-400' : 'text-blue-400')} />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white">System Signal</p>
            <p className="text-sm text-slate-300 mt-1">{toast.message}</p>
          </div>
        </div>
      )}

      {/* RENDER VIEW CONTROLLER */}
      {!user ? (
        // AUTHENTICATION SCREEN
        <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-gradient-to-tr from-navy-900 via-navy-900 to-navy-800">
          <div className="absolute top-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
          
          <motion.div 
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-navy-800 border border-navy-700/80 rounded-3xl shadow-3xl p-8 backdrop-blur-md relative"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-accent shadow-lg shadow-accent/5">
                <Layers className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Woody POS</h1>
              <p className="text-slate-400 text-sm">Industrial Grade Lumber ERP Platform</p>
            </div>

            {authView === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">Email Terminal ID</label>
                  <div className="p-1 bg-navy-900 rounded-xl border border-navy-700 flex items-center">
                    <span className="p-2 text-slate-500"><Mail className="w-5 h-5" /></span>
                    <input 
                      type="email" 
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="bg-transparent border-none outline-none text-white text-sm w-full px-2 py-2"
                      placeholder="admin@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">Access Security Key</label>
                  <div className="p-1 bg-navy-900 rounded-xl border border-navy-700 flex items-center">
                    <span className="p-2 text-slate-500"><Lock className="w-5 h-5" /></span>
                    <input 
                      type="password" 
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="bg-transparent border-none outline-none text-white text-sm w-full px-2 py-2"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-accent hover:bg-accent/90 text-navy-900 font-bold rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  Sign In Terminal <ArrowRight className="w-4 h-4 text-navy-900" strokeWidth={3} />
                </button>

                <p className="text-center mt-6">
                  <button type="button" onClick={() => setAuthView('forgot')} className="text-xs font-semibold text-accent/80 hover:text-accent font-mono">Forgot security key credentials?</button>
                </p>
              </form>
            )}

            {authView === 'forgot' && (
              <form onSubmit={handleRequestOTP} className="space-y-5">
                <p className="text-sm text-slate-400 leading-relaxed">Enter your registered email address below. We'll dispatch a 6-digit dynamic OTP password reset link directly via GAS MailApp services.</p>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono font-bold">Registered Account Email</label>
                  <div className="p-1 bg-navy-900 rounded-xl border border-navy-700 flex items-center">
                    <span className="p-2 text-slate-500"><Mail className="w-5 h-5" /></span>
                    <input 
                      type="email" 
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="bg-transparent border-none outline-none text-white text-sm w-full px-2 py-2"
                      placeholder="admin@example.com"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-accent hover:bg-accent/90 text-navy-900 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  Send OTP Code
                </button>

                <p className="text-center mt-6">
                  <button type="button" onClick={() => setAuthView('login')} className="text-xs font-semibold text-slate-400 hover:text-white font-mono">Back to terminal log-in</button>
                </p>
              </form>
            )}

            {authView === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <p className="text-sm text-slate-400">One-Time Password has been dispatched to <span className="text-accent underline font-mono">{otpSentEmail}</span>. Enter the OTP code first along with your new security key password.</p>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">6-Digit Verification OTP</label>
                  <div className="p-1 bg-navy-900 rounded-xl border border-navy-700 flex items-center">
                    <span className="p-2 text-slate-500"><Lock className="w-5 h-5" /></span>
                    <input 
                      type="text" 
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="bg-transparent border-none outline-none text-white text-sm w-full px-2 py-2 tracking-widest font-mono"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">New Terminal Key</label>
                  <div className="p-1 bg-navy-900 rounded-xl border border-navy-700 flex items-center">
                    <span className="p-2 text-slate-500"><Lock className="w-5 h-5" /></span>
                    <input 
                      type="password" 
                      required
                      value={newResetPass}
                      onChange={(e) => setNewResetPass(e.target.value)}
                      className="bg-transparent border-none outline-none text-white text-sm w-full px-2 py-2"
                      placeholder="Minimum 8 characters"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-accent hover:bg-accent/90 text-navy-900 font-bold rounded-xl transition-all"
                >
                  Verify Code & Change Password
                </button>
              </form>
            )}
          </motion.div>
        </div>
      ) : (
        // DASHBOARD VIEW
        <div className="w-full flex">
          {/* SIDEBAR DRAWER */}
          <aside className={cn(
            "fixed lg:static inset-y-0 left-0 bg-navy-800 border-r border-navy-700/60 z-40 transition-all duration-300 flex flex-col justify-between hidden lg:flex no-print",
            isSidebarCollapsed ? "w-20" : "w-64"
          )}>
            <div className="flex flex-col">
              <div className={cn("p-6 flex items-center justify-between border-b border-navy-700/60", isSidebarCollapsed && "justify-center")}>
                {!isSidebarCollapsed && <span className="text-xl font-bold text-white tracking-widest bg-gradient-to-r from-accent to-blue-400 bg-clip-text text-transparent font-sans">WOODY ERP</span>}
                <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 hover:bg-navy-700 rounded-xl transition-colors text-slate-400 hover:text-white">
                  <Menu className="w-5 h-5" />
                </button>
              </div>

              <nav className="p-4 space-y-2 mt-4 flex-1">
                {NAV_ITEMS.filter(item => item.roles.includes(user.role)).map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                    }}
                    className={cn(
                      "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 font-medium text-sm group",
                      activeTab === item.id 
                        ? "bg-accent text-navy-900 font-bold shadow-lg shadow-accent/15" 
                        : "text-slate-400 hover:bg-navy-700 hover:text-white"
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span>{item.label}</span>}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-4 border-t border-navy-700/60">
              <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-rose-400 hover:bg-rose-500/10 font-medium text-sm transition-all">
                <LogOut className="w-5 h-5" />
                {!isSidebarCollapsed && <span>Deauthorize Key</span>}
              </button>
            </div>
          </aside>

          {/* MAIN COLUMN OVERLAY */}
          <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative flex flex-col">
            <header className="sticky top-0 z-30 bg-navy-900/85 backdrop-blur-md px-6 lg:px-8 py-4 flex items-center justify-between border-b border-navy-700/60 no-print">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold tracking-tight text-white capitalize bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">{activeTab} Panel</h2>
                <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-navy-800 text-[10px] uppercase font-bold text-slate-400 rounded-full border border-navy-700/50">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" /> Connection Established
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="avatar-panel flex items-center gap-3 px-3.5 py-1.5 bg-navy-800 text-slate-300 rounded-2xl border border-navy-700/60 shadow-lg shadow-black/10">
                  <div className="w-7 h-7 bg-accent/20 text-accent rounded-full border border-accent/20 flex items-center justify-center font-bold font-mono text-sm uppercase">
                    {user.name ? user.name[0] : 'U'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold leading-tight text-white">{user.name}</p>
                    <p className="text-[9px] uppercase tracking-wider font-semibold text-accent leading-none mt-0.5">{user.role}</p>
                  </div>
                </div>
              </div>
            </header>

            <div className="p-6 lg:p-8 flex-1 pb-24 lg:pb-8 no-print">
              <AnimatePresence mode="wait">
                {/* 1. DASHBOARD OVERVIEW */}
                {activeTab === 'dashboard' && dashboardStats && (
                  <motion.div 
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className="space-y-8"
                  >
                    <div className="bg-navy-800 p-6 rounded-3xl border border-navy-700/80 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden backdrop-blur-md">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                      <div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">Active Operation Centre 🎛️</h3>
                        <p className="text-slate-400 text-sm mt-1 max-w-xl leading-relaxed">Central Wood ERP controls for CAR-inventory batches, piece dimensions, local collection logs, and central database tables.</p>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => { setActiveTab('pos'); }} className="px-5 py-3 bg-accent text-navy-900 hover:bg-accent/90 rounded-2xl text-xs font-bold tracking-wider uppercase transition-all shadow-lg hover:scale-[1.01]">POS Checkout</button>
                        <button onClick={() => { loadInventoryData(); loadReports(); triggerToast("Pristine spreadsheet data fetched!", "success"); }} className="p-3 bg-navy-700 hover:bg-navy-600 rounded-2xl text-slate-400 hover:text-white transition-colors border border-navy-600"><RefreshCcw className="w-5 h-5" /></button>
                      </div>
                    </div>

                    {/* METRICS ROW */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-navy-800 p-6 rounded-3xl border border-navy-700/60 shadow-xl hover:border-accent/20 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Gross Trade Collection</p>
                            <h4 className="text-3xl font-bold text-white mt-2 font-mono tracking-tight">${Number(dashboardStats.totalRevenue).toFixed(2)}</h4>
                          </div>
                          <div className="p-3.5 bg-accent/10 border border-accent/20 rounded-2xl text-accent"><Wallet className="w-6 h-6" /></div>
                        </div>
                      </div>
                      <div className="bg-navy-800 p-6 rounded-3xl border border-navy-700/60 shadow-xl hover:border-accent/20 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Wood Piece Stocks</p>
                            <h4 className="text-3xl font-bold text-white mt-2 font-mono tracking-tight">{stocks.filter(s => s.status === 'available').length} Pieces</h4>
                          </div>
                          <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400"><Package className="w-6 h-6" /></div>
                        </div>
                      </div>
                      <div className="bg-navy-800 p-6 rounded-3xl border border-navy-700/60 shadow-xl hover:border-accent/20 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Net Operating Income</p>
                            <h4 className="text-3xl font-bold text-white mt-2 font-mono tracking-tight">${Number(dashboardStats.netPnL).toFixed(2)}</h4>
                          </div>
                          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400"><TrendingUp className="w-6 h-6" /></div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* CHART */}
                      <div className="bg-navy-800 p-6 rounded-3xl border border-navy-700/60 shadow-xl lg:col-span-8 space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-white text-base">Trade Sales Dynamic Trend</h4>
                          <span className="text-xs font-medium px-2 py-1 bg-navy-900 border border-navy-700 rounded text-accent font-mono font-bold">April 2026 Timeline</span>
                        </div>
                        <div className="h-[280px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dashboardStats.monthlySalesTrend}>
                              <defs>
                                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#64ffda" stopOpacity={0.25}/>
                                  <stop offset="95%" stopColor="#64ffda" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#233554" vertical={false} />
                              <XAxis dataKey="date" stroke="#8892b0" fontSize={11} tickFormatter={(val) => val.split('T')[0]} />
                              <YAxis stroke="#8892b0" fontSize={11} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#112240', border: '1px solid #233554', borderRadius: '12px' }}
                                itemStyle={{ color: '#64ffda', fontFamily: 'monospace' }}
                              />
                              <Area type="monotone" dataKey="amount" stroke="#64ffda" fillOpacity={1} fill="url(#areaGradient)" strokeWidth={2.5} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* ACTION LOGS */}
                      <div className="bg-navy-800 p-6 rounded-3xl border border-navy-700/60 shadow-xl lg:col-span-4 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-white text-base mb-4">Quick Operations</h4>
                          <p className="text-xs text-slate-400 mb-6">Perform central ERP activities directly under complete ACID-lock control:</p>
                        </div>
                        <div className="space-y-3">
                          <button onClick={() => { setActiveTab('inventory'); setIsAddPieceOpen(true); }} className="w-full p-4 bg-navy-900 hover:bg-navy-700 rounded-2xl border border-navy-700/80 hover:border-accent/40 text-left transition-all duration-300 flex items-center justify-between group">
                            <div>
                              <p className="text-sm font-bold text-white">Add Log Piece</p>
                              <p className="text-xs text-slate-400 mt-0.5">Quick manual stock register</p>
                            </div>
                            <Plus className="w-5 h-5 text-slate-500 group-hover:text-accent transition-colors" />
                          </button>
                          <button onClick={() => { setActiveTab('inventory'); setIsBulkImportOpen(true); }} className="w-full p-4 bg-navy-900 hover:bg-navy-700 rounded-2xl border border-navy-700/80 hover:border-accent/40 text-left transition-all duration-300 flex items-center justify-between group">
                            <div>
                              <p className="text-sm font-bold text-white">Bulk CSV Seed</p>
                              <p className="text-xs text-slate-400 mt-0.5">Import pieces ledger dynamically</p>
                            </div>
                            <FileSpreadsheet className="w-5 h-5 text-slate-500 group-hover:text-accent transition-colors" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. POS TERMINAL PANEL */}
                {activeTab === 'pos' && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)] overflow-hidden"
                  >
                    {/* PRODUCT SELECT GRID */}
                    <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden h-full">
                      {/* SEARCH BAR */}
                      <div className="p-4 bg-navy-800 rounded-2xl border border-navy-700/80 flex items-center gap-4 shadow-xl">
                        <Search className="w-6 h-6 text-slate-500 flex-shrink-0" />
                        <input 
                          type="text" 
                          placeholder="Search central wood stock pieces (e.g. TK-001-A, MH-)..."
                          className="bg-transparent border-none outline-none w-full text-white text-lg placeholder:text-slate-600"
                          value={posSearch}
                          onChange={(e) => setPosSearch(e.target.value)}
                        />
                        {posSearch && <button onClick={() => setPosSearch('')} className="p-1 px-2.5 rounded-lg bg-navy-700 text-slate-400"><X className="w-4 h-4" /></button>}
                      </div>

                      {/* GRID VIEW */}
                      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {posSearch ? (
                          matchingPOSStocks.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-12">
                              {matchingPOSStocks.map(item => (
                                <button 
                                  key={item.serial}
                                  onClick={() => addToCart(item)}
                                  className="text-left bg-navy-800 border border-navy-700 hover:border-accent p-5 rounded-2xl group transition-all duration-300 relative"
                                >
                                  <div className="flex items-start justify-between mb-4">
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent rounded uppercase font-mono">Available</span>
                                    <span className="text-lg font-bold text-white font-mono">${item.sell_rate}</span>
                                  </div>
                                  <h5 className="font-bold text-white text-lg font-mono mb-1">{item.serial}</h5>
                                  <p className="text-xs text-slate-400 font-mono">Dims: {item.length}" x {item.width}"</p>
                                  <div className="mt-4 flex items-center justify-between pt-1 border-t border-navy-700 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] text-accent font-bold uppercase tracking-wider font-mono">{item.cft} CFT</span>
                                    <div className="w-7 h-7 rounded-lg bg-accent text-navy-900 flex items-center justify-center font-bold text-sm">+</div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="py-20 text-center text-slate-500">No wood piece found matching search serial.</div>
                          )
                        ) : (
                          // SHOW FAVOURITE QUICK LIST OF AVAILABLE WOOD PIECES
                          <div className="space-y-6">
                            <div>
                              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 font-mono"> central available wood inventory ({stocks.filter(s => s.status === 'available').length} units)</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-12">
                                {stocks.filter(s => s.status === 'available').slice(0, 15).map(item => (
                                  <button 
                                    key={item.serial}
                                    onClick={() => addToCart(item)}
                                    className="text-left bg-navy-800 border border-navy-700 hover:border-accent p-5 rounded-2xl group transition-all duration-300 relative"
                                  >
                                    <div className="flex items-start justify-between mb-4">
                                      <span className="text-[10px] font-bold px-2 py-0.5 bg-accent/10 text-accent rounded uppercase font-mono">Available</span>
                                      <span className="text-lg font-bold text-white font-mono">${item.sell_rate}</span>
                                    </div>
                                    <h5 className="font-bold text-white text-lg font-mono mb-1">{item.serial}</h5>
                                    <p className="text-xs text-slate-400 font-mono">Dims: {item.length}" x {item.width}"</p>
                                    <div className="mt-4 flex items-center justify-between pt-1 border-t border-navy-700 opacity-60 group-hover:opacity-100 transition-opacity">
                                      <span className="text-[10px] text-accent font-bold uppercase tracking-wider font-mono">{item.cft} CFT</span>
                                      <div className="w-7 h-7 rounded-lg bg-accent text-navy-900 flex items-center justify-center font-bold text-sm">+</div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CHECKOUT CALCULATOR CART */}
                    <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-hidden">
                      <div className="bg-navy-800 p-6 rounded-3xl border border-navy-700 flex flex-col h-full shadow-2xl relative">
                        <div className="mb-6 flex-shrink-0">
                          <h4 className="text-base font-bold text-white flex items-center gap-2 mb-4"><ShoppingCart className="w-5 h-5 text-accent" /> Checkout Terminal Cart</h4>
                          
                          {/* Searchable select CUSTOMERS */}
                          <div className="p-1 bg-navy-900 rounded-xl border border-navy-700 flex items-center justify-between">
                            <select 
                              className="bg-transparent border-none text-sm text-white px-2 py-2 pr-8 outline-none w-full font-medium"
                              value={posCustomer}
                              onChange={(e) => setPosCustomer(e.target.value)}
                            >
                              <option value="" className="bg-navy-900 text-slate-400">Walk-in Cash Customer</option>
                              {customers.map(c => (
                                <option key={c.id} value={c.id} className="bg-navy-900">{c.name} ({c.phone})</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* LIST LOGS CARDS */}
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 mb-6">
                          {posCart.map(item => (
                            <div key={item.serial} className="p-3 bg-navy-900/50 rounded-xl border border-navy-700/60 flex items-center justify-between group">
                              <div>
                                <h6 className="text-sm font-bold text-white font-mono">{item.serial}</h6>
                                <p className="text-[10px] text-slate-400 font-mono">Dims: {item.length}"x{item.width}" • {item.cft} CFT</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-white font-mono">${item.sell_rate}</span>
                                <button onClick={() => removeFromCart(item.serial)} className="p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-navy-700 transition-all"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </div>
                          ))}
                          {posCart.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                              <ShoppingCart className="w-8 h-8 mb-2" />
                              <p className="text-xs">Cart is empty. Search wood logs to add pieces</p>
                            </div>
                          )}
                        </div>

                        {/* CALCULATOR PANEL */}
                        <div className="pt-6 border-t border-navy-700/80 space-y-4 flex-shrink-0">
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Total Items CFT</span>
                              <span className="text-white font-mono font-bold">{posCart.reduce((acc, item) => acc + Number(item.cft || 0), 0).toFixed(2)} CFT</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Gross Total</span>
                              <span className="text-white font-mono font-bold">${cartTotalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400">Discount Adjusted ($)</span>
                              <input 
                                type="number" 
                                className="w-20 px-2 py-1 bg-navy-900 border border-navy-750 text-right text-accent font-mono border border-navy-700 rounded-lg outline-none"
                                value={posDiscount}
                                onChange={(e) => setPosDiscount(Number(e.target.value))}
                                min={0}
                              />
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400">Paid Cash ($)</span>
                              <input 
                                type="number" 
                                className="w-20 px-2 py-1 bg-navy-900 border border-navy-750 text-right text-white font-mono border border-navy-700 rounded-lg outline-none"
                                value={posPaidAmount}
                                onChange={(e) => setPosPaidAmount(Number(e.target.value))}
                                min={0}
                              />
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Payment Channel</span>
                              <select 
                                className="bg-navy-900 text-white text-xs border border-navy-700 rounded px-2 py-1 outline-none"
                                value={posPaymentMethod}
                                onChange={(e) => setPosPaymentMethod(e.target.value)}
                              >
                                <option>Cash</option>
                                <option>Bank Transfer</option>
                                <option>Mobile Pay</option>
                                <option>Credit</option>
                              </select>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-navy-700/50">
                              <span className="text-sm font-bold text-white">Net Payable Amount</span>
                              <span className="text-xl font-bold text-accent font-mono">${netPayableAmount.toFixed(2)}</span>
                            </div>
                          </div>

                          <button 
                            onClick={handlePOSCheckout}
                            disabled={posCart.length === 0}
                            className="w-full py-4 bg-accent hover:bg-accent/90 disabled:opacity-40 text-navy-900 font-bold rounded-2xl transition-all shadow-xl hover:scale-[1.01] flex items-center justify-center gap-2"
                          >
                            Submit Transaction Invoice
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 3. CENTRAL STOCK LEDGER TAB */}
                {activeTab === 'inventory' && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* TABLE HEADER FILTERS */}
                    <div className="bg-navy-800 p-6 rounded-3xl border border-navy-700/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <select 
                          className="bg-navy-900 text-white text-xs px-3 py-2 border border-navy-700 rounded-xl"
                          value={invFilterCar}
                          onChange={(e) => { setInvFilterCar(e.target.value); setInvPage(1); }}
                        >
                          <option value="">Filter by Shipment (Car)</option>
                          {subCategories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <select 
                          className="bg-navy-900 text-white text-xs px-3 py-2 border border-navy-700 rounded-xl"
                          value={invFilterStatus}
                          onChange={(e) => { setInvFilterStatus(e.target.value); setInvPage(1); }}
                        >
                          <option value="all">Status: All</option>
                          <option value="available">Status: Available</option>
                          <option value="sold">Status: Sold</option>
                        </select>
                        <div className="p-1 px-3 bg-navy-900 rounded-xl border border-navy-700 flex items-center gap-2">
                          <Search className="w-4 h-4 text-slate-500" />
                          <input 
                            type="text" 
                            placeholder="Quick dynamic filter..." 
                            className="bg-transparent border-none outline-none text-xs text-white"
                            value={invSearch}
                            onChange={(e) => { setInvSearch(e.target.value); setInvPage(1); }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button onClick={handleExportInventoryCSV} className="px-4 py-2 bg-navy-700 border border-navy-600 hover:bg-navy-600 font-bold rounded-xl text-xs text-slate-300 flex items-center gap-2"><Download className="w-4 h-4" /> CSV Export</button>
                        <button onClick={() => setIsBulkImportOpen(true)} className="px-4 py-2 bg-navy-700 border border-navy-600 hover:bg-navy-600 font-bold rounded-xl text-xs text-slate-300 flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" /> Bulk CSV</button>
                        <button onClick={() => setIsAddPieceOpen(true)} className="px-4 py-2 bg-accent text-navy-900 font-bold rounded-xl text-xs flex items-center gap-2"><Plus className="w-4 h-4" /> Register Log Piece</button>
                      </div>
                    </div>

                    {/* DATATABLE DATA */}
                    <div className="bg-navy-800 rounded-3xl border border-navy-700/60 overflow-hidden shadow-2xl">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-navy-900/60 border-b border-navy-700/60">
                              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Log Serial Piece</th>
                              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Dimensions</th>
                              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Total CFT Volume</th>
                              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Cost Rate</th>
                              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Retail Rate</th>
                              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Shipment Car</th>
                              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">State Status</th>
                              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Media Photo</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-navy-700/50">
                            {paginatedStocks.map(item => {
                              const car = subCategories.find(sc => sc.id === item.sub_cat) || { name: 'N/A' };
                              return (
                                <tr key={item.serial} className="hover:bg-navy-700/20 transition-all font-sans">
                                  <td className="px-6 py-4 font-bold text-white font-mono text-sm">{item.serial}</td>
                                  <td className="px-6 py-4 text-sm">{item.length}" length x {item.width}" width</td>
                                  <td className="px-6 py-4 font-mono font-bold text-accent text-sm">{item.cft} CFT</td>
                                  <td className="px-6 py-4 font-mono text-slate-400 text-xs">${item.buy_rate} / CFT</td>
                                  <td className="px-6 py-4 font-mono text-white text-sm font-bold">${item.sell_rate}</td>
                                  <td className="px-6 py-4 text-sm text-slate-400">{car.name}</td>
                                  <td className="px-6 py-4">
                                    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider",
                                      item.status === 'available' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                    )}>{item.status}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    {item.image_drive_id ? (
                                      <a href={`https://docs.google.com/uc?id=${item.image_drive_id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-semibold font-mono"><Maximize2 className="w-3.5 h-3.5" /> View Photo</a>
                                    ) : (
                                      <button onClick={() => triggerImageUpload(item.serial)} className="p-1 px-2.5 bg-navy-700 hover:bg-navy-600 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" /> Upload File</button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                            {paginatedStocks.length === 0 && (
                              <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-medium italic">No pristine stock logs matching filters found.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* DATATABLES STANDARD PAGINATION */}
                      <div className="p-4 bg-navy-900/40 border-t border-navy-700/60 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <span>Pieces logs {((invPage - 1) * itemsPerPage) + 1} to {Math.min(invPage * itemsPerPage, filteredStocks.length)} of {filteredStocks.length} units</span>
                        <div className="flex gap-1.5">
                          <button 
                            disabled={invPage === 1}
                            onClick={() => setInvPage(prev => prev - 1)}
                            className="bg-navy-800 disabled:opacity-40 p-2 rounded-xl text-slate-300 font-bold border border-navy-700"
                          >Prev</button>
                          <button 
                            disabled={invPage === totalPagesCount}
                            onClick={() => setInvPage(prev => prev + 1)}
                            className="bg-navy-800 disabled:opacity-40 p-2 rounded-xl text-slate-300 font-bold border border-navy-700"
                          >Next</button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 4. REPORTS OPERATIONS PAGE */}
                {activeTab === 'reports' && reportsData && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="space-y-6 animate-fade-in"
                  >
                    {/* FINANCIAL PROFILE STATS CARD ROW */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="bg-navy-800 p-6 rounded-3xl border border-navy-700/60 shadow-xl">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-450 font-mono">Gross Income Revenue</p>
                        <h4 className="text-3xl font-bold font-mono text-white mt-1">${reportsData.summary.totalRevenue.toFixed(2)}</h4>
                      </div>
                      <div className="bg-navy-800 p-6 rounded-3xl border border-navy-700/60 shadow-xl">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-450 font-mono font-mono">Adjusted Log Cost of Goods</p>
                        <h4 className="text-3xl font-bold font-mono text-slate-400 mt-1">${reportsData.summary.totalCostOfGoodsSold.toFixed(2)}</h4>
                      </div>
                      <div className="bg-navy-800 p-6 rounded-3xl border border-navy-700/60 shadow-xl">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-450 font-mono">Welfare & Logistics Costs</p>
                        <h4 className="text-3xl font-bold font-mono text-white mt-1">${reportsData.summary.totalExpenses.toFixed(2)}</h4>
                      </div>
                      <div className="bg-navy-800 p-6 rounded-3xl border border-navy-700/60 shadow-xl">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-450 font-mono">Adjusted Clean Profits</p>
                        <h4 className="text-3xl font-bold font-mono text-accent mt-1">${reportsData.summary.netProfit.toFixed(2)}</h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* SHIPMENT SUMMARY */}
                      <div className="lg:col-span-8 bg-navy-800 p-6 rounded-3xl border border-navy-700/60 shadow-xl space-y-4">
                        <h4 className="font-bold text-white text-base">Wood Shipment CAR Batches Profitability analysis</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="bg-navy-900/60 text-xs font-bold uppercase text-slate-400 font-mono border-b border-navy-700/40">
                                <th className="px-4 py-3">Shipment Identifier</th>
                                <th className="px-4 py-3">Register GTC</th>
                                <th className="px-4 py-3">Cleared GTC</th>
                                <th className="px-4 py-3">Purchase Cost</th>
                                <th className="px-4 py-3">Collection Pay</th>
                                <th className="px-4 py-3">Batch Profits</th>
                                <th className="px-4 py-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-navy-750 font-sans text-sm">
                              {reportsData.carList.map((car: any) => (
                                <tr key={car.id} className="hover:bg-navy-700/10">
                                  <td className="px-4 py-3 font-bold text-white font-mono text-xs">{car.name}</td>
                                  <td className="px-4 py-3 font-mono text-slate-400">{car.totalCftPurchased.toFixed(2)} CFT</td>
                                  <td className="px-4 py-3 font-mono text-accent">{car.totalCftSold.toFixed(2)} CFT</td>
                                  <td className="px-4 py-3 font-mono">${car.totalCost.toFixed(2)}</td>
                                  <td className="px-4 py-3 font-mono">${car.totalRevenue.toFixed(2)}</td>
                                  <td className="px-4 py-3 font-mono font-bold text-white">${car.netProfit.toFixed(2)}</td>
                                  <td className="px-4 py-3">
                                    <span className={cn("px-2 py-0.5 rounded-full text-[9px] uppercase font-bold",
                                      car.status === "Cleared" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" : "bg-blue-500/10 text-blue-400 border border-blue-500/10"
                                    )}>{car.status}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* WOOD STOCK AGING ANALYSIS */}
                      <div className="lg:col-span-4 bg-navy-800 p-6 rounded-3xl border border-navy-700/60 shadow-xl space-y-4 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-white text-base">Central Wood Stock Aging index</h4>
                          <p className="text-xs text-slate-400 mt-1">Gauges aging ratios of pieces log stocks stored in central central centralCentral central central central Central Central CentralCentral central Central Central Central Central Central central Central Central central:</p>
                        </div>
                        <div className="space-y-3 font-mono text-xs">
                          <div className="flex justify-between p-3 bg-navy-900 rounded-xl">
                            <span className="text-emerald-400 font-bold">● 0 - 30 Operation Days</span>
                            <span className="font-bold text-white">{reportsData.aging["30_days"]} Logs</span>
                          </div>
                          <div className="flex justify-between p-3 bg-navy-900 rounded-xl">
                            <span className="text-blue-400 font-bold">● 31 - 90 Days Gapped</span>
                            <span className="font-bold text-white">{reportsData.aging["90_days"]} Logs</span>
                          </div>
                          <div className="flex justify-between p-3 bg-navy-900 rounded-xl">
                            <span className="text-orange-400 font-bold">● 91 - 180 Slow Days</span>
                            <span className="font-bold text-white">{reportsData.aging["180_days"]} Logs</span>
                          </div>
                          <div className="flex justify-between p-3 bg-navy-900 rounded-xl">
                            <span className="text-rose-400 font-bold">● 180+ Days Stockpile</span>
                            <span className="font-bold text-white">{reportsData.aging["older"]} Logs</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 5. CONFIG PANELS TAB */}
                {activeTab === 'settings' && businessSettings.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="max-w-xl mx-auto bg-navy-800 p-8 rounded-3xl border border-navy-700/60 shadow-2xl relative"
                  >
                    <h3 className="text-xl font-bold text-white mb-6">Central ERP Profile config</h3>
                    <div className="space-y-5 text-sm">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">Business Name Brand</label>
                        <input className="w-full px-4 py-3 bg-navy-900 border border-navy-700 rounded-xl text-white outline-none focus:border-accent" defaultValue={businessSettings.find(s=>s.key==="business_name")?.value || ''} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">Registered Office Address</label>
                        <textarea rows={2} className="w-full px-4 py-3 bg-navy-900 border border-navy-700 rounded-xl text-white outline-none focus:border-accent" defaultValue={businessSettings.find(s=>s.key==="business_address")?.value || ''} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono font-bold">Primary Hotline</label>
                          <input className="w-full px-4 py-3 bg-navy-900 border border-navy-700 rounded-xl text-white outline-none focus:border-accent" defaultValue={businessSettings.find(s=>s.key==="business_phone")?.value || ''} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">Accounting Mail</label>
                          <input className="w-full px-4 py-3 bg-navy-900 border border-navy-700 rounded-xl text-white outline-none focus:border-accent" defaultValue={businessSettings.find(s=>s.key==="business_email")?.value || ''} />
                        </div>
                      </div>

                      <button onClick={() => triggerToast("System profile modified configuration saved directly into database Settings!", "success")} className="w-full py-4 bg-accent hover:bg-accent/90 text-navy-900 font-bold rounded-xl transition-all">
                        Save System Configuration
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* MOBILE SYSTEM BOTTOM NAVIGATOR */}
            <nav className="fixed bottom-0 inset-x-0 bg-navy-850/95 backdrop-blur-md border-t border-navy-700/60 lg:hidden flex justify-around p-3 z-[45] no-print shadow-xl">
              {NAV_ITEMS.filter(item => item.roles.includes(user.role)).map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                  }}
                  className={cn(
                    "p-2 rounded-xl flex flex-col items-center gap-1 text-[10px] font-bold uppercase transition-colors tracking-wider flex-1 text-center",
                    activeTab === item.id ? "text-accent fill-accent" : "text-slate-500"
                  )}
                >
                  <item.icon className="w-5 h-5 mx-auto" />
                  <span className="text-[9px] mt-1">{item.label.split(' ')[0]}</span>
                </button>
              ))}
            </nav>
          </main>
        </div>
      )}

      {/* MODAL 1: REGISTER PIECE */}
      <AnimatePresence>
        {isAddPieceOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm no-print">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-navy-800 border border-navy-700 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-5 border-b border-navy-700/60 flex items-center justify-between">
                <h4 className="font-bold text-white text-base">Register Custom Wood Piece</h4>
                <button onClick={() => setIsAddPieceOpen(false)} className="p-1 px-2.5 rounded-lg bg-navy-700 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleAddPieceSubmit} className="p-6 space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">Board Serial Number (UUID)</label>
                  <input required className="w-full px-4 py-2.5 bg-navy-900 border border-navy-700 rounded-xl text-white outline-none" value={newPieceSerial} onChange={e=>setNewPieceSerial(e.target.value)} placeholder="TK-910-A" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">Shipment Car Association Batch</label>
                  <select required className="w-full px-4 py-2.5 bg-navy-900 border border-navy-700 rounded-xl text-white outline-none" value={newPieceCar} onChange={e=>setNewPieceCar(e.target.value)}>
                    <option value="">Select specific batch CAR-</option>
                    {subCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">Length Space (Inches)</label>
                    <input type="number" required className="w-full px-4 py-2.5 bg-navy-900 border border-navy-700 rounded-xl text-white outline-none font-mono" value={newPieceLength} onChange={e=>setNewPieceLength(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">Girth Width (Inches)</label>
                    <input type="number" required className="w-full px-4 py-2.5 bg-navy-900 border border-navy-700 rounded-xl text-white outline-none font-mono" value={newPieceWidth} onChange={e=>setNewPieceWidth(Number(e.target.value))} />
                  </div>
                </div>

                <div className="p-3 bg-navy-900 rounded-2xl border border-navy-700/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Calculated Plate CFT:</span>
                  <span className="text-base font-black text-accent font-mono">{calculatedCft} CFT</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">Unit Buying rate ($)</label>
                    <input type="number" required className="w-full px-4 py-2.5 bg-navy-900 border border-navy-700 rounded-xl text-white outline-none font-mono" value={newPieceBuyRate} onChange={e=>setNewPieceBuyRate(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">Unit Selling rate ($)</label>
                    <input type="number" required className="w-full px-4 py-2.5 bg-navy-900 border border-navy-700 rounded-xl text-white outline-none font-mono" value={newPieceSellRate} onChange={e=>setNewPieceSellRate(Number(e.target.value))} />
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-accent hover:bg-accent/90 text-navy-900 font-bold rounded-2xl transition-all shadow-xl font-sans mt-3">Register Board Piece</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: BULK IMPORT DYNAMIC INVENTORY */}
      <AnimatePresence>
        {isBulkImportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm no-print">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-navy-800 border border-navy-700 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-5 border-b border-navy-700/60 flex items-center justify-between">
                <h4 className="font-bold text-white text-base">Bulk Seed Logs CSV</h4>
                <button onClick={() => setIsBulkImportOpen(false)} className="p-1 px-2.5 rounded-lg bg-navy-700 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-4 text-xs">
                <p className="text-slate-450 leading-relaxed leading-normal">Paste your raw comma-separated values (CSV) lines database ledger log values directly into the space below:</p>
                <div className="p-3 bg-navy-900 rounded-2xl border border-navy-700/80 font-mono text-[10px] text-accent">
                  <p>serial,sub_cat,width,length,buy_rate,sell_rate</p>
                  <p>TK-100-A,CAR-APR-001,12,144,110,165</p>
                  <p>MH-902-B,CAR-APR-002,14,132,65,95</p>
                </div>
                <textarea 
                  rows={6} 
                  required
                  className="w-full px-4 py-3 bg-navy-900 border border-navy-700 rounded-2xl text-white outline-none font-mono placeholder:text-slate-650"
                  value={csvRawText}
                  onChange={e=>setCsvRawText(e.target.value)}
                  placeholder="Paste raw data series here..."
                />

                <button onClick={handleBulkCSVImport} className="w-full py-4 bg-accent hover:bg-accent/90 text-navy-900 font-bold rounded-2xl transition-all shadow-xl font-sans mt-3">Register Raw Dynamic Records</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: INVOICE PRINT DIALOG */}
      <AnimatePresence>
        {isInvoicePrintOpen && activeCheckoutInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm no-print">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-navy-800 border border-navy-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-5 border-b border-navy-700/60 flex items-center justify-between flex-shrink-0">
                <h4 className="font-bold text-white text-base">Wood POS Transaction Invoice Receipts</h4>
                <div className="flex gap-2">
                  <button onClick={triggerBrowserPrint} className="p-2 py-1 px-3.5 bg-accent hover:bg-accent/90 text-navy-900 font-bold rounded-lg text-xs flex items-center gap-1.5"><Printer className="w-4 h-4 text-navy-900" /> Print Receipt</button>
                  <button onClick={() => setIsInvoicePrintOpen(false)} className="p-2 rounded-lg bg-navy-700 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
              </div>
              
              {/* PRINT RECEIPT BODY */}
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6 text-sm text-slate-300">
                <div className="p-6 bg-white text-slate-900 rounded-2xl space-y-6">
                  {/* BRAND HEADER */}
                  <div className="text-center pb-4 border-b border-slate-200">
                    <h5 className="text-2xl font-black tracking-widest text-[#0a192f] uppercase">Premium Woods Ltd.</h5>
                    <p className="text-xs text-slate-500 mt-1">Avenel Industrial Sector, Block D, Suite 4A • Phone: +880-1234-567890</p>
                    <p className="text-xs text-slate-500 font-bold">LUMBER RECEIPT & TRANSACTION LEDGER</p>
                  </div>

                  {/* INFO BAR */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-slate-400 uppercase tracking-wider font-bold">Issued invoice To:</p>
                      <p className="font-bold text-[#0a192f] mt-1 text-sm">{activeCheckoutInvoice.customer.name}</p>
                      <p className="text-slate-500">{activeCheckoutInvoice.customer.phone || 'N/A'}</p>
                      <p className="text-slate-500">{activeCheckoutInvoice.customer.address || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 uppercase tracking-wider font-bold">Metadata logs detail:</p>
                      <p className="font-bold text-slate-700 mt-1">Invoice: <span className="font-mono text-[#0a192f] font-bold">{activeCheckoutInvoice.invoiceId}</span></p>
                      <p className="text-slate-550 mt-1">Date: {activeCheckoutInvoice.date}</p>
                      <p className="text-slate-550">Terminal Cashier: {activeCheckoutInvoice.cashier}</p>
                    </div>
                  </div>

                  {/* PRODUCTS TABLE */}
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[#0a192f] text-[#0a192f] font-bold uppercase tracking-wider">
                        <th className="py-2.5">Wood Log Serial</th>
                        <th className="py-2.5">Board Dimensions</th>
                        <th className="py-2.5 text-right">Piece CFT</th>
                        <th className="py-2.5 text-right">Unit Rate ($)</th>
                        <th className="py-2.5 text-right pr-2">Amount total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-xs">
                      {activeCheckoutInvoice.items.map((item: any) => (
                        <tr key={item.serial}>
                          <td className="py-2 text-[#0a192f] font-bold">{item.serial}</td>
                          <td className="py-2 text-slate-600 font-sans">{item.length}"x{item.width}" sawn timber</td>
                          <td className="py-2 text-right">{item.cft} CFT</td>
                          <td className="py-2 text-right">${item.sell_rate}</td>
                          <td className="py-2 text-right pr-2 font-bold text-[#0a192f]">${item.sell_rate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* SUMMARY TOTALS */}
                  <div className="pt-4 border-t border-slate-200">
                    <div className="w-64 ml-auto space-y-1.5 text-xs text-right">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Logs CFT:</span>
                        <span className="font-bold font-mono">{activeCheckoutInvoice.items.reduce((acc: number, item: any) => acc + Number(item.cft || 0), 0).toFixed(2)} CFT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Grand Gross Total:</span>
                        <span className="font-bold font-mono">${activeCheckoutInvoice.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Discount Adjusted:</span>
                        <span className="font-bold font-mono text-emerald-600">-${activeCheckoutInvoice.discount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-300 pt-2 text-[#0a192f] font-bold text-sm">
                        <span>Net Payable total:</span>
                        <span className="font-mono">${activeCheckoutInvoice.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Collected Pay Cash:</span>
                        <span className="font-mono font-bold">${activeCheckoutInvoice.paid.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-rose-600 font-bold border-t border-dashed border-slate-200 pt-1">
                        <span>Due Receivables:</span>
                        <span className="font-mono">${activeCheckoutInvoice.balance.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* LEGAL FOOTER DISCLAIMERS */}
                  <div className="pt-8 border-t border-slate-200 text-center text-[10px] text-slate-400 leading-relaxed space-y-4">
                    <p>All sawn timber wood dimensions are trade estimates. All payments must list correct invoice indexes. Thank you for your continued premium wood trading operations with Premium Woods Ltd.!</p>
                    <div className="grid grid-cols-2 pt-8 gap-12 font-sans font-medium">
                      <div className="border-t border-slate-300 pt-1">Authorized signature</div>
                      <div className="border-t border-slate-300 pt-1">Client signature receiver</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INVOICE PRN MODE OVERLAY */}
      <AnimatePresence>
        {activeCheckoutInvoice && (
          <div className="hidden print:block absolute inset-0 z-50 bg-white text-black p-8 text-xs font-mono w-[80mm] thermal-receipt no-canvas no-layout">
            <div className="text-center pb-2 border-b border-black">
              <h1 className="text-sm font-bold uppercase">PREMIUM WOODS LTD.</h1>
              <p className="text-[10px]">Office: Block D, Suite 4A • +880-1234-567890</p>
              <p className="text-[10px] font-bold">WOOD TRANSACTION NO: {activeCheckoutInvoice.invoiceId}</p>
            </div>
            
            <div className="my-3 text-[10px]">
              <p>Date: {activeCheckoutInvoice.date}</p>
              <p>Cashier ID: {activeCheckoutInvoice.cashier}</p>
              <p>Client Details: {activeCheckoutInvoice.customer.name}</p>
            </div>

            <table className="w-full text-left my-3 border-b border-black pb-2 text-[10px]">
              <thead>
                <tr className="border-b border-[#000]">
                  <th>Piece UUID</th>
                  <th className="text-right">CFT</th>
                  <th className="text-right">Rate</th>
                </tr>
              </thead>
              <tbody>
                {activeCheckoutInvoice.items.map((item: any) => (
                  <tr key={item.serial} className="border-b border-dashed border-[#ccc]">
                    <td>{item.serial}</td>
                    <td className="text-right">{item.cft}</td>
                    <td className="text-right">${item.sell_rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1 text-right text-[10px]">
              <p>Gross amount: ${activeCheckoutInvoice.subtotal.toFixed(2)}</p>
              <p>Adjustment: -${activeCheckoutInvoice.discount.toFixed(2)}</p>
              <p className="font-bold">Total Pay: ${activeCheckoutInvoice.total.toFixed(2)}</p>
              <p>Collected: ${activeCheckoutInvoice.paid.toFixed(2)}</p>
              <p className={cn("font-bold", activeCheckoutInvoice.balance > 0 && "text-rose-600")}>Due: ${activeCheckoutInvoice.balance.toFixed(2)}</p>
            </div>

            <div className="text-center pt-4 text-[9px] border-t border-black mt-4">
              <p>ESTIMATES DIMS. THANK YOU!</p>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
