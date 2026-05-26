'use client'

import { PieChart, Pie, Cell, Tooltip } from 'recharts'

interface StatusChartProps {
  completed: number
  inProgress: number
  pending: number
}

export default function StatusChart({ completed, inProgress, pending }: StatusChartProps) {
  const data = [
    { name: 'Completed', value: completed, color: '#10b981' },
    { name: 'Running', value: inProgress, color: '#3b82f6' },
    { name: 'Pending', value: pending, color: '#64748b' }
  ].filter(d => d.value > 0)

  // If no data, show a placeholder
  if (data.length === 0) {
    data.push({ name: 'No Work', value: 1, color: '#1e293b' })
  }

  return (
    <div className="h-[200px] w-full relative group">
      <PieChart width={200} height={200} className="mx-auto">
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} className="transition-all duration-500 hover:opacity-80" />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
          itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
        />
      </PieChart>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-black text-white leading-none">
          {completed + inProgress + pending}
        </span>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total Stages</span>
      </div>
    </div>
  )
}
