"use client";

interface StatItem {
  label: string;
  value: number | string;
  color?: string;
}

interface StatsWidgetProps {
  title: string;
  stats: StatItem[];
}

export default function StatsWidget({ title, stats }: StatsWidgetProps) {
  return (
    <div className="glass p-4 rounded-xl border border-white/5">
      <h4 className="font-semibold text-white mb-4">{title}</h4>
      
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white/[0.03] rounded-lg p-3">
            <div className={`text-2xl font-bold mb-1 ${stat.color || 'text-white'}`}>
              {stat.value}
            </div>
            <div className="text-xs text-zinc-400">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
