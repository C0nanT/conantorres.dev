interface RecommendationCountdownProps {
  delayMs: number
  durationMs: number
  onEnd: () => void
}

// A barra fica colada na borda de baixo do card; o recorte arredondado
// acompanha os cantos do destaque. Quem a usa monta só para o autor ativo (a
// montagem reinicia a animação) e pausa com hover/foco no `group` do pai.
export function RecommendationCountdown({
  delayMs,
  durationMs,
  onEnd,
}: RecommendationCountdownProps) {
  return (
    <span
      aria-hidden={true}
      style={{ animationDelay: `${delayMs}ms` }}
      className="pointer-events-none absolute inset-0 animate-recommendation-bar-in overflow-hidden rounded-xl motion-reduce:hidden"
    >
      <span className="absolute inset-x-0 bottom-0 h-[3px] bg-primary/15">
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
