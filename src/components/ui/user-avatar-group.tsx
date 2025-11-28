import React from 'react';
import Image from 'next/image';

interface UserLike {
    id?: string | number;
    name?: string | null;
    fullName?: string | null;
    image?: string | null;
    avatarUrl?: string | null;
}

interface UserAvatarGroupProps {
    users: UserLike[];
    limit?: number;
    size?: 'sm' | 'md' | 'lg';
}

export default function UserAvatarGroup({ users, limit = 3, size = 'md' }: UserAvatarGroupProps) {
    const displayUsers = users.slice(0, limit);
    const remaining = users.length - limit;

    const sizeClasses = {
        sm: 'h-6 w-6 text-[10px]',
        md: 'h-8 w-8 text-xs',
        lg: 'h-10 w-10 text-sm',
    };

    return (
        <div className="flex -space-x-2 overflow-hidden">
            {displayUsers.map((user, index) => {
                const name = user.name || user.fullName || 'User';
                const image = user.image || user.avatarUrl;
                const initials = (name || '?').charAt(0).toUpperCase();

                return (
                    <div 
                        key={user.id || index} 
                        className={`relative inline-block ${sizeClasses[size]} rounded-full ring-2 ring-zinc-900 bg-zinc-800`} 
                        title={name}
                    >
                        {image ? (
                            <Image
                                src={image}
                                alt={name}
                                fill
                                className="rounded-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-emerald-500/20 font-medium text-emerald-400">
                                {initials}
                            </div>
                        )}
                    </div>
                );
            })}
            {remaining > 0 && (
                <div className={`relative inline-block ${sizeClasses[size]} rounded-full ring-2 ring-zinc-900 bg-zinc-800 flex items-center justify-center font-medium text-zinc-400`}>
                    +{remaining}
                </div>
            )}
        </div>
    );
}
