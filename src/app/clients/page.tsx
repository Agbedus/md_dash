import ClientsPageClient from '@/components/ui/clients/clients-page-client';

import { getClients } from './actions';

export default async function ClientsPage() {
  const [allClients] = await Promise.all([
    getClients(),
  ]);
  
  return <ClientsPageClient initialClients={allClients} />;
}
