"use client";

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const VelocityChart = ({ data }: { data: Array<{ date: string; count: number }> }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--pastel-teal)" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="var(--pastel-teal)" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="date" 
          stroke="#71717a" 
          fontSize={9} 
          tickLine={false} 
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis 
          stroke="#71717a" 
          fontSize={9} 
          tickLine={false} 
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '0.75rem',
            fontSize: '11px'
          }}
          labelStyle={{ color: '#94a3b8', fontSize: '10px' }}
          formatter={(value: any) => [`${value} tasks`, 'Closed']}
        />
        <Area 
          type="monotone" 
          dataKey="count" 
          stroke="var(--pastel-teal)" 
          fill="url(#colorVelocity)"
          strokeWidth={2.5} 
          dot={{ r: 3, fill: 'var(--pastel-teal)', strokeWidth: 2, stroke: 'var(--background)' }}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default VelocityChart;
