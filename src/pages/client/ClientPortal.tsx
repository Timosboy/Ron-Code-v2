import { useState } from 'react';
import { Home, TrendingUp, Search, ShoppingBag, BarChart2, LogOut, Building2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import MisPropiedades from './MisPropiedades';
import MisVentas from './MisVentas';
import BuscarPropiedades from './BuscarPropiedades';
import MisCompras from './MisCompras';
import PropietarioEstadisticas from './PropietarioEstadisticas';
import SegmentedControl from '../../components/SegmentedControl';

const CLIENT_TABS = [
  { id: 'buscar', label: 'Buscar', icon: Search },
  { id: 'compras', label: 'Mis Ofertas', icon: ShoppingBag },
] as const;

const OWNER_TABS = [
  { id: 'propiedades', label: 'Mis propiedades', icon: Home },
  { id: 'ventas', label: 'Seguimiento', icon: TrendingUp },
  { id: 'estadisticas', label: 'Métricas', icon: BarChart2 },
] as const;

type ClientTabId = typeof CLIENT_TABS[number]['id'];
type OwnerTabId = typeof OWNER_TABS[number]['id'];
type TabId = ClientTabId | OwnerTabId;

export default function ClientPortal() {
  const [viewMode, setViewMode] = useState<number>(0); // 0 = Buscador, 1 = Propietario
  const [activeClientTab, setActiveClientTab] = useState<ClientTabId>('buscar');
  const [activeOwnerTab, setActiveOwnerTab] = useState<OwnerTabId>('propiedades');

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleViewChange = (index: number) => {
    setViewMode(index);
  };

  const currentTabs = viewMode === 0 ? CLIENT_TABS : OWNER_TABS;
  const activeTab = viewMode === 0 ? activeClientTab : activeOwnerTab;
  const setActiveTab = (id: string) => {
    if (viewMode === 0) setActiveClientTab(id as ClientTabId);
    else setActiveOwnerTab(id as OwnerTabId);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar - Always visible now */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
              <img
                src="/morar_white.ico"
                alt="Logo"
                className="w-6 h-6 object-contain"
              />
            </div>
            <span className="text-lg font-bold text-gray-900 hidden lg:block">MORAR</span>
          </div>

          <div className="flex-1 flex justify-center">
            <SegmentedControl
              options={['Buscador', 'Propietario']}
              value={viewMode}
              onChange={handleViewChange}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50">
              <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.name.charAt(0)}
              </div>
              <span className="text-sm font-medium text-violet-700 hidden sm:block">{user?.name}</span>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className={`flex-1 w-full ${activeTab === 'buscar' ? 'relative' : 'max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24'}`}>
        {/* Render Owner views */}
        {viewMode === 1 && activeTab === 'propiedades' && <MisPropiedades />}
        {viewMode === 1 && activeTab === 'ventas' && <MisVentas />}
        {viewMode === 1 && activeTab === 'estadisticas' && <PropietarioEstadisticas />}

        {/* Render Client views */}
        {viewMode === 0 && activeTab === 'buscar' && <BuscarPropiedades />}
        {viewMode === 0 && activeTab === 'compras' && <MisCompras />}
      </main>

      {/* Bottom Tab Bar (iOS style) */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 z-40 safe-area-bottom">
        <div className="max-w-lg mx-auto flex items-center justify-around h-16">
          {currentTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all cursor-pointer ${isActive ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[10px] font-semibold">{tab.label}</span>
                {isActive && <div className="w-1 h-1 rounded-full bg-violet-600 mt-0.5" />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
