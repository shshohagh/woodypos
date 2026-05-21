import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Settings as SettingsIcon, 
  LogOut, 
  Menu, 
  X, 
  CreditCard,
  User,
  Lock,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

// Class merger utility
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

// Define layout and routing page options
export type PageID = 'dashboard' | 'pos' | 'inventory' | 'purchases' | 'reports' | 'settings';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier' | 'warehouse_staff';
}

export interface NavItem {
  id: PageID;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

// Nav items containing the requested 'purchases' page
export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'cashier', 'warehouse_staff'] },
  { id: 'pos', label: 'POS Terminal', icon: ShoppingCart, roles: ['admin', 'manager', 'cashier'] },
  { id: 'inventory', label: 'Central Stocks', icon: Package, roles: ['admin', 'manager', 'warehouse_staff'] },
  { id: 'purchases', label: 'Purchases Ledger', icon: CreditCard, roles: ['admin', 'manager', 'warehouse_staff'] },
  { id: 'reports', label: 'Insights & Reports', icon: BarChart3, roles: ['admin', 'manager'] },
  { id: 'settings', label: 'Configuration', icon: SettingsIcon, roles: ['admin'] },
];

interface SidebarProps {
  activeTab: PageID | string;
  onTabChange: (tab: PageID) => void;
  user: UserSession;
  onLogout: () => void;
}

interface LayoutProps {
  activeTab: PageID | string;
  onTabChange: (tab: PageID) => void;
  user: UserSession;
  onLogout: () => void;
  children: React.ReactNode;
}

interface RouterProps {
  activeTab: PageID | string;
  user: UserSession;
  childrenMap: Record<PageID | string, React.ReactNode>;
}

export const APP = {
  /**
   * APP.Sidebar component
   * Renders the desktop sidebar, collapsible, persisted to localStorage, role-aware.
   */
  Sidebar: ({ activeTab, onTabChange, user, onLogout }: SidebarProps) => {
    // Persist sidebar collapsed status in localStorage
    const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
      const saved = localStorage.getItem('woody_sidebar_collapsed');
      return saved === 'true';
    });

    const toggleCollapse = () => {
      const newState = !isCollapsed;
      setIsCollapsed(newState);
      localStorage.setItem('woody_sidebar_collapsed', String(newState));
    };

    // Filter menu options based on user role
    const filteredNavItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

    return (
      <aside 
        id="app-sidebar"
        className={cn(
          "fixed lg:static inset-y-0 left-0 bg-navy-800 border-r border-navy-700/60 z-40 transition-all duration-300 flex flex-col justify-between hidden lg:flex no-print h-screen",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar">
          {/* Logo Heading area */}
          <div className={cn("p-6 flex items-center justify-between border-b border-navy-700/60", isCollapsed && "justify-center")}>
            {!isCollapsed && (
              <span className="text-xl font-bold text-white tracking-widest bg-gradient-to-r from-accent to-blue-400 bg-clip-text text-transparent font-sans">
                WOODY ERP
              </span>
            )}
            <button 
              id="btn-sidebar-toggle"
              onClick={toggleCollapse} 
              className="p-2 hover:bg-navy-700 rounded-xl transition-colors text-slate-400 hover:text-white"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-2 mt-4 flex-1" id="sidebar-nav">
            {filteredNavItems.map((item) => (
              <button
                key={item.id}
                id={`btn-nav-${item.id}`}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 font-medium text-sm group",
                  activeTab === item.id 
                    ? "bg-accent text-navy-900 font-bold shadow-lg shadow-accent/15" 
                    : "text-slate-400 hover:bg-navy-700 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* sign out button at bottom */}
        <div className="p-4 border-t border-navy-700/60" id="sidebar-footer">
          <button 
            id="btn-sidebar-logout"
            onClick={onLogout} 
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-rose-400 hover:bg-rose-500/10 font-medium text-sm transition-all"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="truncate font-bold font-mono">Deauthorize Key</span>}
          </button>
        </div>
      </aside>
    );
  },

  /**
   * APP.Layout component
   * Houses the header bar details, sidebar rendering, and mobile bottom bar links.
   */
  Layout: ({ activeTab, onTabChange, user, onLogout, children }: LayoutProps) => {
    // Detect active label of current routing tab
    const currentNav = NAV_ITEMS.find(n => n.id === activeTab);
    const activeLabel = currentNav ? currentNav.label : 'Active Console';

    // Role-aware list for responsive bottom bar
    const mobileMenuItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

    return (
      <div className="w-full flex h-screen overflow-hidden" id="app-layout-root">
        {/* Desktop Collapsible Sidebar */}
        <APP.Sidebar 
          activeTab={activeTab} 
          onTabChange={onTabChange} 
          user={user} 
          onLogout={onLogout} 
        />

        {/* Main Column Overlay containing Top navbar and core view content */}
        <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative flex flex-col bg-navy-900">
          {/* Top Navbar */}
          <header 
            id="app-top-navbar"
            className="sticky top-0 z-30 bg-navy-900/85 backdrop-blur-md px-6 lg:px-8 py-4 flex items-center justify-between border-b border-navy-700/60 no-print flex-shrink-0"
          >
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold tracking-tight text-white capitalize bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                {activeLabel}
              </h2>
              <div 
                id="connection-indicator"
                className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-navy-800 text-[10px] uppercase font-bold text-slate-400 rounded-full border border-navy-700/50"
              >
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                Connection Established
              </div>
            </div>

            {/* Profile Avatar elements */}
            <div className="flex items-center gap-4" id="top-navbar-profile">
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

          {/* Render Core Page Screen with correct padding */}
          <div className="p-6 lg:p-8 flex-1 pb-24 lg:pb-8 no-print overflow-y-auto" id="app-view-content">
            {children}
          </div>

          {/* MOBILE SYSTEM BOTTOM NAVIGATOR */}
          <nav 
            id="app-mobile-bottom-nav"
            className="fixed bottom-0 inset-x-0 bg-navy-850/95 backdrop-blur-md border-t border-navy-700/60 lg:hidden flex justify-around p-3 z-[45] no-print shadow-xl"
          >
            {mobileMenuItems.map((item) => (
              <button
                key={item.id}
                id={`btn-mob-nav-${item.id}`}
                onClick={() => onTabChange(item.id)}
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
    );
  },

  /**
   * APP.Router component
   * Decides which page component to display or falls back to error messaging
   * in case role credentials are insufficient to load that panel.
   */
  Router: ({ activeTab, user, childrenMap }: RouterProps) => {
    const currentNavItem = NAV_ITEMS.find(n => n.id === activeTab);

    // Guard page access with explicit roles permission
    const isAuthorize = currentNavItem ? currentNavItem.roles.includes(user.role) : false;

    if (!isAuthorize) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-navy-800/40 rounded-3xl border border-navy-700/50" id="router-denied-view">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">Access Denied</h3>
          <p className="max-w-md text-sm text-slate-400 mt-2">
            Your user profile role <span className="text-rose-400 font-mono font-bold font-semibold uppercase">{user.role}</span> is not authorized to access the requested '{activeTab}' screen panel.
          </p>
        </div>
      );
    }

    const componentNode = childrenMap[activeTab];
    return (
      <React.Fragment>
        {componentNode || (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center" id="router-notfound-view">
            <p className="text-sm text-slate-400 italic">This screen segment is still under active development.</p>
          </div>
        )}
      </React.Fragment>
    );
  }
};
