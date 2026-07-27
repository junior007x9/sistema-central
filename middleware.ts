import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. O Segurança olha se o usuário tem o "crachá" (cookie de sessão)
  const session = request.cookies.get('session')?.value;

  // 2. Definimos quais áreas são restritas
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');
  const isLoginRoute = request.nextUrl.pathname === '/login';

  // 3. Regra de Bloqueio: Se tentar acessar o Dashboard sem crachá, vai pra rua (Login)
  if (isDashboardRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 4. Regra de Conforto: Se já estiver logado e tentar acessar a tela de Login, manda direto pro Dashboard
  if (isLoginRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Se estiver tudo certo, deixa a pessoa passar
  return NextResponse.next();
}

// O Middleware só vai ser acionado nestas rotas específicas para não deixar o site lento
export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};