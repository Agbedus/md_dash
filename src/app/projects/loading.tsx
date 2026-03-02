import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsLoading() {
  return (
    <div className="p-4 md:p-8 pt-24 min-h-screen bg-transparent">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-11 w-24 hidden sm:block rounded-xl" />
            <Skeleton className="h-11 w-44 rounded-xl" />
          </div>
        </div>

        {/* Intelligence Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 glass rounded-2xl border border-white/5" />
          ))}
        </div>

        {/* Search & Tabs Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center glass p-2 rounded-2xl border border-white/5">
          <Skeleton className="h-11 w-full sm:w-96 rounded-xl" />
          <Skeleton className="h-11 w-48 rounded-xl" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass border border-white/5 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-start">
                <Skeleton className="h-8 w-10 rounded-xl" />
                <Skeleton className="h-8 w-16 rounded-lg" />
              </div>
              <Skeleton className="h-7 w-3/4 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
              <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
