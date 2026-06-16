export function Icon({ name, className = '' }) {
  return <i className={`bi bi-${name} ${className}`.trim()} aria-hidden="true" />;
}
