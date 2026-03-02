import useSWR from 'swr';
import { getUsers } from '@/app/users/actions';
import { User } from '@/types/user';

export function useUsers(initialUsers?: User[]) {
    const { data, error, isLoading, mutate, isValidating } = useSWR(
        'users',
        () => getUsers(),
        {
            fallbackData: initialUsers,
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            dedupingInterval: 60000, // Users don't change often
        }
    );

    return {
        users: data || [],
        isLoading,
        isValidating,
        error,
        mutate,
    };
}
