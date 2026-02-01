"use client";

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ProductivityChart = ({ data }: { data: Array<{ name: string; productivity: number; previousProductivity?: number }> }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '0.75rem',
            fontSize: '12px'
          }}
          itemStyle={{ padding: '2px 0' }}
        />
        <Legend 
            wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} 
            iconType="circle"
        />
        <Line 
            name="Current Period"
            type="monotone" 
            dataKey="productivity" 
            stroke="var(--pastel-indigo)" 
            strokeWidth={3} 
            dot={{ r: 4, fill: 'var(--pastel-indigo)', strokeWidth: 2, stroke: 'var(--background)' }} 
            activeDot={{ r: 6, strokeWidth: 0 }} 
        />
        <Line 
            name="Previous Period"
            type="monotone" 
            dataKey="previousProductivity" 
            stroke="var(--pastel-rose)" 
            strokeWidth={2} 
            strokeDasharray="5 5"
            dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ProductivityChart;
