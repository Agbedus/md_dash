'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function RangeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRange = searchParams.get('range') || '7d';

  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const range = e.target.value;
    const params = new URLSearchParams(searchParams);
    if (range === '7d') {
      params.delete('range');
    } else {
      params.set('range', range);
    }
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  return (
    <select 
      value={currentRange}
      onChange={handleRangeChange}
      className="bg-white/[0.03] border border-white/5 text-zinc-400 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-white/5 transition-colors cursor-pointer hover:text-white"
    >
      <option value="7d">This Week</option>
      <option value="last_week">Last Week</option>
      <option value="30d">Last 30 Days</option>
      <option value="90d">Last 90 Days</option>
      <option value="1y">Last Year</option>
    </select>
  );
}
