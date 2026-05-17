import { useEffect, useState } from 'react';
import { BarChart2, Eye, MousePointer, Heart, MessageCircle, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usePropertyStore } from '../../store/propertyStore';
import type { PropertyAnalytics } from '../../types';

export default function PropietarioEstadisticas() {
  const user = useAuthStore((s) => s.user);
  const { properties, fetchProperties } = usePropertyStore();
  const [analyticsMap, setAnalyticsMap] = useState<Record<string, PropertyAnalytics>>({});
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) fetchProperties({ owner_id: user.id });
  }, [user, fetchProperties]);

  const publishedProperties = properties.filter((p) => p.stage_crm1 >= 4);

  useEffect(() => {
    if (!selectedId || !user || analyticsMap[selectedId]) return;
    setLoading(true);
    fetch(`/api/owners/properties/${selectedId}/analytics?owner_id=${user.id}`)
      .then((r) => r.json())
      .then((data: PropertyAnalytics) => {
        setAnalyticsMap((prev) => ({ ...prev, [selectedId]: data }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedId, user, analyticsMap]);

  const analytics = selectedId ? analyticsMap[selectedId] : null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Estadísticas de Marketing</h1>
        <p className="text-sm text-gray-400 mt-0.5">Visibilidad y engagement de tus propiedades</p>
      </div>

      {/* Property Selector */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
          Seleccionar Propiedad
        </label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent cursor-pointer"
        >
          <option value="">-- Elige una propiedad --</option>
          {publishedProperties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} · {p.currency === 'USD' ? '$' : 'Bs.'}{p.price.toLocaleString()}
            </option>
          ))}
        </select>
        {publishedProperties.length === 0 && (
          <p className="text-xs text-gray-400 mt-2">
            Aún no tienes propiedades publicadas en el mercado.
          </p>
        )}
      </div>

      {selectedId && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Rendimiento de Marketing</h2>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-400">Cargando estadísticas...</p>
            </div>
          )}

          {analytics && !loading && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                {/* Vistas */}
                <div className="group relative bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-blue-100 shadow-[0_8px_30px_rgb(59,130,246,0.08)] hover:shadow-[0_8px_30px_rgb(59,130,246,0.15)] hover:-translate-y-1 transition-all duration-300 overflow-hidden text-center">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-transparent rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 mb-3 shadow-inner ring-1 ring-blue-500/10">
                    <Eye className="w-5 h-5" />
                  </div>
                  <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600 mb-1">{analytics.views.toLocaleString()}</p>
                  <p className="text-[11px] font-bold text-blue-600/80 uppercase tracking-widest">Vistas</p>
                  <div className="mt-3 w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full w-[85%]" />
                  </div>
                </div>

                {/* Clics */}
                <div className="group relative bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-violet-100 shadow-[0_8px_30px_rgb(139,92,246,0.08)] hover:shadow-[0_8px_30px_rgb(139,92,246,0.15)] hover:-translate-y-1 transition-all duration-300 overflow-hidden text-center">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-violet-400/20 to-transparent rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100 text-violet-600 mb-3 shadow-inner ring-1 ring-violet-500/10">
                    <MousePointer className="w-5 h-5" />
                  </div>
                  <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600 mb-1">{analytics.clicks.toLocaleString()}</p>
                  <p className="text-[11px] font-bold text-violet-600/80 uppercase tracking-widest">Clics</p>
                  <div className="mt-3 w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-400 to-violet-500 rounded-full w-[60%]" />
                  </div>
                </div>

                {/* Guardados */}
                <div className="group relative bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-pink-100 shadow-[0_8px_30px_rgb(236,72,153,0.08)] hover:shadow-[0_8px_30px_rgb(236,72,153,0.15)] hover:-translate-y-1 transition-all duration-300 overflow-hidden text-center">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-400/20 to-transparent rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 text-pink-600 mb-3 shadow-inner ring-1 ring-pink-500/10">
                    <Heart className="w-5 h-5" />
                  </div>
                  <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600 mb-1">{analytics.saves.toLocaleString()}</p>
                  <p className="text-[11px] font-bold text-pink-600/80 uppercase tracking-widest">Guardados</p>
                  <div className="mt-3 w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-pink-400 to-pink-500 rounded-full w-[45%]" />
                  </div>
                </div>

                {/* Mensajes */}
                <div className="group relative bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-emerald-100 shadow-[0_8px_30px_rgb(16,185,129,0.08)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.15)] hover:-translate-y-1 transition-all duration-300 overflow-hidden text-center">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 mb-3 shadow-inner ring-1 ring-emerald-500/10">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600 mb-1">{analytics.messages}</p>
                  <p className="text-[11px] font-bold text-emerald-600/80 uppercase tracking-widest">Mensajes</p>
                  <div className="mt-3 w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full w-[30%]" />
                  </div>
                </div>
              </div>

              {/* Premium Engagement Score */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900 via-indigo-900 to-purple-900 p-[1px] shadow-2xl">
                {/* Glowing border effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 opacity-30 blur-md" />
                
                <div className="relative bg-gradient-to-br from-gray-900 to-indigo-950 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between overflow-hidden">
                  {/* Background decorations */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-500 rounded-full mix-blend-screen filter blur-[80px] opacity-40 animate-pulse" />
                  <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-fuchsia-500 rounded-full mix-blend-screen filter blur-[80px] opacity-40" />
                  
                  <div className="text-center sm:text-left z-10 mb-4 sm:mb-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 mb-3 backdrop-blur-md">
                      <Sparkles className="w-3.5 h-3.5 text-violet-300" />
                      <span className="text-[10px] font-bold text-violet-200 uppercase tracking-widest">Métrica Estrella</span>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-1 tracking-tight">Engagement Score</h3>
                    <p className="text-sm text-indigo-200 font-medium">Calidad de interacción con tu audiencia</p>
                  </div>
                  
                  <div className="relative z-10 flex items-baseline gap-2">
                    <span className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-indigo-200 drop-shadow-sm">
                      {analytics.engagement_score}
                    </span>
                    <span className="text-2xl font-bold text-indigo-400/60">/ 10.0</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {!selectedId && publishedProperties.length > 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-3xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
            <BarChart2 className="w-7 h-7 text-violet-400" />
          </div>
          <p className="text-gray-400 font-medium">Selecciona una propiedad para ver estadísticas</p>
        </div>
      )}
    </div>
  );
}
