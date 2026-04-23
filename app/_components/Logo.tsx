// Inline SVG logo — no file dependency, scales perfectly at any size
export function Logo({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Blue rounded-square background */}
      <rect width="40" height="40" rx="9" fill="#1b61c9" />
      {/* Subtle top highlight for depth */}
      <rect width="40" height="20" rx="9" fill="white" fillOpacity="0.07" />

      {/* Graduation cap — diamond shape */}
      <polygon points="20,8 28,12 20,16 12,12" fill="white" />

      {/* Tassel */}
      <line x1="28" y1="12" x2="28" y2="17" stroke="#93c5fd" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="28" cy="18" r="1.5" fill="#93c5fd" />

      {/* Book left page */}
      <path
        d="M11 19 C14 18 17.5 18 20 19 L20 31 C17.5 30 14 30 11 31 Z"
        fill="white"
        fillOpacity="0.92"
      />

      {/* Book right page (slightly transparent for depth) */}
      <path
        d="M29 19 C26 18 22.5 18 20 19 L20 31 C22.5 30 26 30 29 31 Z"
        fill="white"
        fillOpacity="0.6"
      />

      {/* Spine line */}
      <line x1="20" y1="19" x2="20" y2="31" stroke="#1b61c9" strokeWidth="1.5" />
    </svg>
  );
}
