import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function NotesLoading() {
  return (
    <div className="flex flex-col h-screen p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header Skeleton */}
      <div className="mb-10 space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-6 w-64" />
      </div>

      {/* Controls Bar Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <Skeleton className="h-12 w-64" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-12 w-40" />
        </div>
      </div>

      {/* Filter Row Skeleton */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      {/* Masonry Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[420px] w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
