import UsersPageClient from '@/components/ui/users/users-page-client';
import { auth } from '@/auth';

import { getUsers } from './actions';

export default async function UsersPage() {
  const [session, allUsers] = await Promise.all([
    auth(),
    getUsers(),
  ]);
  
  return <UsersPageClient initialUsers={allUsers} currentUser={session?.user} />;
}
