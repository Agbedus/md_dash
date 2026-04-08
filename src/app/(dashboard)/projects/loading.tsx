import React from 'react';

export default function ProjectsLoading() {
  return (
    <div className="p-4 md:p-8 pt-24 min-h-screen bg-transparent animate-pulse">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-skeleton-bg rounded-lg" />
            <div className="h-4 w-64 bg-skeleton-bg rounded-lg" />
          </div>
          <div className="flex gap-4">
            <div className="h-10 w-24 bg-skeleton-bg rounded-xl hidden sm:block" />
            <div className="h-10 w-32 bg-skeleton-bg rounded-xl" />
          </div>
        </div>

        {/* Search & Tabs Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-skeleton-bg p-2 rounded-2xl border border-card-border">
          <div className="h-10 w-full sm:w-64 bg-skeleton-bg rounded-xl border border-card-border" />
          <div className="h-10 w-48 bg-skeleton-bg rounded-xl" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-zinc-900/30 border border-card-border rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div className="h-6 w-20 bg-skeleton-bg rounded-lg" />
                <div className="h-6 w-12 bg-skeleton-bg rounded-lg" />
              </div>
              <div className="h-6 w-3/4 bg-skeleton-bg rounded-lg" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-skeleton-bg rounded" />
                <div className="h-4 w-5/6 bg-skeleton-bg rounded" />
              </div>
              <div className="pt-4 border-t border-card-border flex justify-between items-center">
                <div className="h-6 w-16 bg-skeleton-bg rounded-full" />
                <div className="h-6 w-24 bg-skeleton-bg rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
