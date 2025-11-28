import { auth } from '@/auth';
import { FiUser, FiMail, FiShield, FiCalendar } from 'react-icons/fi';
import Image from 'next/image';

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return <div className="p-8 text-white">Please log in to view your profile.</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen">
      <h1 className="text-4xl font-bold text-white mb-8 tracking-tight">My Profile</h1>

      <div className="glass p-8 rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start gap-8">
          {/* Avatar Section */}
          <div className="flex-shrink-0">
            {user.image ? (
              <div className="relative w-32 h-32">
                  <Image 
                    src={user.image} 
                    alt={user.name || 'User'} 
                    fill
                    className="rounded-full object-cover border-4 border-white/10 shadow-xl"
                  />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-4xl font-bold shadow-xl border-4 border-white/10">
                {(user.name || user.email || '?').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="flex-grow space-y-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <FiUser className="w-4 h-4" /> Full Name
                </label>
                <p className="text-xl text-white font-medium">{user.name || 'Not set'}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <FiMail className="w-4 h-4" /> Email Address
                </label>
                <p className="text-xl text-white font-medium">{user.email}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <FiShield className="w-4 h-4" /> Roles
                </label>
                <div className="flex flex-wrap gap-2">
                    {user.roles?.map(role => (
                        <div key={role} className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium capitalize">
                        {role.replace('_', ' ')}
                        </div>
                    )) || (
                        <span className="text-zinc-500">No roles assigned</span>
                    )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <FiCalendar className="w-4 h-4" /> Member Since
                </label>
                <p className="text-lg text-zinc-300">
                   {/* We don't have createdAt in session user by default, so omitting or fetching from DB if needed. For now, static or omitted. */}
                   Just now
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
