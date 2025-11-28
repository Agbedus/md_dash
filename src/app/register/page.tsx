import RegisterForm from '@/components/ui/register-form';

export default function RegisterPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md p-8 space-y-8 bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">Create an account</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Join the platform to manage your projects
          </p>
        </div>
        <RegisterForm />
      </div>
    </main>
  );
}
