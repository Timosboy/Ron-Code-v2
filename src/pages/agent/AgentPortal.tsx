import { useState } from 'react';
import { LogOut, Building2, Layers, Globe, ShoppingCart } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import FlujoCorretaje from './FlujoCorretaje';
import PublicarOferta from './PublicarOferta';
import FlujoVentas from './FlujoVentas';

const TABS = [
  { id: 'corretaje', label: 'Flujo Corretaje', icon: Layers },
  { id: 'publicar', label: 'Publicar Oferta', icon: Globe },
  { id: 'ventas', label: 'Flujo de Ventas', icon: ShoppingCart },
] as const;

type TabId = typeof TABS[number]['id'];

export default function AgentPortal() {
  const [activeTab, setActiveTab] = useState<TabId>('corretaje');
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 hidden sm:block">PropTech-Flow</span>
              <span className="px-2 py-0.5 rounded-md bg-violet-100 text-violet-700 text-[10px] font-bold hidden sm:block">AGENTE</span>
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

          {/* Top Tabs */}
          <div className="flex gap-1 -mb-px">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                    isActive
                      ? 'text-violet-700 border-violet-600'
                      : 'text-gray-400 border-transparent hover:text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {activeTab === 'corretaje' && <FlujoCorretaje />}
        {activeTab === 'publicar' && <PublicarOferta />}
        {activeTab === 'ventas' && <FlujoVentas />}
      </main>
    </div>
  );
}
