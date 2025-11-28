import { db } from '@/db';
import { users } from '@/db/schema';
import UsersPageClient from '@/components/ui/users/users-page-client';

import { auth } from '@/auth';

export default async function UsersPage() {
  const allUsers = await db.select().from(users);
  const session = await auth();
  
  return <UsersPageClient initialUsers={allUsers} currentUser={session?.user} />;
}
