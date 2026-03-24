import Sidebar from "@/components/ui/sidebar";
import TopNav from "@/components/ui/topnav";
import DashboardLayout from "@/components/ui/dashboard-layout";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardLayout 
      sidebar={<Sidebar user={session.user} />}
      topnav={<TopNav user={session.user} />}
      user={session.user}
    >
      {children}
    </DashboardLayout>
  );
}
