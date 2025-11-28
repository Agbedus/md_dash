import { db } from '@/db';
import { clients } from '@/db/schema';
import ClientsPageClient from '@/components/ui/clients/clients-page-client';

export default async function ClientsPage() {
  const allClients = await db.select().from(clients);
  
  return <ClientsPageClient initialClients={allClients} />;
}
