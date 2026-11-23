'use client'

import { cn } from '@/lib/styling'
import { Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

const FEEDBACK_MS = 2000

interface CopyEmailButtonProps {
  email: string
}

// Em vez de abrir o app de e-mail, copia o endereço e avisa com um check
// no lugar do texto e um toast.
export function CopyEmailButton({ email }: CopyEmailButtonProps) {
  const [isCopied, setIsCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email)
    } catch {
      toast.error('Não foi possível copiar o e-mail')
      return
    }
    toast.success('E-mail copiado!')
    setIsCopied(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setIsCopied(false), FEEDBACK_MS)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="relative flex items-center text-left max-sm:mx-auto max-sm:justify-center max-sm:text-center text-sm text-muted-foreground transition-[color,transform] duration-200 hover:text-primary motion-safe:hover:translate-x-1"
    >
      <span>{email}</span>
      {/* below sm the check hangs off the right edge so the (invisible) icon
          does not push the address off-centre */}
      <Check
        className={cn(
          'ml-1.5 h-3.5 w-3.5 text-primary max-sm:absolute max-sm:top-1/2 max-sm:left-full max-sm:-translate-y-1/2 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none',
          isCopied ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        )}
        aria-hidden="true"
      />
      <span className="sr-only" aria-live="polite">
        {isCopied ? 'E-mail copiado' : 'Copiar e-mail'}
      </span>
    </button>
  )
}
