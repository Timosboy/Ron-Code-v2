import { useState } from 'react';
import { Home, TrendingUp, Search, ShoppingBag, BarChart2, LogOut, Building2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import MisPropiedades from './MisPropiedades';
import MisVentas from './MisVentas';
import BuscarPropiedades from './BuscarPropiedades';
import MisCompras from './MisCompras';
import PropietarioEstadisticas from './PropietarioEstadisticas';

const TABS = [
  { id: 'propiedades', label: 'Propiedades', icon: Home },
  { id: 'ventas', label: 'Mis Ventas', icon: TrendingUp },
  { id: 'buscar', label: 'Buscar', icon: Search },
  { id: 'compras', label: 'Mis Compras', icon: ShoppingBag },
  { id: 'estadisticas', label: 'Estadísticas', icon: BarChart2 },
] as const;

type TabId = typeof TABS[number]['id'];

export default function ClientPortal() {
  const [activeTab, setActiveTab] = useState<TabId>('propiedades');
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      {activeTab !== 'buscar' && (
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 hidden sm:block">PropTech-Flow</span>
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
      )}

      {/* Content */}
      <main className={`flex-1 w-full ${activeTab === 'buscar' ? 'relative h-[100dvh]' : 'max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24'}`}>
        {activeTab === 'propiedades' && <MisPropiedades />}
        {activeTab === 'ventas' && <MisVentas />}
        {activeTab === 'buscar' && <BuscarPropiedades />}
        {activeTab === 'compras' && <MisCompras />}
        {activeTab === 'estadisticas' && <PropietarioEstadisticas />}
      </main>

      {/* Bottom Tab Bar (iOS style) */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 z-40 safe-area-bottom">
        <div className="max-w-lg mx-auto flex items-center justify-around h-16">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all cursor-pointer ${
                  isActive ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600'
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
