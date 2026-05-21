import React from 'react';
import { motion } from 'motion/react';

interface PurchasesViewProps {
  subCategories: any[];
  suppliers: any[];
  triggerToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({ 
  subCategories, 
  suppliers, 
  triggerToast 
}) => {
  return (
    <motion.div
      key="purchases"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="bg-navy-800 p-6 rounded-3xl border border-navy-700/80 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight">Purchases Journal & Car Shipments 📑</h3>
          <p className="text-slate-400 text-sm mt-1 max-w-xl leading-relaxed">Centralized procurement tracking, bulk lumber shipments, purchase vouchers, and billing accounts.</p>
        </div>
      </div>
      
      {/* Summary KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
        <div className="bg-navy-800 p-6 rounded-3xl border border-navy-700/60 shadow-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-450 font-mono">Completed Car Batches</p>
          <h4 className="text-3xl font-bold text-white mt-1 font-mono">3 Shipments</h4>
        </div>
        <div className="bg-navy-800 p-6 rounded-3xl border border-navy-700/60 shadow-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-450 font-mono">Total Volume Imported</p>
          <h4 className="text-3xl font-bold text-white mt-1 font-mono">1,000 CFT</h4>
        </div>
        <div className="bg-navy-800 p-6 rounded-3xl border border-navy-700/60 shadow-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-450 font-mono">Total Procurement Cost</p>
          <h4 className="text-3xl font-bold text-accent mt-1 tracking-tight font-mono">$89,250.00</h4>
        </div>
      </div>

      <div className="bg-navy-800 rounded-3xl border border-navy-700/60 overflow-hidden shadow-2xl p-6 space-y-4">
        <h4 className="font-bold text-white text-base">Active Procurement Vouchers</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-navy-900/60 text-xs font-bold uppercase text-slate-400 font-mono border-b border-navy-700/40">
                <th className="px-4 py-3">Shipment Voucher</th>
                <th className="px-4 py-3">Supplier Agent</th>
                <th className="px-4 py-3">Total Volume</th>
                <th className="px-4 py-3">Procurement Cost</th>
                <th className="px-4 py-3">Settlement State</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-750 font-sans text-sm text-slate-300">
              {subCategories.map((car: any) => {
                const supplier = suppliers.find(s => s.id === car.supplier_id) || { name: 'Burmese Forestry Co.' };
                const vol = car.id === 'CAR-APR-001' ? 450 : car.id === 'CAR-APR-002' ? 350 : 200;
                const cost = car.id === 'CAR-APR-001' ? 49500 : car.id === 'CAR-APR-002' ? 22750 : 17000;
                const status = car.id === 'CAR-APR-002' ? 'Settled' : 'In Progress';
                return (
                  <tr key={car.id} className="hover:bg-navy-700/10 transition-colors">
                    <td className="px-4 py-3 font-bold text-white font-mono text-xs">{car.name}</td>
                    <td className="px-4 py-3 text-slate-400">{supplier.name}</td>
                    <td className="px-4 py-3 font-mono font-bold text-accent">{vol} CFT</td>
                    <td className="px-4 py-3 font-mono">${cost.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={
                        status === "Settled" 
                          ? "px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                          : "px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }>{status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => triggerToast(`Voucher for ${car.name} loaded successfully from Central Ledger files.`, 'success')} 
                        className="px-3.5 py-1.5 bg-navy-700 hover:bg-navy-600 rounded-xl text-xs font-bold text-slate-200 transition-colors"
                      >
                        Vitals
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};
