import Dashboard from "@/components/ui/dashboard";
import { getDashboardData } from "@/app/lib/dashboard-actions";

export default async function Home() {
  const dashboardData = await getDashboardData();

  if (!dashboardData) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="glass p-6 rounded-2xl text-center">
          <h2 className="text-xl font-bold text-white mb-2">Please log in</h2>
          <p className="text-zinc-400">You need to be logged in to view the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <Dashboard dashboardData={dashboardData} />
  );
}