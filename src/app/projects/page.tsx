import React from 'react';
import ProjectsPageClient from '@/components/ui/projects/projects-page-client';

export default function ProjectsPage() {
  // Move all data fetching to the client via SWR for instant TTFB
  // The client component already handles background sync and loading states.
  return (
    <ProjectsPageClient />
  );
}
