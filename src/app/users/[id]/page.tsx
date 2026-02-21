import { notFound } from 'next/navigation';
import { getUsers, getUserTimeLogs } from '@/app/users/actions';
import { getTasks } from '@/app/tasks/actions';
import UserDetailClient from '@/components/ui/users/user-detail-client';

interface UserDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
    const { id } = await params;

    const [allUsers, allTasks, timeLogs] = await Promise.all([
        getUsers(),
        getTasks(),
        getUserTimeLogs(id),
    ]);

    const user = allUsers.find((u: any) => u.id === id);
    if (!user) return notFound();

    const assignedTasks = allTasks.filter((t: any) =>
        t.assigneeIds?.includes(id) || t.userId === id
    );

    return (
        <div className="px-4 py-8 max-w-[1600px] mx-auto min-h-screen">
            <UserDetailClient user={user} tasks={assignedTasks} timeLogs={timeLogs} />
        </div>
    );
}
