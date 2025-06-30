import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas que não requerem autenticação
const publicPaths = ['/', '/auth', '/api/auth'];

// Rotas que requerem autenticação
const protectedPaths = ['/dashboard', '/profile'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Verificar se é uma rota pública
  const isPublicPath = publicPaths.some(publicPath => 
    pathname === publicPath || pathname.startsWith(`${publicPath}/`)
  );
  
  // Verificar se é uma rota protegida
  const isProtectedPath = protectedPaths.some(protectedPath => 
    pathname === protectedPath || pathname.startsWith(`${protectedPath}/`)
  );
  
  // Verificar se o usuário está autenticado usando o token do Privy
  const isAuthenticated = request.cookies.get('privy-auth')?.value;

  // Se a rota for protegida e o usuário não estiver autenticado, redirecionar para /auth
  if (isProtectedPath && !isAuthenticated) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }
  
  // Se o usuário estiver autenticado e tentar acessar a página de login, redirecionar para /dashboard
  if (isAuthenticated && pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
