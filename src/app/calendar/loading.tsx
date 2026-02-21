import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function CalendarLoading() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-6 w-64" />
      </div>

      <div className="space-y-4">
        {/* Toolbar Skeleton */}
        <div className="flex justify-between items-center bg-white/[0.03] p-4 rounded-xl border border-white/5">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-20" />
          </div>
          <Skeleton className="h-8 w-40" />
          <div className="flex gap-1 bg-white/[0.03] p-1 rounded-lg">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-7 gap-px bg-white/[0.06] rounded-xl overflow-hidden border border-white/5">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={`head-${i}`} className="h-10 rounded-none bg-white/[0.03]" />
          ))}
          {[...Array(35)].map((_, i) => (
            <Skeleton key={`cell-${i}`} className="h-32 rounded-none bg-zinc-900/50" />
          ))}
        </div>
      </div>
    </div>
  );
}
