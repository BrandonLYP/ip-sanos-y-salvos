import logo from '../../assets/favicon.jpeg';

export function Logo({ className = '' }) {
  return <img src={logo} alt="Sanos y Salvos" className={className} />;
}
