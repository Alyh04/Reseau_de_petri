interface IconProps {
  className?: string;
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg className={className} width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
      <polygon points="2,1 10,5.5 2,10" fill="currentColor" />
    </svg>
  );
}

export function PauseIcon({ className }: IconProps) {
  return (
    <svg className={className} width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
      <rect x="1.5" y="1" width="3" height="9" fill="currentColor" />
      <rect x="6.5" y="1" width="3" height="9" fill="currentColor" />
    </svg>
  );
}

export function StopIcon({ className }: IconProps) {
  return (
    <svg className={className} width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="currentColor" />
    </svg>
  );
}

export function ResetIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="11"
      height="11"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M10 6A4 4 0 1 1 6 2M6 2L8 0M6 2L4 0" />
    </svg>
  );
}

export function CalculIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="11" height="11" rx="2" />
      <line x1="4" y1="4" x2="9" y2="4" />
      <line x1="4" y1="6.5" x2="9" y2="6.5" />
      <line x1="4" y1="9" x2="7" y2="9" />
    </svg>
  );
}
