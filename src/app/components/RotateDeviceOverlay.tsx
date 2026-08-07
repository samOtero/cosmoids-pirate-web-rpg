export default function RotateDeviceOverlay() {
  return (
    <section
      className="rotate-device-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rotate-device-title"
      aria-describedby="rotate-device-description"
    >
      <div className="rotate-device-card">
        <div className="rotate-device-icon" aria-hidden="true">
          <svg viewBox="0 0 160 120" fill="none">
            <rect
              x="56"
              y="18"
              width="50"
              height="84"
              rx="9"
              stroke="currentColor"
              strokeWidth="7"
            />
            <path
              d="M43 87C25 72 22 48 34 29"
              stroke="currentColor"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="m22 34 13-8 8 14"
              stroke="currentColor"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="81" cy="90" r="3.5" fill="currentColor" />
          </svg>
        </div>
        <p className="rotate-device-kicker">Adventure awaits</p>
        <h1 id="rotate-device-title">Rotate your device</h1>
        <p id="rotate-device-description">
          Cosmoids plays in landscape mode. Turn your device sideways to
          continue your voyage.
        </p>
      </div>
    </section>
  );
}
