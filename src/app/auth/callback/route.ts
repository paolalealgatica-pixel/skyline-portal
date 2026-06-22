import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// URL del panel interno (por si entra alguien del equipo a este portal)
const INTERNAL_APP = 'https://skyline-hq.vercel.app/dashboard'

async function handleCallback(request: Request) {
  const origin = new URL(request.url).origin
  const code = new URL(request.url).searchParams.get('code')
  if (!code) return NextResponse.redirect(`${origin}/?error=auth`)

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) return NextResponse.redirect(`${origin}/?error=auth`)

  const email = (data.user.email || '').toLowerCase()

  // Si es del equipo, este portal no es para ellos → al panel interno
  if (email.endsWith('@skylinemedia.io')) {
    return NextResponse.redirect(INTERNAL_APP)
  }

  // Buscar el cliente por access_email
  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .ilike('access_email', email)
    .maybeSingle()
  if (client) return NextResponse.redirect(`${origin}/cliente/${client.id}`)

  return NextResponse.redirect(`${origin}/?error=no-client`)
}

export async function GET(request: Request) { return handleCallback(request) }
export async function POST(request: Request) { return handleCallback(request) }
