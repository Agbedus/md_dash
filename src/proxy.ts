import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth?.user;
    const isAuthRoute = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register');
    
    // Public routes that don't require login
    const isLandingPage = nextUrl.pathname === '/';
    const isWiki = nextUrl.pathname.startsWith('/wiki');
    const isPublicRoute = isLandingPage || isWiki || nextUrl.pathname.startsWith('/api') || nextUrl.pathname.startsWith('/_next') || nextUrl.pathname.startsWith('/static') || nextUrl.pathname.includes('.');

    if (isAuthRoute) {
        if (isLoggedIn) {
            return Response.redirect(new URL('/dashboard', nextUrl));
        }
        return;
    }

    if (!isLoggedIn && !isPublicRoute) {
        let callbackUrl = nextUrl.pathname;
        if (nextUrl.search) {
            callbackUrl += nextUrl.search;
        }
        const encodedCallbackUrl = encodeURIComponent(callbackUrl);
        return Response.redirect(new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl));
    }
    
    // Authorization check for /users path
    if (nextUrl.pathname.startsWith('/users')) {
        const hasAccess = req.auth?.user?.roles?.some(role => ['super_admin', 'manager'].includes(role));
        if (!hasAccess) {
             return Response.redirect(new URL('/dashboard', nextUrl));
        }
    }
});

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
