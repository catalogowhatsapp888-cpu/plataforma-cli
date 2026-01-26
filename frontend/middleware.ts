import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')
    console.log(`[Middleware] Path: ${request.nextUrl.pathname}, Token: ${token ? 'Found' : 'Missing'}`);
    const isLoginPage = request.nextUrl.pathname === '/login'

    // Ignorar arquivos estáticos (se o matcher falhar)
    if (request.nextUrl.pathname.startsWith('/_next') || request.nextUrl.pathname.includes('.')) {
        return NextResponse.next();
    }

    // Se não tem token e tenta acessar página protegida
    if (!token && !isLoginPage) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Se tem token e tenta acessar login
    if (token && isLoginPage) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes) -> Talvez a API deva ser protegida? 
         *   Por simplicidade neste MVP, deixo API pública ou protejo tb?
         *   Deixo pública para o webhook funcionar sem cookie.
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
