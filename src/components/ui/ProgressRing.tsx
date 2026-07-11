/* =========================================================================
   ProgressRing — SVG-Kreisfortschritt (Level-Ring). COMPONENTS.md · Teil A.
   src/components/ui/ProgressRing.tsx
   Track `--hairline-strong`, Fill `--accent`, linecap round, um -90° gedreht.
   ========================================================================= */

interface ProgressRingProps {
  /** Fortschritt 0..1. */
  value: number;
  size?: number;
  stroke?: number;
  centerLabel?: string;
  centerValue?: string;
  className?: string;
}

export function ProgressRing({
  value,
  size = 44,
  stroke = 4,
  centerLabel,
  centerValue,
  className,
}: ProgressRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, value));
  const dashOffset = circumference * (1 - clamped);

  return (
    <div
      className={`progress-ring${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={centerValue ? `${centerLabel ?? 'Fortschritt'}: ${centerValue}` : undefined}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="progress-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className="progress-ring__fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {(centerValue || centerLabel) && (
        <span className="progress-ring__center" aria-hidden="true">
          {centerLabel && <span className="progress-ring__label">{centerLabel}</span>}
          {centerValue && <span className="progress-ring__value">{centerValue}</span>}
        </span>
      )}
    </div>
  );
}
