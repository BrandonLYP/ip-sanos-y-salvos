import { Sidebar } from './Sidebar';
import { useLocation } from 'react-router-dom';

const TITLES = {
  '/': { icon: '📊', label: 'Dashboard' },
  '/mapa': { icon: '🗺️', label: 'Mapa' },
  '/mascotas': { icon: '🐾', label: 'Mascotas' },
  '/alertas': { icon: '🔔', label: 'Alertas' },
  '/ia': { icon: '🤖', label: 'Motor IA' },
};

function getTitle(pathname) {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith('/mascotas/')) return { icon: '🐾', label: 'Detalle mascota' };
  if (pathname.startsWith('/reportar/')) return { icon: '📝', label: 'Reportar mascota' };
  return { icon: '🐾', label: 'Sanos y Salvos' };
}

export function Layout({ children }) {
  const location = useLocation();
  const { icon, label } = getTitle(location.pathname);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b px-4 md:px-6 py-3 flex items-center justify-between shrink-0">
          <h1 className="font-bold text-gray-800 text-base md:text-lg">
            {icon} {label}
          </h1>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="hidden md:inline">{apiUrl}</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
