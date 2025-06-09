import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// Korumalı rotalar ve gerekli roller
const protectedRoutes = {
  '/admin': ['ADMIN'],
  '/admin/users': ['ADMIN'],
  '/admin/service-requests': ['ADMIN'],
  '/admin/blog': ['ADMIN'],
  '/admin/services': ['ADMIN'],
  '/service-request': ['USER', 'ADMIN'],
  '/profile': ['USER', 'ADMIN']
};

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Rota için gerekli rolleri kontrol et
    for (const [route, roles] of Object.entries(protectedRoutes)) {
      if (pathname.startsWith(route)) {
        // Kullanıcı oturum açmamışsa
        if (!token) {
          return NextResponse.redirect(new URL('/login', req.url));
        }

        // Kullanıcının rolü uygun değilse
        if (!roles.includes(token.role)) {
          // Admin sayfasına erişmeye çalışan normal kullanıcıyı ana sayfaya yönlendir
          if (pathname.startsWith('/admin')) {
            return NextResponse.redirect(new URL('/', req.url));
          }
          // Diğer durumlar için 403 hatası döndür
          return new NextResponse('Yetkisiz Erişim', { status: 403 });
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
);

// Hangi sayfalarda middleware çalışacak
export const config = {
  matcher: [
    '/admin/:path*',
    '/service-request/:path*',
    '/profile/:path*'
  ]
}; 