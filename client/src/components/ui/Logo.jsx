export default function Logo({ size = 40, showText = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <filter id="logo-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {/* Shield */}
        <path
          d="M20 3L5 10V20C5 29 11.5 36.5 20 39C28.5 36.5 35 29 35 20V10L20 3Z"
          fill="url(#logo-grad)"
          filter="url(#logo-glow)"
          opacity="0.9"
        />
        {/* Lock body */}
        <rect x="14" y="19" width="12" height="10" rx="2" fill="white" opacity="0.95" />
        {/* Lock shackle */}
        <path
          d="M16 19V15C16 12.8 17.8 11 20 11C22.2 11 24 12.8 24 15V19"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.95"
        />
        {/* Keyhole */}
        <circle cx="20" cy="23.5" r="1.5" fill="url(#logo-grad)" />
        <rect x="19.25" y="24" width="1.5" height="2.5" rx="0.75" fill="url(#logo-grad)" />
      </svg>
      {showText && (
        <span
          style={{
            fontSize: size * 0.55,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Vaultix
        </span>
      )}
    </div>
  );
}
