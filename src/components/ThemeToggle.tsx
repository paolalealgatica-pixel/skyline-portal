'use client'
import { useEffect, useState } from 'react'

function getTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'dark'
  return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'dark'
}

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => { setTheme(getTheme()) }, [])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    // Cookie 1 año (funciona aunque localStorage esté bloqueado)
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`
  }

  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-label="Cambiar tema"
      style={{
        width: compact ? 30 : 34, height: compact ? 30 : 34, borderRadius: 8,
        background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, flexShrink: 0,
      }}
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  )
}
