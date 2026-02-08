// Force rebuild for hydration fix
import UsersPageClient from '@/components/ui/users/users-page-client';
import { auth } from '@/auth';
import { getUsers } from './actions';

export default async function UsersPage() {
  const [session, allUsers] = await Promise.all([
    auth(),
    getUsers(),
  ]);
  
  return (
    <div className="px-4 py-8 max-w-[1600px] mx-auto min-h-screen">
      <UsersPageClient initialUsers={allUsers} currentUser={session?.user} />
    </div>
  );
}
