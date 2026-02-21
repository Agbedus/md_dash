import RegisterForm from '@/components/ui/register-form';
import AuthInfoSlider from '@/components/ui/auth/auth-info-slider';

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Split Layout Container */}
      <div className="flex w-full">
        {/* Left Side: Animated Info (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900 overflow-hidden border-r border-white/5">
          {/* Background Gradients for Left Side */}
          <div className="absolute inset-0 pointer-events-none opacity-50">
            <div className="absolute top-[20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-emerald-500/20 blur-[120px] animate-pulse-soft" />
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/20 blur-[100px] animate-pulse-soft" style={{ animationDelay: '1s' }} />
          </div>
          
          <AuthInfoSlider />
        </div>

        {/* Right Side: Register Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
          {/* Background Gradients for Mobile/Right Side */}
          <div className="absolute inset-0 lg:hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[100px]" />
          </div>

          <div className="relative w-full max-w-md p-10 space-y-8 glass rounded-3xl shadow-2xl z-10 border-white/5">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4 animate-in zoom-in duration-500">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]" />
              </div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">Create an account</h1>
              <p className="text-zinc-400 font-medium">
                Join the platform to manage your projects
              </p>
            </div>
            <RegisterForm />
          </div>
        </div>
      </div>
    </main>
  );
}
