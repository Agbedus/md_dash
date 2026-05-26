import LoginForm from '@/components/ui/login-form';
import Link from 'next/link';
import AuthInfoSlider from '@/components/ui/auth/auth-info-slider';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen bg-background relative overflow-hidden">
      {/* Split Layout Container */}
      <div className="flex w-full">
        {/* Left Side: Animated Info (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-foreground/[0.02] overflow-hidden border-r border-card-border">
          {/* Background Gradients for Left Side */}
          <div className="absolute inset-0 pointer-events-none opacity-50">
            <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse-soft" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
          </div>
          
          <AuthInfoSlider />
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
          {/* Background Gradients for Right Side */}
          <div className="absolute inset-0 lg:hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[100px]" />
          </div>

          <div className="relative w-full max-w-md p-10 space-y-8 bg-background border border-card-border rounded-3xl shadow-2xl z-10">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4 animate-in zoom-in duration-500">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]" />
              </div>
              <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Welcome back</h1>
              <p className="text-text-muted font-bold uppercase tracking-widest text-[10px]">
                Authorized personnel access only
              </p>
            </div>
            
            <LoginForm />
            
            <div className="text-center text-[11px] font-black text-text-muted uppercase tracking-widest">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-emerald-500 hover:text-emerald-400 transition-colors underline-offset-4 hover:underline">
                    Initiate Enrollment
                </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
