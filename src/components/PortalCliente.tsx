'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import ThemeToggle from '@/components/ThemeToggle'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const STAGES = ['planificando', 'en curso', 'en revisión', 'finalizado']

const tagStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
  background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', textTransform: 'capitalize',
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
function fmtMesAnio(d?: string) { if (!d) return ''; const x = new Date(d); return `${MESES[x.getMonth()]} ${x.getFullYear()}` }
function mesesDesde(d?: string) { if (!d) return 0; const x = new Date(d); const n = new Date(); return Math.max(0, (n.getFullYear() - x.getFullYear()) * 12 + (n.getMonth() - x.getMonth())) }

// Equipo Skyline (a quién contactar)
const EQUIPO_SKYLINE = [
  { nombre: 'Paola Leal', rol: 'Dirección de cuentas', email: 'paola@skylinemedia.io' },
  { nombre: 'Alonso Vallejos', rol: 'Dirección de diseño', email: 'alonso@skylinemedia.io' },
]

const cardBox: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 24px' }
const cardTitle: React.CSSProperties = { margin: '0 0 14px', fontSize: 11, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'JetBrains Mono, monospace' }

function PortalStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ ...cardBox, padding: '16px 18px' }}>
      <div style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'JetBrains Mono, monospace', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
    </div>
  )
}

