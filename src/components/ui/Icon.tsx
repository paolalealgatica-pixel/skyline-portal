'use client'
import type { LucideProps, LucideIcon } from 'lucide-react'

// Wrapper único de íconos (Lucide). Trazo fino y hereda el color del texto.
export default function Icon({ as: C, size = 18, ...rest }: { as: LucideIcon; size?: number } & LucideProps) {
  return <C size={size} strokeWidth={1.5} {...rest} />
}
