'use client'

// PROTOTYPE: floating bar to flip experience-section variants. Delete me.
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export const EXPERIENCE_VARIANTS = [
  { key: 'A', name: 'Atual' },
  { key: 'B', name: 'Linha do tempo' },
  { key: 'C', name: 'B + ano grande à esquerda' },
  { key: 'D', name: 'B + cartões com métricas' },
  { key: 'E', name: 'B recolhível' },
]

export function PrototypeSwitcher({ current }: { current: string }) {
  const router = useRouter()
  const params = useSearchParams()

  function go(step: number) {
    const index = EXPERIENCE_VARIANTS.findIndex((v) => v.key === current)
    const next =
      EXPERIENCE_VARIANTS[
        (index + step + EXPERIENCE_VARIANTS.length) % EXPERIENCE_VARIANTS.length
      ]
    const search = new URLSearchParams(params.toString())
    search.set('variant', next?.key ?? 'A')
    router.replace(`?${search.toString()}`, { scroll: false })
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      if (target.closest('input, textarea, [contenteditable]')) {
        return
      }
      if (event.key === 'ArrowLeft') {
        go(-1)
      }
      if (event.key === 'ArrowRight') {
        go(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (process.env.NODE_ENV === 'production') {
    return null
  }
  const name = EXPERIENCE_VARIANTS.find((v) => v.key === current)?.name
  return (
    <div className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-full bg-black px-4 py-2 text-sm text-white shadow-2xl">
      <button
        type="button"
        aria-label="Anterior"
        onClick={() => go(-1)}
        className="px-2 text-lg hover:text-white/70"
      >
        ←
      </button>
      <span>
        {current} ({name})
      </span>
      <button
        type="button"
        aria-label="Próxima"
        onClick={() => go(1)}
        className="px-2 text-lg hover:text-white/70"
      >
        →
      </button>
    </div>
  )
}
