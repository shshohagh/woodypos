/**
 * @license
 * Wood Trading POS System
 * Developer: Rameez Scripts
 * Version: 1.0.0
 * Date: April 2026
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Settings, 
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
  CheckCircle2
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- CONSTANTS ---
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'cashier', 'warehouse_staff'] },
  { id: 'pos', label: 'POS', icon: ShoppingCart, roles: ['admin', 'manager', 'cashier'] },
  { id: 'inventory', label: 'Inventory', icon: Package, roles: ['admin', 'manager', 'warehouse_staff'] },
  { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'manager'] },
  { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
];

// --- COMPONENTS ---

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-navy-800 border border-navy-700 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-navy-700">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-navy-700 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

const StatCard = ({ label, value, trend, icon: Icon }: any) => (
  <div className="p-6 bg-navy-800 border border-navy-700 rounded-2xl group hover:border-accent/30 transition-all duration-300">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-400">{label}</p>
        <h4 className="mt-2 text-2xl font-bold text-white font-mono">{value}</h4>
        {trend && (
          <div className="mt-2 flex items-center gap-1">
             <span className={cn("text-xs font-semibold px-1.5 py-0.5 rounded", 
               trend.startsWith('+') ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
               {trend}
             </span>
             <span className="text-[10px] text-slate-500 uppercase font-medium">vs yesterday</span>
          </div>
        )}
      </div>
      <div className="p-3 bg-navy-700/50 rounded-xl group-hover:bg-accent/10 group-hover:text-accent transition-colors">
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

// --- MAIN APP ---

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'forgot' | 'reset'>('login');
  
  // Data State
  const [stats, setStats] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [posItems, setPosItems] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isPosCheckoutOpen, setPosCheckoutOpen] = useState(false);
  const [isQtyModalOpen, setQtyModalOpen] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<any>(null);

  useEffect(() => {
    // Check session
    const savedUser = localStorage.getItem('woody_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    // Load cache from localStorage
    const cachedStats = localStorage.getItem('woody_cache_stats');
    const cachedInv = localStorage.getItem('woody_cache_inv');
    if (cachedStats) setStats(JSON.parse(cachedStats));
    if (cachedInv) setInventory(JSON.parse(cachedInv));

    if (user) {
      fetchDashboard();
      fetchInventory();
      fetchCustomers();
    }
  }, [user]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      setStats(data);
      localStorage.setItem('woody_cache_stats', JSON.stringify(data));
    } catch (e) { console.error("Fetch stats failed", e); }
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      setInventory(data);
      localStorage.setItem('woody_cache_inv', JSON.stringify(data));
    } catch (e) { console.error("Fetch inventory failed", e); }
  };

  const fetchCustomers = async () => {
     const res = await fetch('/api/customers');
     const data = await res.json();
     setCustomers(data);
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      localStorage.setItem('woody_user', JSON.stringify(data.user));
    } else {
      alert("Invalid login");
    }
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('woody_user');
  };

  // --- ACTIONS ---

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.length > 1) {
      const res = await fetch(`/api/pos/search?query=${val}`);
      const data = await res.json();
      setPosItems(data);
    } else {
      setPosItems([]);
    }
  };

  const addToCart = (piece: any) => {
    if (cart.find(i => i.serial === piece.serial)) return;
    setCart([...cart, { ...piece, qty: 1 }]);
  };

  const removeFromCart = (serial: string) => {
    setCart(cart.filter(i => i.serial !== serial));
  };

  const processSale = async () => {
    setIsLoading(true);
    const total = cart.reduce((sum, item) => sum + (item.sell_rate * (item.qty || 1)), 0);
    
    const res = await fetch('/api/pos/sale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: selectedCustomer?.id,
        items: cart,
        total_amount: total,
        paid_amount: total, // Assuming full pay for demo
        payment_method: 'Cash'
      })
    });

    if (res.ok) {
      alert("Sale successful!");
      setCart([]);
      setSelectedCustomer(null);
      setPosCheckoutOpen(false);
      fetchDashboard();
      fetchInventory();
    }
    setIsLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-navy-800 p-8 rounded-3xl border border-navy-700 shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-accent/20 text-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-white">Woody POS</h1>
            <p className="text-slate-400 mt-2">Premium Wood Trading Management</p>
          </div>

          <form onSubmit={login} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <input 
                name="email"
                type="email" 
                required 
                className="w-full px-4 py-3 bg-navy-900 border border-navy-700 rounded-xl focus:outline-none focus:border-accent text-white"
                placeholder="admin@example.com"
                defaultValue="admin@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input 
                name="password"
                type="password" 
                required 
                className="w-full px-4 py-3 bg-navy-900 border border-navy-700 rounded-xl focus:outline-none focus:border-accent text-white"
                placeholder="••••••••"
                defaultValue="password123"
              />
            </div>
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-accent hover:bg-accent/90 text-navy-900 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : "Sign In Account"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Forgot Password? <button className="text-accent underline">Contact Admin</button>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-900 flex text-slate-300">
      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-40 bg-navy-800 border-r border-navy-700 transition-all duration-300",
        isSidebarOpen ? "w-64" : "w-20",
        !isSidebarOpen && "hidden lg:block"
      )}>
        <div className="h-full flex flex-col">
          <div className={cn("p-6 flex items-center justify-between", !isSidebarOpen && "justify-center")}>
            {isSidebarOpen && <span className="text-xl font-bold text-white tracking-wider">WOODY</span>}
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-navy-700 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-2 mt-4">
            {NAV_ITEMS.filter(item => item.roles.includes(user.role)).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all",
                  activeTab === item.id ? "bg-accent text-navy-900 font-semibold" : "hover:bg-navy-700 text-slate-400"
                )}
              >
                <item.icon className="w-5 h-5" />
                {isSidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-navy-700">
            <button onClick={logout} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-rose-500/10 text-rose-400 transition-all">
              <LogOut className="w-5 h-5" />
              {isSidebarOpen && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-navy-900/80 backdrop-blur-md px-4 lg:px-8 py-4 flex items-center justify-between border-b border-navy-700">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-white capitalize">{activeTab}</h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-navy-700 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 px-3 py-1.5 bg-navy-800 rounded-full border border-navy-700">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                {user.name[0]}
              </div>
              <div className="hidden sm:block">
                 <p className="text-xs font-bold text-white">{user.name}</p>
                 <p className="text-[10px] text-accent uppercase font-semibold">{user.role}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8">
           <AnimatePresence mode="wait">
             {activeTab === 'dashboard' && stats && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between bg-navy-800 p-6 rounded-2xl border border-navy-700">
                    <div>
                      <h3 className="text-2xl font-bold text-white">Welcome back, {user.name.split(' ')[0]}! 👋</h3>
                      <p className="text-slate-400">Here's what's happening with Wood Trading today.</p>
                    </div>
                    <div className="hidden md:flex gap-2">
                       <button className="px-4 py-2 bg-navy-700 hover:bg-navy-600 rounded-xl text-sm font-medium transition-colors">Generate Report</button>
                       <button onClick={() => setActiveTab('pos')} className="px-4 py-2 bg-accent text-navy-900 hover:bg-accent/90 rounded-xl text-sm font-bold transition-all">New Sale</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.summary.map((stat: any, i: number) => (
                      <StatCard key={i} {...stat} icon={i === 0 ? Wallet : i === 1 ? Package : Users} />
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <div className="bg-navy-800 p-6 rounded-2xl border border-navy-700">
                        <div className="flex items-center justify-between mb-6">
                           <h4 className="font-semibold text-white">Daily Sales Trend</h4>
                           <select className="bg-navy-900 border border-navy-700 text-xs rounded-lg px-2 py-1 outline-none">
                              <option>Last 15 Days</option>
                           </select>
                        </div>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.charts.dailySales}>
                              <defs>
                                <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#64ffda" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#64ffda" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#233554" />
                              <XAxis dataKey="date" stroke="#8892b0" fontSize={10} tickFormatter={(val) => val.split('-')[2]} />
                              <YAxis stroke="#8892b0" fontSize={10} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#112240', border: '1px solid #233554', borderRadius: '8px' }}
                                itemStyle={{ color: '#64ffda' }}
                              />
                              <Area type="monotone" dataKey="amount" stroke="#64ffda" fillOpacity={1} fill="url(#colorAmt)" strokeWidth={2} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                     </div>

                     <div className="bg-navy-800 p-6 rounded-2xl border border-navy-700">
                        <h4 className="font-semibold text-white mb-6">Stock Status by Category</h4>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.charts.stockByCategory}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#233554" />
                              <XAxis dataKey="name" stroke="#8892b0" fontSize={12} />
                              <YAxis stroke="#8892b0" fontSize={12} />
                              <Tooltip 
                                cursor={{ fill: '#1d2d50' }}
                                contentStyle={{ backgroundColor: '#112240', border: '1px solid #233554', borderRadius: '8px' }}
                              />
                              <Bar dataKey="value" fill="#64ffda" radius={[4, 4, 0, 0]}>
                                {stats.charts.stockByCategory.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={['#64ffda', '#10b981', '#3b82f6'][index % 3]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                     </div>
                  </div>
                </motion.div>
             )}

             {activeTab === 'pos' && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-160px)]"
                >
                  {/* Product Search Side */}
                  <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden">
                    <div className="bg-navy-800 p-4 rounded-2xl border border-navy-700 flex items-center gap-4 shadow-xl">
                      <Search className="w-6 h-6 text-slate-500" />
                      <input 
                        type="text" 
                        placeholder="Search Wood Serial (e.g. W-1001)..." 
                        className="bg-transparent border-none outline-none w-full text-white text-lg placeholder:text-slate-600"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                      />
                      <button className="p-2 bg-navy-700 rounded-xl hover:bg-navy-600 transition-colors">
                        <Filter className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-12">
                        {posItems.length > 0 ? posItems.map((item) => (
                          <button 
                            key={item.serial}
                            onClick={() => addToCart(item)}
                            className="text-left bg-navy-800 border border-navy-700 rounded-2xl p-4 hover:border-accent group transition-all duration-300 overflow-hidden relative"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <span className="text-[10px] font-bold px-2 py-1 bg-accent/10 text-accent rounded uppercase tracking-wider">{item.status}</span>
                              <span className="text-xl font-bold font-mono text-white">${item.sell_rate}</span>
                            </div>
                            <h5 className="font-bold text-lg text-white mb-1">{item.serial}</h5>
                            <div className="flex gap-4 text-xs text-slate-400">
                               <span>L: {item.length}"</span>
                               <span>W: {item.width}"</span>
                               <span className="font-semibold text-accent">{item.cft} CFT</span>
                            </div>
                            <div className="mt-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                               <span className="text-[10px] text-accent font-bold uppercase">Add to cart</span>
                               <div className="w-8 h-8 rounded-full bg-accent text-navy-900 flex items-center justify-center">
                                 <Plus className="w-4 h-4" strokeWidth={3} />
                               </div>
                            </div>
                          </button>
                        )) : (
                          <div className="col-span-full py-20 text-center">
                             <div className="w-20 h-20 bg-navy-800 border border-dashed border-navy-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                               <Search className="w-8 h-8" />
                             </div>
                             <p className="text-slate-500 font-medium italic">Search for wood pieces to start building a sale</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cart Side */}
                  <div className="lg:col-span-4 flex flex-col gap-6 h-full">
                    <div className="bg-navy-800 p-6 rounded-3xl border border-navy-700 flex-1 flex flex-col shadow-2xl relative overflow-hidden">
                       <div className="mb-6">
                         <div className="flex items-center justify-between mb-6">
                           <h4 className="text-lg font-bold text-white flex items-center gap-2">
                             <ShoppingCart className="w-5 h-5 text-accent" />
                             Current Cart
                           </h4>
                           <span className="bg-navy-700 text-slate-300 text-xs px-2 py-1 rounded-full font-bold">{cart.length} items</span>
                         </div>

                         {/* Customer Selector */}
                         <div className="p-1 bg-navy-900 rounded-2xl border border-navy-700 mb-6">
                           <select 
                            className="bg-transparent text-white w-full px-4 py-3 outline-none text-sm font-medium"
                            onChange={(e) => setSelectedCustomer(customers.find(c => c.id === e.target.value))}
                            value={selectedCustomer?.id || ''}
                           >
                             <option value="" className="bg-navy-900">Walk-in Customer</option>
                             {customers.map(c => (
                               <option key={c.id} value={c.id} className="bg-navy-900">{c.name}</option>
                             ))}
                           </select>
                         </div>
                       </div>

                       <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 mb-6">
                         {cart.map((item) => (
                            <div key={item.serial} className="p-3 bg-navy-900/50 rounded-xl border border-navy-700/50 flex gap-3 relative group">
                               <div className="w-12 h-12 bg-navy-800 rounded-lg flex items-center justify-center border border-navy-700">
                                 <ImageIcon className="w-5 h-5 text-slate-600" />
                               </div>
                               <div className="flex-1">
                                 <div className="flex justify-between items-start">
                                    <h6 className="text-sm font-bold text-white">{item.serial}</h6>
                                    <button onClick={() => removeFromCart(item.serial)} className="text-slate-600 hover:text-rose-500 transition-colors">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                 </div>
                                 <div className="flex justify-between items-center mt-1">
                                    <div className="flex items-center gap-2">
                                       <span className="text-[10px] text-slate-500 uppercase font-bold">Qty: 1</span>
                                       <span className="text-xs text-accent font-bold">{item.cft} CFT</span>
                                    </div>
                                    <span className="text-sm font-bold text-white font-mono">${item.sell_rate}</span>
                                 </div>
                               </div>
                            </div>
                         ))}
                         {cart.length === 0 && (
                            <div className="text-center py-12 opacity-30">
                              <ShoppingCart className="w-12 h-12 mx-auto mb-2" />
                              <p className="text-sm">Empty Cart</p>
                            </div>
                         )}
                       </div>

                       <div className="pt-6 border-t border-navy-700 space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-500 font-medium">Subtotal</span>
                              <span className="text-white font-mono font-bold">${cart.reduce((s, i) => s + i.sell_rate, 0).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-500 font-medium">Tax (0%)</span>
                              <span className="text-white font-mono font-bold">$0.00</span>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                              <span className="text-lg font-bold text-white">Total</span>
                              <span className="text-2xl font-black text-accent font-mono">${cart.reduce((s, i) => s + i.sell_rate, 0).toFixed(2)}</span>
                            </div>
                          </div>

                          <button 
                            disabled={cart.length === 0 || isLoading}
                            onClick={() => processSale()}
                            className="w-full py-4 bg-accent text-navy-900 font-black text-lg rounded-2xl disabled:opacity-50 disabled:grayscale transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                          >
                             {isLoading ? <RefreshCcw className="w-6 h-6 animate-spin" /> : <>Pay Now <ArrowRight className="w-6 h-6" /></>}
                          </button>
                       </div>
                    </div>
                  </div>
                </motion.div>
             )}

             {activeTab === 'inventory' && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                  className="bg-navy-800 rounded-3xl border border-navy-700 overflow-hidden shadow-2xl"
                >
                  <div className="p-6 border-b border-navy-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xl font-bold text-white">Stock Management</h4>
                      <p className="text-sm text-slate-400">Total {inventory.length} pieces available in central warehouse</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex items-center gap-2 px-4 py-2 bg-navy-700 hover:bg-navy-600 rounded-xl text-sm font-medium transition-colors">
                        <Download className="w-4 h-4" /> Export CSV
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-accent text-navy-900 font-bold rounded-xl text-sm transition-all shadow-lg shadow-accent/20">
                        <Plus className="w-4 h-4" /> Add Piece
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-navy-900/50">
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Piece Serial</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Dimensions (L x W)</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">CFT</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Shipment (Car)</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Rate</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy-700">
                        {inventory.map((item) => (
                           <tr key={item.serial} className="hover:bg-navy-700/30 transition-colors group">
                             <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-navy-700 rounded-lg flex items-center justify-center overflow-hidden">
                                    <ImageIcon className="w-5 h-5 text-slate-500" />
                                 </div>
                                 <span className="font-bold text-white font-mono">{item.serial}</span>
                               </div>
                             </td>
                             <td className="px-6 py-4 text-sm font-medium">{item.length}" x {item.width}"</td>
                             <td className="px-6 py-4"><span className="px-2 py-1 bg-accent/10 text-accent rounded text-xs font-black">{item.cft} CFT</span></td>
                             <td className="px-6 py-4 text-sm text-slate-400 font-medium">{item.car_name}</td>
                             <td className="px-6 py-4">
                                <span className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", 
                                  item.status === 'available' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
                                  <div className={cn("w-1.5 h-1.5 rounded-full", item.status === 'available' ? "bg-emerald-400" : "bg-rose-400")} />
                                  {item.status}
                                </span>
                             </td>
                             <td className="px-6 py-4 font-mono font-bold text-white">${item.sell_rate}</td>
                             <td className="px-6 py-4">
                                <button className="p-2 hover:bg-navy-600 rounded-lg text-slate-500 hover:text-white transition-all">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                             </td>
                           </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 bg-navy-900/50 border-t border-navy-700 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>Page 1 of 1</span>
                    <div className="flex gap-2">
                       <button disabled className="px-3 py-1 bg-navy-800 rounded opacity-50">Prev</button>
                       <button disabled className="px-3 py-1 bg-navy-800 rounded opacity-50">Next</button>
                    </div>
                  </div>
                </motion.div>
             )}

             {activeTab === 'reports' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   <div className="md:col-span-2 bg-navy-800 p-8 rounded-3xl border border-navy-700 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center text-accent">
                         <BarChart3 className="w-10 h-10" />
                      </div>
                      <h4 className="text-2xl font-black text-white">Financial Insights</h4>
                      <p className="text-slate-400 max-w-sm">Detailed P&L, Sales Breakdown and Stock Aging reports are coming soon in the production release.</p>
                      <button className="px-8 py-3 bg-accent text-navy-900 font-black rounded-2xl shadow-xl shadow-accent/20 hover:scale-105 transition-transform">Download April Summary</button>
                   </div>
                </div>
             )}
           </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-navy-900 border-t border-navy-700 lg:hidden flex justify-around p-3 z-50">
        {NAV_ITEMS.filter(item => item.roles.includes(user.role)).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "p-2 rounded-xl flex flex-col items-center gap-1",
              activeTab === item.id ? "text-accent" : "text-slate-600"
            )}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
