'use client';

import { useActionState } from 'react';
import { register } from '@/app/lib/actions';
import { FiUser, FiMail, FiLock, FiArrowRight, FiAlertCircle, FiLoader } from 'react-icons/fi';
import Link from 'next/link';

export default function RegisterForm() {
  const [errorMessage, dispatch, isPending] = useActionState(register, undefined);

  return (
    <form action={dispatch} className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider" htmlFor="fullName">
          Full Name
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiUser className="h-5 w-5 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
          </div>
          <input
            className="block w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            id="fullName"
            type="text"
            name="fullName"
            placeholder="John Doe"
            required
            minLength={2}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider" htmlFor="email">
          Email
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiMail className="h-5 w-5 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
          </div>
          <input
            className="block w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
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
            className="block w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            id="password"
            type="password"
            name="password"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>
      </div>


      <div
        className="flex h-8 items-end space-x-1"
        aria-live="polite"
        aria-atomic="true"
      >
        {errorMessage && (
          <>
            <FiAlertCircle className="h-5 w-5 text-emerald-500" />
            <p className="text-sm text-emerald-500">{errorMessage}</p>
          </>
        )}
      </div>
      <button
        className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] border border-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover-scale"
        aria-disabled={isPending}
        disabled={isPending}
      >
        {isPending ? (
          <FiLoader className="animate-spin h-5 w-5" />
        ) : (
          <>
            Create Account <FiArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </button>
      <div className="text-center text-sm text-zinc-400 mt-4">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
            Sign in
        </Link>
      </div>
    </form>
  );
}
