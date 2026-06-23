'use client'
import { createClient } from '@/lib/supabase-client'
import { useState } from 'react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' }
      }
    })
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'100%', maxWidth:'400px', padding:'0 24px', position:'relative' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'40px' }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:'16px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 1400" style={{ height: 48 }} aria-label="Ctrl">
              <g>
                <path d="M373.3343,720.1072c.0164,48.1405,47.2125,87.3914,94.8878,87.4143l472.1055.2272c15.0193.0072,28.9813-6.0365,39.1305-16.4276l27.3143-27.9655c4.588-4.6974,9.8222-9.3025,17.0426-9.3174l67.0835-.1384c6.4975-.0134,12.4202,3.3122,12.4829,10.6833l.163,19.1666c.0678,7.9722-4.077,14.0419-9.7461,19.15l-62.5462,56.3565c-11.798,10.6305-25.7192,18.6839-42.5519,18.6855l-534.0593.051c-23.3484.0022-46.1173-4.49-67.221-13.4764-52.7661-22.4688-88.9465-73.2908-90.894-130.8609l-.0713-65.5131c-.0344-31.5739,11.8267-61.9942,31.2883-86.676,19.7953-25.1052,46.5139-42.9917,77.1501-51.8935,16.515-4.7986,33.1566-7.5668,50.6142-7.5654l532.4084.0429c13.4836.0011,27.7967,4.0699,37.7795,12.569l70.1768,59.7467c4.6365,3.9474,7.5935,10.0885,7.5643,16.0237l-.1002,20.3244c-.0217,4.4119-4.2315,9.616-8.9876,9.6185l-70.5459.0367c-5.3545.0028-10.3353-2.129-14.0813-5.667l-29.3078-27.6807c-10.7801-10.1816-25.5193-16.0056-40.9046-16.0066l-462.7082-.0289c-34.1493-.0021-64.2761,10.286-85.1856,37.2701-11.4558,14.784-18.3012,32.2291-18.2948,51.0131l.0139,40.8379Z" fill="var(--text)"/>
                <path d="M879.9764,749.1645c-4.4364,4.1821-10.0757,6.2016-16.2143,6.2021l-342.8731.0267c-15.2325.0012-28.6791-4.1614-40.151-14.0743-21.5913-18.6569-25.5535-50.721-8.3151-74.0054,10.3883-14.0317,26.842-23.7235,45.053-23.7279l344.6769-.084c6.7195-.0016,12.7576,2.4627,17.2019,6.8519l30.8255,30.4425c10.8875,10.7522,10.4904,30.0071-.7069,40.5624l-29.4971,27.806Z" fill="var(--text)"/>
              </g>
            </svg>
          </div>
          <h1 style={{ fontFamily:'Inter, sans-serif', fontSize:'28px', fontWeight:'800', letterSpacing:'-0.5px', marginBottom:'8px', color:'var(--text)' }}>Ctrl</h1>
          <span style={{ display:'inline-block', fontSize:'10px', fontWeight:'700', letterSpacing:'1px', textTransform:'uppercase', padding:'4px 12px', borderRadius:'20px', background:'var(--accent)', color:'var(--accent-ink)', fontFamily:'JetBrains Mono, monospace' }}>Portal Cliente</span>
        </div>

        {/* Card */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'16px', padding:'32px' }}>
          <h2 style={{ fontSize:'17px', fontWeight:'700', marginBottom:'6px', color:'var(--text)' }}>Portal de clientes</h2>
          <p style={{ fontSize:'12.5px', color:'var(--text2)', marginBottom:'24px' }}>Accede con el correo Google que registró tu agencia. Verás solo lo tuyo.</p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width:'100%', padding:'12px', borderRadius:'10px',
              background:'white', color:'#1a1a1a', border:'none',
              fontSize:'13.5px', fontWeight:'600', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
              opacity: loading ? 0.7 : 1, transition:'all 0.15s'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Conectando...' : 'Continuar con Google'}
          </button>

          <div style={{ marginTop:'20px', padding:'12px', background:'var(--surface2)', borderRadius:'8px', fontSize:'11.5px', color:'var(--text2)', lineHeight:'1.6' }}>
            ¿Eres del <strong style={{ color:'var(--text)' }}>equipo Skyline</strong>?{' '}
            <a href="https://skyline-hq.vercel.app" style={{ color:'var(--accent-text)', fontWeight:600 }}>Entra al panel →</a>
          </div>
        </div>

        <p style={{ textAlign:'center', fontSize:'11px', color:'var(--text2)', marginTop:'20px', fontFamily:'JetBrains Mono, monospace' }}>
          Ctrl &copy; 2026 &mdash; Acceso privado
        </p>
      </div>
    </div>
  )
}
