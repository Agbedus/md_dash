// Force rebuild for hydration fix
import ClientsPageClient from '@/components/ui/clients/clients-page-client';

import { getClients } from './actions';

export default async function ClientsPage() {
  const [allClients] = await Promise.all([
    getClients(),
  ]);
  
  return (
    <div className="px-4 py-8 max-w-[1600px] mx-auto min-h-screen">
      <ClientsPageClient initialClients={allClients} />
    </div>
  );
}
