import useSWR from 'swr';
import { getClients } from '@/app/clients/actions';
import { Client } from '@/types/client';

interface UseClientsProps {
    initialClients?: Client[];
}

export function useClients({ initialClients }: UseClientsProps = {}) {
    const { data, error, isLoading, mutate, isValidating } = useSWR(
        'clients',
        () => getClients(),
        {
            fallbackData: initialClients,
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            dedupingInterval: 5000,
        }
    );

    return {
        clients: data || [],
        isLoading,
        isValidating,
        error,
        mutate,
    };
}
