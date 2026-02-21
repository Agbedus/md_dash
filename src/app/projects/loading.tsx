import React from 'react';

export default function ProjectsLoading() {
  return (
    <div className="p-4 md:p-8 pt-24 min-h-screen bg-transparent animate-pulse">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-white/[0.03] rounded-lg" />
            <div className="h-4 w-64 bg-white/[0.03] rounded-lg" />
          </div>
          <div className="flex gap-4">
            <div className="h-10 w-24 bg-white/[0.03] rounded-xl hidden sm:block" />
            <div className="h-10 w-32 bg-white/[0.03] rounded-xl" />
          </div>
        </div>

        {/* Search & Tabs Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/[0.03] p-2 rounded-2xl border border-white/5">
          <div className="h-10 w-full sm:w-64 bg-white/[0.03] rounded-xl border border-white/5" />
          <div className="h-10 w-48 bg-white/[0.03] rounded-xl" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-zinc-900/30 border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div className="h-6 w-20 bg-white/[0.03] rounded-lg" />
                <div className="h-6 w-12 bg-white/[0.03] rounded-lg" />
              </div>
              <div className="h-6 w-3/4 bg-white/[0.03] rounded-lg" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-white/[0.03] rounded" />
                <div className="h-4 w-5/6 bg-white/[0.03] rounded" />
              </div>
              <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                <div className="h-6 w-16 bg-white/[0.03] rounded-full" />
                <div className="h-6 w-24 bg-white/[0.03] rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
