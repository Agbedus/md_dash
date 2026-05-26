'use client';

import { useActionState, useState, useEffect } from 'react';
import { authenticate } from '@/app/lib/actions';
import { FiMail, FiLock, FiArrowRight, FiAlertCircle, FiLoader, FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from '@/lib/toast';

export default function LoginForm() {
  const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
    }
  }, [errorMessage]);

  return (
    <form action={dispatch} className="space-y-4">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]" htmlFor="email">
          Personnel Identifier
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiMail className="h-4 w-4 text-text-muted group-focus-within:text-emerald-500 transition-colors" />
          </div>
          <input
            className="block w-full pl-10 pr-3 py-3 bg-foreground/[0.04] border border-card-border rounded-xl text-sm text-foreground placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-bold"
            id="email"
            type="email"
            name="email"
            placeholder="name@example.com"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]" htmlFor="password">
          Security Protocol
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiLock className="h-4 w-4 text-text-muted group-focus-within:text-emerald-500 transition-colors" />
          </div>
          <input
            className="block w-full pl-10 pr-10 py-3 bg-foreground/[0.04] border border-card-border rounded-xl text-sm text-foreground placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-bold"
            id="password"
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="••••••••"
            required
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-foreground transition-colors focus:outline-none"
          >
            {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 rounded border-card-border bg-foreground/[0.03] text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0 cursor-pointer transition-all"
          />
          <label htmlFor="remember-me" className="ml-2 block text-[10px] font-black text-text-muted uppercase tracking-widest cursor-pointer hover:text-foreground transition-colors">
            Keep Session Active
          </label>
        </div>
        <div className="text-sm">
          <a href="#" className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest transition-colors">
            Recovery Access
          </a>
        </div>
      </div>
      
      <button
        className="w-full h-14 flex items-center gap-4 px-4 rounded-2xl bg-foreground/[0.03] hover:bg-foreground/[0.05] border border-card-border hover:border-emerald-500/30 text-sm font-bold text-text-secondary hover:text-foreground transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        aria-disabled={isPending}
        disabled={isPending}
      >
        <div className="p-2.5 rounded-xl bg-foreground/[0.03] group-hover:bg-emerald-500/10 transition-colors flex items-center justify-center shrink-0 border border-transparent group-hover:border-emerald-500/20">
          {isPending ? (
            <FiLoader className="animate-spin h-5 w-5 text-emerald-500" />
          ) : (
            <FiArrowRight className="h-5 w-5 text-emerald-500 group-hover:translate-x-1 transition-transform" />
          )}
        </div>
        <span className="uppercase tracking-[0.2em] text-xs font-black">{isPending ? 'Establishing Link...' : 'Execute Entry'}</span>
      </button>
    </form>
  );
}
