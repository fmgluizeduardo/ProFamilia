export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      {/* figura esquerda (verde) */}
      <path
        d="M8.5 35.5C8.5 21.5 15.5 13.2 22.6 10.6"
        stroke="#679e3f"
        strokeWidth="6.2"
        strokeLinecap="round"
      />
      <circle cx="14.5" cy="6.5" r="3.4" fill="#679e3f" />
      {/* figura direita (azul) */}
      <path
        d="M39.5 35.5C39.5 21.5 32.5 13.2 25.4 10.6"
        stroke="#3b8fd4"
        strokeWidth="6.2"
        strokeLinecap="round"
      />
      <circle cx="33.5" cy="6.5" r="3.4" fill="#3b8fd4" />
      {/* coração central (laranja) */}
      <path
        d="M24 36.2c-5.4-4.1-9.6-7.9-9.6-12.6 0-3 2.2-5.2 5-5.2 1.9 0 3.6 1.1 4.6 2.9 1-1.8 2.7-2.9 4.6-2.9 2.8 0 5 2.2 5 5.2 0 4.7-4.2 8.5-9.6 12.6Z"
        fill="#e67e22"
      />
    </svg>
  );
}

export function Logo({
  className = "",
  markClassName = "h-10 w-10",
  invert = false,
}: {
  className?: string;
  markClassName?: string;
  invert?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark className={markClassName} />
      <div className="leading-none">
        <div
          className={`text-[0.6rem] font-semibold tracking-[0.32em] ${
            invert ? "text-ink-300" : "text-ink-500"
          }`}
        >
          INSTITUTO
        </div>
        <div
          className={`font-display text-xl font-bold tracking-tight ${
            invert ? "text-white" : "text-ink-900"
          }`}
        >
          Pró<span className="text-brand-500">Família</span>
        </div>
      </div>
    </div>
  );
}
