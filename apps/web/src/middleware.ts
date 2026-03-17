export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/log/:path*',
    '/workouts/:path*',
    '/profile/:path*',
    '/recommendations/:path*',
    '/scan/:path*',
    '/community/:path*',
  ],
};
