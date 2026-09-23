import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ActivityChart({ snapshots }) {
  const chartData = useMemo(() => {
    if (!snapshots || snapshots.length === 0) {
      return [];
    }

    // Process real snapshot data (group by date)
    const countsByDate = {};
    
    // Sort snapshots by timestamp (oldest to newest)
    const sorted = [...snapshots].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    sorted.forEach((snap) => {
      const dateObj = new Date(snap.timestamp);
      // Format as Month Day (e.g. Sep 22)
      const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
    });

    return Object.keys(countsByDate).map(date => ({
      name: date,
      snapshots: countsByDate[date]
    }));
  }, [snapshots]);

  return (
    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-sm font-black text-slate-900">Snapshot Activity</h3>
        <p className="text-[11px] font-bold text-slate-400 mt-0.5">Daily pipeline execution volume</p>
      </div>
      <div className="flex-1 w-full min-h-[160px]">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                dy={10} 
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', padding: '8px 12px' }}
                itemStyle={{ fontSize: '13px', fontWeight: '900', color: '#0f172a' }}
                labelStyle={{ color: '#64748b', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}
              />
              <Bar dataKey="snapshots" name="Snapshots Captured" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === chartData.length - 1 ? '#10b981' : '#cbd5e1'} 
                    className="transition-all duration-300 hover:opacity-80"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-xs font-bold">
            No activity data available
          </div>
        )}
      </div>
    </div>
  );
}
