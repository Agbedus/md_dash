import React from 'react';

export default function ClientsLoading() {
  return (
    <div className="p-4 md:p-8 pt-24 min-h-screen bg-transparent animate-pulse">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-white/5 rounded-lg" />
            <div className="h-4 w-64 bg-white/5 rounded-lg" />
          </div>
          <div className="h-10 w-32 bg-white/5 rounded-xl md:self-end" />
        </div>

        {/* Clients Table Skeleton */}
        <div className="glass rounded-2xl overflow-hidden border border-white/5">
          <div className="h-12 bg-white/5 border-b border-white/5 px-4 flex items-center gap-4">
            <div className="h-4 w-1/4 bg-white/5 rounded" />
            <div className="h-4 w-1/4 bg-white/5 rounded" />
            <div className="h-4 w-1/4 bg-white/5 rounded" />
            <div className="h-4 w-1/4 bg-white/5 rounded" />
          </div>
          <div className="divide-y divide-white/5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-transparent px-4 py-3 flex items-center gap-4">
                <div className="h-4 w-1/4 bg-white/5 rounded" />
                <div className="h-4 w-1/4 bg-white/5 rounded" />
                <div className="h-4 w-1/4 bg-white/5 rounded" />
                <div className="h-4 w-20 bg-white/5 rounded" />
                <div className="ml-auto h-8 w-8 bg-white/5 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
