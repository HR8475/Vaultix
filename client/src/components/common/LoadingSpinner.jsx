export default function LoadingSpinner({ size = 'md', fullPage = false }) {
  const containerClass = `spinner-container ${
    fullPage ? 'spinner-container--full-page' : ''
  }`;

  return (
    <div className={containerClass}>
      <div className={`spinner spinner--${size}`} role="status" aria-label="Loading">
        <span className="sr-only">Loading…</span>
      </div>
    </div>
  );
}
