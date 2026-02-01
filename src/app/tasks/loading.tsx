import React from 'react';

export default function TasksLoading() {
  return (
    <div className="px-4 py-8 max-w-[1600px] mx-auto animate-pulse">
      <div className="space-y-8">
        
        {/* Header Skeleton */}
        <div className="space-y-2 mb-10">
          <div className="h-10 w-48 bg-white/5 rounded-lg" />
          <div className="h-5 w-64 bg-white/5 rounded-lg" />
        </div>

        {/* Summary Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 glass rounded-2xl bg-white/5 border border-white/5" />
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="h-20 glass rounded-2xl bg-white/5 border border-white/5 mb-8" />

        {/* Table Skeleton */}
        <div className="glass rounded-2xl overflow-hidden border border-white/5">
          <div className="h-12 bg-white/5 border-b border-white/5" />
          <div className="divide-y divide-white/5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-16 px-6 py-4 flex items-center gap-4">
                <div className="h-4 w-1/3 bg-white/5 rounded" />
                <div className="h-4 w-1/4 bg-white/5 rounded" />
                <div className="h-4 w-24 bg-white/5 rounded" />
                <div className="h-4 w-16 bg-white/5 rounded-full" />
                <div className="ml-auto h-8 w-8 bg-white/5 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