function PortalRow({ label, value, href }: { label: string; value?: string; href?: string }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
      <span style={{ color: 'var(--text2)', flexShrink: 0 }}>{label}</span>
      {href
        ? <a href={href} style={{ color: 'var(--accent-text)', textDecoration: 'none', fontWeight: 600, textAlign: 'right', wordBreak: 'break-all' }}>{value}</a>
        : <span style={{ color: 'var(--text)', fontWeight: 600, textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>}
    </div>
  )
}

export default function PortalCliente({ client, files, metrics, assets, contacts, projects, userId }: any) {
  const [uploading, setUploading] = useState(false)
  const [fileList, setFileList] = useState(files)
  const [assetList, setAssetList] = useState<any[]>(assets || [])
  const [tab, setTab] = useState<'entregables' | 'mis-archivos' | 'marca' | 'beta' | 'hosting' | 'firma' | 'metricas'>('entregables')

  // Fecha de inicio del servicio (editable) con fallback a creación del registro
  const desde = client.client_since || client.created_at

  // Próxima entrega: proyecto activo con end_date más cercana en el futuro
  const proyectos = projects || []
  const hoyStr = new Date().toISOString().slice(0, 10)
  const proximaEntrega = proyectos
    .filter((p: any) => p.end_date && p.end_date >= hoyStr && p.status !== 'completed')
    .sort((a: any, b: any) => a.end_date.localeCompare(b.end_date))[0] || null
  const diasParaEntrega = proximaEntrega
    ? Math.ceil((new Date(proximaEntrega.end_date + 'T12:00:00').getTime() - Date.now()) / 86400000)
    : null

  // Métricas destacadas: para cada (plataforma+label) tomar el último periodo y comparar con el anterior
  const destacadas = (() => {
    const groups: Record<string, any[]> = {}
    for (const m of (metrics || [])) {
      const k = `${m.platform || ''}|${m.label}`
        ;(groups[k] = groups[k] || []).push(m)
    }
    const out: { label: string; platform?: string; value: string; delta: number | null }[] = []
    for (const k of Object.keys(groups)) {
      const arr = groups[k].sort((a, b) => String(b.period || '').localeCompare(String(a.period || '')))
      const last = arr[0], prev = arr[1]
      const n = (v: any) => { const x = parseFloat(String(v).replace(/[^\d.-]/g, '')); return isNaN(x) ? null : x }
      const ln = n(last.value), pn = prev ? n(prev.value) : null
      const delta = (ln !== null && pn !== null && pn !== 0) ? Math.round(((ln - pn) / pn) * 100) : null
      out.push({ label: last.label, platform: last.platform, value: last.value, delta })
    }
    return out.slice(0, 4)
  })()

  // Línea de tiempo: entregables agrupados por mes (lo que ya recibió el cliente)
  const timeline = (() => {
    const entregables = (fileList || []).filter((f: any) => f.uploaded_by === 'agency')
    const groups: Record<string, any[]> = {}
    for (const f of entregables) {
      const d = new Date(f.created_at)
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        ;(groups[k] = groups[k] || []).push(f)
    }
    return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(k => {
      const [y, m] = k.split('-')
      return { label: `${MESES[parseInt(m) - 1]} ${y}`, items: groups[k] }
    })
  })()

  // Portal cliente: por defecto modo claro (si nunca eligió tema). El toggle se respeta.
  useEffect(() => {
    if (typeof document !== 'undefined' && !document.cookie.includes('theme=')) {
      document.documentElement.setAttribute('data-theme', 'light')
      document.cookie = 'theme=light; path=/; max-age=31536000; samesite=lax'
    }
  }, [])

  // Firma de correo (client_contacts)
  const existingContact = (contacts && contacts[0]) || null
  const [sig, setSig] = useState({
    id: existingContact?.id || '',
    first_name: existingContact?.first_name || '',
    last_name: existingContact?.last_name || '',
    role: existingContact?.role || '',
    email: existingContact?.email || '',
    phone: existingContact?.phone || '',
    company: existingContact?.company || client.company || client.name || '',
    website: existingContact?.website || client.website || '',
    linkedin: existingContact?.linkedin || '',
    instagram: existingContact?.instagram || client.instagram || '',
  })
  const [sigSaving, setSigSaving] = useState(false)
  const [sigMsg, setSigMsg] = useState('')

  // Inputs de las secciones nuevas
  const [colorForm, setColorForm] = useState({ name: '', value: 'var(--accent)' })
  const [betaForm, setBetaForm] = useState({ name: '', value: '' })
  const [hostingForm, setHostingForm] = useState({ name: 'Dominio', value: '' })
  const [logoUploading, setLogoUploading] = useState(false)

  const entregables = fileList.filter((f: any) => f.uploaded_by === 'agency')
  const misArchivos = fileList.filter((f: any) => f.uploaded_by === 'client')

  const logos   = assetList.filter(a => a.type === 'logo')
  const colores = assetList.filter(a => a.type === 'color')
  const betas   = assetList.filter(a => a.type === 'beta')
  const hosting = assetList.filter(a => a.type === 'hosting')
  const sigLogo = logos[0]?.value || client.logo_url || ''

  function buildSignatureHTML() {
    const line = (label: string, val: string) => val ? `<div style="font-size:12px;color:#555;margin:1px 0;"><span style="color:#999;">${label}:</span> ${val}</div>` : ''
    const logoCell = sigLogo
      ? `<td style="padding-right:16px;border-right:3px solid #D9C7A6;vertical-align:middle;"><img src="${sigLogo}" alt="" height="56" style="display:block;max-height:56px;"></td>`
      : ''
    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <tr>
    ${logoCell}
    <td style="padding-left:${sigLogo ? '16' : '0'}px;vertical-align:middle;">
      <div style="font-size:16px;font-weight:bold;color:#1a1a1a;">${sig.first_name} ${sig.last_name}</div>
      <div style="font-size:13px;color:#555;margin:2px 0 8px;">${[sig.role, sig.company].filter(Boolean).join(' · ')}</div>
      ${line('Tel', sig.phone)}
      ${line('Email', sig.email)}
      ${line('Web', sig.website)}
      ${line('LinkedIn', sig.linkedin)}
      ${line('Instagram', sig.instagram)}
    </td>
  </tr>
</table>`
  }

  async function saveSignature() {
    setSigSaving(true); setSigMsg('')
    const payload = {
      client_id: client.id,
      first_name: sig.first_name, last_name: sig.last_name, role: sig.role,
      email: sig.email, phone: sig.phone, company: sig.company,
      website: sig.website, linkedin: sig.linkedin, instagram: sig.instagram,
    }
    if (sig.id) {
      await supabase.from('client_contacts').update(payload).eq('id', sig.id)
    } else {
      const { data } = await supabase.from('client_contacts').insert(payload).select().single()
      if (data) setSig(s => ({ ...s, id: data.id }))
    }
    setSigSaving(false); setSigMsg('Guardado ✓')
    setTimeout(() => setSigMsg(''), 2000)
  }

  async function copySignature() {
    await navigator.clipboard.writeText(buildSignatureHTML())
    setSigMsg('HTML copiado ✓')
    setTimeout(() => setSigMsg(''), 2000)
  }

  function downloadSignature() {
    const blob = new Blob([`<!doctype html><meta charset="utf-8">${buildSignatureHTML()}`], { type: 'text/html' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `firma-${(sig.first_name || 'correo').toLowerCase()}.html`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function addAsset(type: string, name: string, value: string) {
    const { data } = await supabase.from('client_assets').insert({
      client_id: client.id, type, name, value,
    }).select().single()
    if (data) setAssetList([data, ...assetList])
  }

  async function deleteAsset(id: string) {
    await supabase.from('client_assets').delete().eq('id', id)
    setAssetList(assetList.filter(a => a.id !== id))
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    const path = `${client.id}/logos/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('client-files').upload(path, file)
    if (!error) {
      const { data: url } = supabase.storage.from('client-files').getPublicUrl(path)
      await addAsset('logo', file.name, url.publicUrl)
    }
    setLogoUploading(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const path = `${client.id}/client/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('client-files').upload(path, file)
    if (!error) {
      const { data: url } = supabase.storage.from('client-files').getPublicUrl(path)
      const { data: newFile } = await supabase.from('client_files').insert({
        client_id: client.id,
        name: file.name,
        file_url: url.publicUrl,
        file_type: 'cliente',
        uploaded_by: 'client',
        size_bytes: file.size,
      }).select().single()
      if (newFile) setFileList([newFile, ...fileList])
    }
    setUploading(false)
  }

  async function handleDownload(fileUrl: string, fileName: string) {
    const a = document.createElement('a')
    a.href = fileUrl
    a.download = fileName
    a.click()
  }

  const stageIndex = STAGES.indexOf(client.project_stage)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 1400" style={{ height: 28 }} aria-label="Ctrl">
            <g>
              <path d="M373.3343,720.1072c.0164,48.1405,47.2125,87.3914,94.8878,87.4143l472.1055.2272c15.0193.0072,28.9813-6.0365,39.1305-16.4276l27.3143-27.9655c4.588-4.6974,9.8222-9.3025,17.0426-9.3174l67.0835-.1384c6.4975-.0134,12.4202,3.3122,12.4829,10.6833l.163,19.1666c.0678,7.9722-4.077,14.0419-9.7461,19.15l-62.5462,56.3565c-11.798,10.6305-25.7192,18.6839-42.5519,18.6855l-534.0593.051c-23.3484.0022-46.1173-4.49-67.221-13.4764-52.7661-22.4688-88.9465-73.2908-90.894-130.8609l-.0713-65.5131c-.0344-31.5739,11.8267-61.9942,31.2883-86.676,19.7953-25.1052,46.5139-42.9917,77.1501-51.8935,16.515-4.7986,33.1566-7.5668,50.6142-7.5654l532.4084.0429c13.4836.0011,27.7967,4.0699,37.7795,12.569l70.1768,59.7467c4.6365,3.9474,7.5935,10.0885,7.5643,16.0237l-.1002,20.3244c-.0217,4.4119-4.2315,9.616-8.9876,9.6185l-70.5459.0367c-5.3545.0028-10.3353-2.129-14.0813-5.667l-29.3078-27.6807c-10.7801-10.1816-25.5193-16.0056-40.9046-16.0066l-462.7082-.0289c-34.1493-.0021-64.2761,10.286-85.1856,37.2701-11.4558,14.784-18.3012,32.2291-18.2948,51.0131l.0139,40.8379Z" fill="var(--text)"/>
              <path d="M879.9764,749.1645c-4.4364,4.1821-10.0757,6.2016-16.2143,6.2021l-342.8731.0267c-15.2325.0012-28.6791-4.1614-40.151-14.0743-21.5913-18.6569-25.5535-50.721-8.3151-74.0054,10.3883-14.0317,26.842-23.7235,45.053-23.7279l344.6769-.084c6.7195-.0016,12.7576,2.4627,17.2019,6.8519l30.8255,30.4425c10.8875,10.7522,10.4904,30.0071-.7069,40.5624l-29.4971,27.806Z" fill="var(--text)"/>
            </g>
          </svg>
          <span style={{ color: 'var(--text2)', fontSize: 13 }}>| Portal Cliente</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ThemeToggle compact />
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', padding: '6px 16px', borderRadius: 8, cursor: 'pointer' }}>
            Salir
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '32px 24px' }}>
        {/* Mensaje del equipo (editable desde el panel) */}
        {client.portal_message && (
          <div style={{ background: 'var(--accent)', color: 'var(--accent-ink)', borderRadius: 14, padding: '16px 22px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>💬</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7, marginBottom: 4, fontFamily: 'JetBrains Mono, monospace' }}>Mensaje de tu equipo</div>
              <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{client.portal_message}</div>
            </div>
          </div>
        )}

        {/* Bienvenida (hero estilo CRM) */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 18 }}>
          {client.logo_url ? (
            <img src={client.logo_url} alt="" style={{ width: 60, height: 60, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 60, height: 60, borderRadius: 14, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'var(--accent-text)', flexShrink: 0 }}>
              {client.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Bienvenido, {client.name} 👋</h1>
            {client.company && <p style={{ margin: '4px 0 10px', color: 'var(--text2)', fontSize: 14 }}>{client.company}</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {client.industry && <span style={tagStyle}>{client.industry}</span>}
              {(client.services || []).map((s: string) => <span key={s} style={tagStyle}>{s}</span>)}
            </div>
            {desde && (
              <p style={{ margin: '14px 0 0', fontSize: 12, color: 'var(--text2)', fontFamily: 'JetBrains Mono, monospace' }}>
                📅 Cliente desde {fmtMesAnio(desde)} · {mesesDesde(desde)} {mesesDesde(desde) === 1 ? 'mes' : 'meses'} con nosotros
              </p>
            )}
          </div>
        </div>

        {/* Stats rápidos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
          <PortalStat label="Cliente desde" value={fmtMesAnio(desde) || '—'} />
          <PortalStat label="Con nosotros" value={`${mesesDesde(desde)} ${mesesDesde(desde) === 1 ? 'mes' : 'meses'}`} />
          <PortalStat label="Servicios activos" value={String((client.services || []).length || 0)} />
          <PortalStat label="Archivos compartidos" value={String(fileList.length)} />
        </div>

        {/* Próxima entrega */}
        {proximaEntrega && (
          <div style={{ ...cardBox, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, borderLeft: '3px solid var(--accent)' }}>
            <div style={{ fontSize: 26, flexShrink: 0 }}>🎯</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>Próxima entrega</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{proximaEntrega.name}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-text)' }}>{diasParaEntrega === 0 ? 'Hoy' : diasParaEntrega === 1 ? 'Mañana' : `${diasParaEntrega} días`}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'JetBrains Mono, monospace' }}>{new Date(proximaEntrega.end_date + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}</div>
            </div>
          </div>
        )}

        {/* Métricas destacadas */}
        {destacadas.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ ...cardTitle, marginBottom: 12 }}>Tus resultados del último periodo</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              {destacadas.map((d, i) => (
                <div key={i} style={cardBox}>
                  <div style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'JetBrains Mono, monospace', marginBottom: 6 }}>
                    {d.platform ? `${d.platform} · ` : ''}{d.label}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{d.value}</span>
                    {d.delta !== null && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: d.delta >= 0 ? '#3ecf8e' : '#ff5f57' }}>
                        {d.delta >= 0 ? '↑' : '↓'} {Math.abs(d.delta)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Etapa del proyecto */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px 28px', marginBottom: 32 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 16, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'JetBrains Mono, monospace' }}>Estado del proyecto</h2>
          <div style={{ display: 'flex', gap: 0 }}>
            {STAGES.map((stage, i) => (
              <div key={stage} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  {i > 0 && <div style={{ flex: 1, height: 2, background: i <= stageIndex ? 'var(--accent)' : 'var(--border)' }} />}
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: i <= stageIndex ? 'var(--accent)' : 'var(--border)', border: i === stageIndex ? '3px solid var(--text)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--accent-ink)' }}>
                    {i < stageIndex ? '✓' : ''}
                  </div>
                  {i < STAGES.length - 1 && <div style={{ flex: 1, height: 2, background: i < stageIndex ? 'var(--accent)' : 'var(--border)' }} />}
                </div>
                <span style={{ fontSize: 11, color: i === stageIndex ? 'var(--accent)' : 'var(--text2)', textAlign: 'center', textTransform: 'capitalize', fontFamily: 'JetBrains Mono, monospace' }}>{stage}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contacto: tus datos + equipo Skyline */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 28 }}>
          <div style={cardBox}>
            <h3 style={cardTitle}>Tus datos de contacto</h3>
            {(() => {
              const c = (contacts && contacts[0]) || null
              const nombre = c ? `${c.first_name || ''} ${c.last_name || ''}`.trim() : null
              const email = (c && c.email) || client.access_email
              return (
                <>
                  <PortalRow label="Contacto" value={nombre || '—'} />
                  {c?.role && <PortalRow label="Cargo" value={c.role} />}
                  <PortalRow label="Email" value={email} href={email ? `mailto:${email}` : undefined} />
                  {c?.phone && <PortalRow label="Teléfono" value={c.phone} href={`tel:${c.phone}`} />}
                  <PortalRow label="Web" value={client.website} href={client.website} />
                  <PortalRow label="Instagram" value={client.instagram} />
                </>
              )
            })()}
          </div>

          <div style={cardBox}>
            <h3 style={cardTitle}>Tu equipo Skyline</h3>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text2)' }}>¿Dudas o necesitas algo? Escríbenos directo.</p>
            {EQUIPO_SKYLINE.map(p => (
              <div key={p.email} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--accent-text)', flexShrink: 0 }}>{p.nombre.charAt(0)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.nombre}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>{p.rol}</div>
                </div>
                <a href={`mailto:${p.email}`} style={{ fontSize: 12, color: 'var(--accent-text)', textDecoration: 'none', fontWeight: 600 }}>Escribir →</a>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 22, borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
          {[['entregables', '📦', 'Entregables'], ['mis-archivos', '📤', 'Mis archivos'], ['marca', '🎨', 'Mi marca'], ['beta', '🛠', 'Proyectos beta'], ['hosting', '🌐', 'Hosting'], ['firma', '✉️', 'Firma'], ['metricas', '📊', 'Métricas']].map(([key, icon, label]) => (
            <button key={key} onClick={() => setTab(key as any)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 16px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap',
                color: tab === key ? 'var(--text)' : 'var(--text2)',
                borderBottom: `2px solid ${tab === key ? 'var(--accent)' : 'transparent'}`, marginBottom: -1 }}>
              <span style={{ fontSize: 15 }}>{icon}</span> {label}
            </button>
          ))}
        </div>

        {/* Entregables */}
        {tab === 'entregables' && (
          <>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
            <h3 style={{ margin: '0 0 20px', color: 'var(--text)' }}>Archivos listos para descargar</h3>
            {entregables.length === 0 ? (
              <p style={{ color: 'var(--text2)', textAlign: 'center', padding: '40px 0' }}>Aún no hay entregables. Te notificaremos cuando estén listos.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {entregables.map((f: any) => (
                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 24 }}>📄</span>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{f.name}</p>
                        <p style={{ margin: 0, color: 'var(--text2)', fontSize: 12 }}>{f.size_bytes ? `${(f.size_bytes / 1024 / 1024).toFixed(2)} MB` : ''}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDownload(f.file_url, f.name)}
                      style={{ background: 'var(--accent)', color: 'var(--accent-ink)', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>
                      Descargar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {timeline.length > 0 && (
            <div style={{ ...cardBox, marginTop: 16 }}>
              <h3 style={cardTitle}>Lo que hemos hecho juntos</h3>
              {timeline.map((g, gi) => (
                <div key={gi} style={{ display: 'flex', gap: 14, paddingBottom: gi < timeline.length - 1 ? 14 : 0 }}>
                  <div style={{ width: 110, flexShrink: 0, fontSize: 12, fontWeight: 700, color: 'var(--accent-text)', textTransform: 'capitalize', paddingTop: 2 }}>{g.label}</div>
                  <div style={{ flex: 1, borderLeft: '2px solid var(--border)', paddingLeft: 14 }}>
                    {g.items.map((f: any) => (
                      <div key={f.id} style={{ fontSize: 13, color: 'var(--text)', padding: '3px 0' }}>📄 {f.name}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          </>
        )}

        {/* Mis archivos */}
        {tab === 'mis-archivos' && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: 'var(--text)' }}>Archivos que compartiste</h3>
              <label style={{ background: 'var(--accent)', color: 'var(--accent-ink)', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                {uploading ? 'Subiendo...' : '+ Subir archivo'}
                <input type="file" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
              </label>
            </div>
            {misArchivos.length === 0 ? (
              <p style={{ color: 'var(--text2)', textAlign: 'center', padding: '40px 0' }}>Sube aquí fotos, logos o contenido para que trabajemos con ellos.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {misArchivos.map((f: any) => (
                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 24 }}>📁</span>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{f.name}</p>
                        <p style={{ margin: 0, color: 'var(--text2)', fontSize: 12 }}>{new Date(f.created_at).toLocaleDateString('es-CL')}</p>
                      </div>
                    </div>
                    <span style={{ color: '#22c55e', fontSize: 12, fontWeight: 600 }}>✓ Recibido</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mi marca: logos + colores */}
        {tab === 'marca' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Logos */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ margin: 0, color: 'var(--text)' }}>Logos</h3>
                <label style={{ background: 'var(--accent)', color: 'var(--accent-ink)', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                  {logoUploading ? 'Subiendo...' : '+ Subir logo'}
                  <input type="file" accept="image/*,.svg,.pdf,.ai" style={{ display: 'none' }} onChange={handleLogoUpload} disabled={logoUploading} />
                </label>
              </div>
              {logos.length === 0 ? (
                <p style={{ color: 'var(--text2)', textAlign: 'center', padding: '30px 0' }}>Sube tu logo en alta resolución (PNG, SVG, PDF…).</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                  {logos.map(a => (
                    <div key={a.id} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                      <div style={{ height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                        <img src={a.value} alt={a.name} style={{ maxHeight: 70, maxWidth: '100%', objectFit: 'contain' }} />
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</p>
                      <button onClick={() => deleteAsset(a.id)} style={{ marginTop: 6, background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 11 }}>Eliminar</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Colores */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ margin: '0 0 18px', color: 'var(--text)' }}>Colores corporativos</h3>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <input type="color" value={colorForm.value} onChange={e => setColorForm({ ...colorForm, value: e.target.value })}
                  style={{ width: 44, height: 38, background: 'none', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer' }} />
                <input value={colorForm.name} onChange={e => setColorForm({ ...colorForm, name: e.target.value })} placeholder="Nombre (ej. Azul principal)"
                  style={{ flex: 1, minWidth: 160, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text)', fontFamily: 'Inter, sans-serif', outline: 'none' }} />
                <button onClick={() => { if (colorForm.value) { addAsset('color', colorForm.name || colorForm.value, colorForm.value); setColorForm({ name: '', value: 'var(--accent)' }) } }}
                  style={{ background: 'var(--accent)', color: 'var(--accent-ink)', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Agregar</button>
              </div>
              {colores.length === 0 ? (
                <p style={{ color: 'var(--text2)', textAlign: 'center', padding: '20px 0' }}>Agrega los colores de tu marca.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {colores.map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px' }}>
                      <span style={{ width: 26, height: 26, borderRadius: 6, background: a.value, border: '1px solid var(--border)' }} />
                      <div>
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--text)' }}>{a.name}</p>
                        <p style={{ margin: 0, fontSize: 10, color: 'var(--text2)', fontFamily: 'JetBrains Mono, monospace' }}>{a.value}</p>
                      </div>
                      <button onClick={() => deleteAsset(a.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Proyectos beta */}
        {tab === 'beta' && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
            <h3 style={{ margin: '0 0 6px', color: 'var(--text)' }}>Proyectos / sitios a mejorar</h3>
            <p style={{ margin: '0 0 18px', color: 'var(--text2)', fontSize: 13 }}>Cuéntanos qué te gustaría arreglar o mejorar (un sitio, una pieza, un proceso…).</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <input value={betaForm.name} onChange={e => setBetaForm({ ...betaForm, name: e.target.value })} placeholder="Título (ej. Sitio web actual)"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text)', fontFamily: 'Inter, sans-serif', outline: 'none' }} />
              <textarea value={betaForm.value} onChange={e => setBetaForm({ ...betaForm, value: e.target.value })} rows={3} placeholder="Describe qué quieres mejorar, o pega un link…"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text)', fontFamily: 'Inter, sans-serif', outline: 'none', resize: 'vertical' }} />
              <button onClick={() => { if (betaForm.name.trim()) { addAsset('beta', betaForm.name.trim(), betaForm.value); setBetaForm({ name: '', value: '' }) } }}
                style={{ alignSelf: 'flex-end', background: 'var(--accent)', color: 'var(--accent-ink)', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Enviar</button>
            </div>
            {betas.length === 0 ? (
              <p style={{ color: 'var(--text2)', textAlign: 'center', padding: '20px 0' }}>Aún no has enviado solicitudes.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {betas.map(a => (
                  <div key={a.id} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{a.name}</p>
                      <button onClick={() => deleteAsset(a.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>✕</button>
                    </div>
                    {a.value && <p style={{ margin: '6px 0 0', color: 'var(--text2)', fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word' }}>{a.value}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hosting / dominio */}
        {tab === 'hosting' && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
            <h3 style={{ margin: '0 0 6px', color: 'var(--text)' }}>Datos de hosting y dominio</h3>
            <p style={{ margin: '0 0 18px', color: 'var(--text2)', fontSize: 13 }}>Guarda aquí los accesos y datos técnicos (dominio, proveedor, usuario…).</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <input value={hostingForm.name} onChange={e => setHostingForm({ ...hostingForm, name: e.target.value })} placeholder="Campo (ej. Dominio)"
                style={{ width: 160, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text)', fontFamily: 'Inter, sans-serif', outline: 'none' }} />
              <input value={hostingForm.value} onChange={e => setHostingForm({ ...hostingForm, value: e.target.value })} placeholder="Valor (ej. miempresa.cl)"
                style={{ flex: 1, minWidth: 160, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text)', fontFamily: 'Inter, sans-serif', outline: 'none' }} />
              <button onClick={() => { if (hostingForm.name.trim() && hostingForm.value.trim()) { addAsset('hosting', hostingForm.name.trim(), hostingForm.value.trim()); setHostingForm({ name: 'Dominio', value: '' }) } }}
                style={{ background: 'var(--accent)', color: 'var(--accent-ink)', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Agregar</button>
            </div>
            {hosting.length === 0 ? (
              <p style={{ color: 'var(--text2)', textAlign: 'center', padding: '20px 0' }}>Sin datos de hosting todavía.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {hosting.map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, color: 'var(--text2)', width: 130, flexShrink: 0, fontFamily: 'JetBrains Mono, monospace' }}>{a.name}</span>
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', wordBreak: 'break-all' }}>{a.value}</span>
                    <button onClick={() => deleteAsset(a.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Firma de correo */}
        {tab === 'firma' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Formulario */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ margin: '0 0 18px', color: 'var(--text)' }}>Datos de la firma</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['first_name', 'Nombre'], ['last_name', 'Apellido'],
                  ['role', 'Cargo'], ['company', 'Empresa'],
                  ['email', 'Correo'], ['phone', 'Teléfono'],
                  ['website', 'Web'], ['linkedin', 'LinkedIn'],
                  ['instagram', 'Instagram'],
                ].map(([k, label]) => (
                  <div key={k} style={{ gridColumn: k === 'instagram' ? '1/-1' : 'auto' }}>
                    <label style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, display: 'block', marginBottom: 4, fontFamily: 'JetBrains Mono, monospace' }}>{label}</label>
                    <input value={(sig as any)[k]} onChange={e => setSig({ ...sig, [k]: e.target.value })}
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 10px', fontSize: 12.5, color: 'var(--text)', fontFamily: 'Inter, sans-serif', outline: 'none' }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 18, alignItems: 'center' }}>
                <button onClick={saveSignature} disabled={sigSaving}
                  style={{ background: 'var(--accent)', color: 'var(--accent-ink)', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  {sigSaving ? 'Guardando...' : 'Guardar'}
                </button>
                {sigMsg && <span style={{ fontSize: 12, color: '#3ecf8e' }}>{sigMsg}</span>}
              </div>
            </div>

            {/* Vista previa */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ margin: 0, color: 'var(--text)' }}>Vista previa</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={copySignature} style={{ background: 'transparent', color: 'var(--accent-text)', border: '1px solid #D9C7A630', borderRadius: 7, padding: '6px 12px', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Copiar HTML</button>
                  <button onClick={downloadSignature} style={{ background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 12px', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Descargar</button>
                </div>
              </div>
              <div style={{ background: '#fff', borderRadius: 10, padding: 20, minHeight: 120 }}
                dangerouslySetInnerHTML={{ __html: buildSignatureHTML() }} />
              <p style={{ fontSize: 11, color: 'var(--text2)', marginTop: 12, lineHeight: 1.5 }}>
                Copia el HTML y pégalo en la configuración de firma de tu cliente de correo (Gmail, Outlook…).
              </p>
            </div>
          </div>
        )}

        {/* Métricas */}
        {tab === 'metricas' && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
            <h3 style={{ margin: '0 0 20px', color: 'var(--text)' }}>Métricas</h3>
            {(!metrics || metrics.length === 0) ? (
              <p style={{ color: 'var(--text2)', textAlign: 'center', padding: '40px 0' }}>Las métricas estarán disponibles próximamente.</p>
            ) : (() => {
              const PLAT: Record<string, string> = { instagram: 'Instagram', linkedin: 'LinkedIn', web: 'Web' }
              const byPeriod: Record<string, Record<string, any[]>> = {}
              for (const m of metrics) {
                const per = m.period || 'Sin periodo'
                const plat = m.platform || 'otros'
                byPeriod[per] = byPeriod[per] || {}
                byPeriod[per][plat] = byPeriod[per][plat] || []
                byPeriod[per][plat].push(m)
              }
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {Object.entries(byPeriod).map(([per, plats]) => (
                    <div key={per}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-text)', marginBottom: 12, fontFamily: 'JetBrains Mono, monospace' }}>{per}</div>
                      {Object.entries(plats).map(([plat, ms]) => (
                        <div key={plat} style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8, textTransform: 'capitalize' }}>{PLAT[plat] || plat}</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                            {ms.map((m: any) => (
                              <div key={m.id} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
                                <p style={{ margin: '0 0 6px', color: 'var(--text2)', fontSize: 11, textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>{m.label}</p>
                                <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--accent-text)', fontFamily: 'JetBrains Mono, monospace' }}>{m.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
