import PortalCliente from '@/components/PortalCliente'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function ClientePortalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexDirection: 'column', gap: '16px' }}>
        <p>Error cargando cliente</p>
        <p style={{ fontSize: 12, color: '#666' }}>ID: {id}</p>
        <p style={{ fontSize: 12, color: '#666' }}>Error: {error?.message}</p>
      </div>
    )
  }

  const { data: files } = await supabase
    .from('client_files').select('*').eq('client_id', id).order('created_at', { ascending: false })

  const { data: metrics } = await supabase
    .from('client_metrics').select('*').eq('client_id', id)

  const { data: assets } = await supabase
    .from('client_assets').select('*').eq('client_id', id).order('uploaded_at', { ascending: false })

  const { data: contacts } = await supabase
    .from('client_contacts').select('*').eq('client_id', id).order('created_at', { ascending: true })

  return <PortalCliente client={client} files={files || []} metrics={metrics || []} assets={assets || []} contacts={contacts || []} userId={user.id} />
}
