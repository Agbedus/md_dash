import { Suspense } from 'react';
import { auth } from '@/auth';
import { getUserName } from '@/app/lib/dashboard-actions';
import { 
  ProductivitySection, 
  StatsOverviewSection, 
  WorkloadSection, 
  TimeAllocationSection, 
  KeyTasksSection, 
  RecentNotesSection, 
  DecisionsSection, 
  FocusModeSection, 
  AssistantSection
} from '@/components/dashboard/sections';
import { ChartSkeleton, ListSkeleton, CardSkeleton } from '@/components/dashboard/skeletons';

export default async function Home() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="glass p-6 rounded-2xl text-center">
          <h2 className="text-xl font-bold text-white mb-2">Please log in</h2>
          <p className="text-zinc-400">You need to be logged in to view the dashboard.</p>
        </div>
      </div>
    );
  }

  const userName = session.user.name || 'User';
  
  // Determine greeting based on time
  const hour = new Date().getHours();
  let greeting = 'Good morning';
  if (hour >= 12 && hour < 18) greeting = 'Good afternoon';
  else if (hour >= 18) greeting = 'Good evening';

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">{greeting}, {userName}</h1>
        <p className="text-zinc-400 text-lg">Here is a summary of your day.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Charts Section */}
        
        <Suspense fallback={<div className="col-span-1 lg:col-span-2 h-96"><ChartSkeleton /></div>}>
            <ProductivitySection />
        </Suspense>

        <Suspense fallback={<div className="col-span-1 h-96"><ChartSkeleton /></div>}>
            <StatsOverviewSection />
        </Suspense>

        <Suspense fallback={<div className="col-span-1 h-96"><ChartSkeleton /></div>}>
            <WorkloadSection />
        </Suspense>

        <Suspense fallback={<div className="col-span-1 h-96"><ChartSkeleton /></div>}>
            <TimeAllocationSection />
        </Suspense>

        {/* Key Tasks */}
        <Suspense fallback={<div className="col-span-1 lg:col-span-2"><ListSkeleton /></div>}>
            <KeyTasksSection />
        </Suspense>

        {/* Upcoming Decisions */}
        <Suspense fallback={<div className="col-span-1 lg:col-span-1"><CardSkeleton /></div>}>
             <DecisionsSection />
        </Suspense>

        {/* Recent Notes */}
        <Suspense fallback={<div className="col-span-1 lg:col-span-2"><ListSkeleton /></div>}>
            <RecentNotesSection />
        </Suspense>

        {/* Static Sections */}
        <FocusModeSection />
        <AssistantSection />
      </div>
    </div>
  );
}