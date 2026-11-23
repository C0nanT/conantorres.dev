interface RecommendationCountdownProps {
  delayMs: number
  durationMs: number
  onEnd: () => void
}

// Barra fina logo abaixo do texto, acima da linha que separa o autor. Quem a
// usa monta só para a recomendação ativa (a montagem reinicia a animação) e
// pausa com hover/foco no `group` do pai.
export function RecommendationCountdown({
  delayMs,
  durationMs,
  onEnd,
}: RecommendationCountdownProps) {
  return (
    <span
      aria-hidden={true}
      style={{ animationDelay: `${delayMs}ms` }}
      className="pointer-events-none relative mx-auto mt-6 block h-[3px] w-1/2 animate-recommendation-bar-in overflow-hidden rounded-full bg-primary/15 motion-reduce:hidden"
    >
      <span className="absolute inset-0">
        <span
          onAnimationEnd={onEnd}
          style={{
            animationDelay: `${delayMs}ms`,
            animationDuration: `${durationMs}ms`,
          }}
          className="block h-full origin-right animate-recommendation-countdown bg-primary group-hover:[animation-play-state:paused] group-has-[:focus-visible]:[animation-play-state:paused]"
        />
      </span>
    </span>
  )
}
