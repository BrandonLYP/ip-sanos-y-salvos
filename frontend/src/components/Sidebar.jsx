import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icon } from './Icon';
import { Logo } from './Logo';
import { useUnreadAlerts } from '../hooks/useUnreadAlerts';

const NAV = [
  { to: '/', icon: 'bar-chart-fill', label: 'Dashboard' },
  { to: '/mapa', icon: 'map-fill', label: 'Mapa' },
  { to: '/mascotas', icon: 'heart-fill', label: 'Mascotas' },
  { to: '/alertas', icon: 'bell-fill', label: 'Alertas' },
  { to: '/ia', icon: 'robot', label: 'Motor IA' },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const unread = useUnreadAlerts();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-16 md:w-56 bg-gray-900 flex flex-col shrink-0">
      <div className="p-3 md:p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Logo className="w-8 h-8 rounded-md" />
          <div className="hidden md:block">
            <p className="text-white font-bold text-sm leading-tight">Sanos y Salvos</p>
            <p className="text-gray-400 text-xs">MVP v0.1</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            className={({ isActive }) =>
              `relative w-full flex items-center gap-3 px-2 md:px-3 py-2.5 rounded-lg text-sm transition ${
                isActive
                  ? 'bg-teal-600 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon name={n.icon} className="text-base" />
            <span className="hidden md:block truncate">{n.label}</span>
            {n.to === '/alertas' && unread > 0 && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none shadow">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 md:p-3 border-t border-gray-700 space-y-2">
        {user && (
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-400 px-2 truncate">
            <Icon name="person-fill" />
            <span className="truncate">{user.nombre}</span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg px-2 md:px-3 py-2 text-xs font-medium flex items-center gap-2 transition"
        >
          <Icon name="door-open-fill" />
          <span className="hidden md:block">Cerrar sesión</span>
        </button>
        <Link
          to="/reportar/perdida"
          className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 md:px-3 py-2 text-xs font-bold flex items-center gap-2 transition"
        >
          <Icon name="search" />
          <span className="hidden md:block">Reportar perdida</span>
        </Link>
        <Link
          to="/reportar/encontrada"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-2 md:px-3 py-2 text-xs font-bold flex items-center gap-2 transition"
        >
          <Icon name="heart-fill" />
          <span className="hidden md:block">Reportar encontrada</span>
        </Link>
      </div>
    </div>
  );
}
