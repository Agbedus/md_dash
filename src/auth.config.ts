import type { NextAuthConfig } from 'next-auth';
import type { Session } from 'next-auth';

// Small explicit token shape for runtime-safe access in callbacks
type NextAuthTokenShape = {
  id?: string;
  roles?: string[];
  picture?: string;
};

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminRoute = nextUrl.pathname.startsWith('/dashboard') || 
                          nextUrl.pathname.startsWith('/projects') || 
                          nextUrl.pathname.startsWith('/users') || 
                          nextUrl.pathname.startsWith('/clients') || 
                          nextUrl.pathname.startsWith('/tasks');

      if (isAdminRoute) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page (handled by auth config usually, but proxy.ts is our middleware)
      }
      return true;
    },
    async session({ session, token }: { session: Session; token: Record<string, unknown> }) {
      if (token) {
        // token is typed as unknown by NextAuth types here — cast to a small explicit shape and guard before assigning
        const tk = token as NextAuthTokenShape;
        if (typeof tk.id === 'string') {
          session.user.id = tk.id;
        }
        if (Array.isArray(tk.roles)) {
          session.user.roles = tk.roles;
        }
        if (typeof tk.picture === 'string') {
            session.user.image = tk.picture;
        }
      }
      return session;
    },
    async jwt({ token, user }: { token: Record<string, unknown>; user?: { id?: string; roles?: string[]; avatarUrl?: string | null } }) {
        if (user) {
            const newToken: Record<string, unknown> = {
                ...token,
                id: user.id as string,
                roles: user.roles || ['staff'],
            };
            if (user.avatarUrl) {
                newToken.picture = user.avatarUrl;
            } else {
                // Preserve existing picture from token if available
                const tokenAsShape = token as NextAuthTokenShape;
                if (typeof tokenAsShape.picture === 'string') {
                    newToken.picture = tokenAsShape.picture;
                }
            }
            return newToken;
        }
        return token;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
