"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const ProjectProgressChart = ({ data }: { data: Array<{ name: string; progress: number; total: number; completed: number }> }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255, 255, 255, 0.05)" />
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis 
          dataKey="name" 
          type="category" 
          width={100} 
          axisLine={false} 
          tickLine={false}
          stroke="#94a3b8"
          fontSize={10}
        />
        <Tooltip
          cursor={{ fill: 'transparent' }}
          contentStyle={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '0.75rem',
            fontSize: '12px'
          }}
          formatter={(value: number) => [`${value}%`, 'Progress']}
        />
        <Bar dataKey="progress" radius={[0, 4, 4, 0]} barSize={12}>
          {data.map((entry, index) => (
            <Cell 
                key={`cell-${index}`} 
                fill={entry.progress === 100 ? 'var(--pastel-emerald)' : 'var(--pastel-indigo)'} 
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ProjectProgressChart;
