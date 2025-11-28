import LoginForm from '@/components/ui/login-form';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center h-full bg-zinc-950 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md p-8 space-y-8 bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Sign in to your account to continue
          </p>
        </div>
        <LoginForm />
        <div className="text-center text-sm text-zinc-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                Sign up
            </Link>
        </div>
      </div>
    </main>
  );
}
