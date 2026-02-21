'use client';

import { useActionState, useState, useEffect } from 'react';
import { authenticate } from '@/app/lib/actions';
import { FiMail, FiLock, FiArrowRight, FiAlertCircle, FiLoader, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';

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
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider" htmlFor="email">
          Email
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiMail className="h-5 w-5 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
          </div>
          <input
            className="block w-full pl-10 pr-3 py-2.5 bg-white/[0.03] border border-white/5 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-sans"
            id="email"
            type="email"
            name="email"
            placeholder="name@example.com"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider" htmlFor="password">
          Password
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiLock className="h-5 w-5 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
          </div>
          <input
            className="block w-full pl-10 pr-10 py-2.5 bg-white/[0.03] border border-white/5 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-sans"
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
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-white transition-colors focus:outline-none"
          >
            {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 rounded border-white/5 bg-white/[0.03] text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-0 cursor-pointer"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-zinc-400 cursor-pointer hover:text-emerald-300 transition-colors">
            Remember me
          </label>
        </div>
        <div className="text-sm">
          <a href="#" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
            Forgot password?
          </a>
        </div>
      </div>
      
      <button
        className="w-full h-14 flex items-center gap-4 px-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/5 text-sm font-bold text-zinc-400 hover:text-zinc-100 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
        aria-disabled={isPending}
        disabled={isPending}
      >
        <div className="p-2.5 rounded-xl bg-white/[0.03] group-hover:bg-emerald-500/10 transition-colors flex items-center justify-center shrink-0">
          {isPending ? (
            <FiLoader className="animate-spin h-5 w-5 text-emerald-400" />
          ) : (
            <FiArrowRight className="h-5 w-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
          )}
        </div>
        <span className="uppercase tracking-wider">{isPending ? 'Authenticating...' : 'Sign in'}</span>
      </button>
    </form>
  );
}
