import React, { useState } from 'react';
import { BarChart2 } from 'lucide-react';

export const MarketCalculator = () => {
  const [potentialCustomers, setPotentialCustomers] = useState(100000);
  const [conversionRate, setConversionRate] = useState(2);
  const [arpu, setArpu] = useState(50);

  const revenue = potentialCustomers * (conversionRate / 100) * arpu;

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl flex flex-col relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-yellow-500/20 rounded-xl">
            <BarChart2 className="w-5 h-5 text-yellow-500" />
          </div>
          <h2 className="text-sm font-bold tracking-widest uppercase text-white/70">Market Calculator</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Potential Customers</label>
            <input type="number" value={potentialCustomers} onChange={(e) => setPotentialCustomers(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Conversion Rate (%)</label>
            <input type="number" value={conversionRate} onChange={(e) => setConversionRate(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Avg Revenue per User ($)</label>
            <input type="number" value={arpu} onChange={(e) => setArpu(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm" />
          </div>
          <div className="pt-4 border-t border-white/10 mt-4">
            <div className="text-xs text-zinc-400">Estimated Annual Revenue</div>
            <div className="text-2xl font-bold text-white">${revenue.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
