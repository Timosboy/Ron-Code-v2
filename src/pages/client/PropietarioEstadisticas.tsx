import { useEffect, useState } from 'react';
import { BarChart2, Eye, MousePointer, Heart, MessageCircle } from 'lucide-react';
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
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 rounded-2xl p-4 text-center">
                  <Eye className="w-5 h-5 text-blue-500 mx-auto mb-1.5" />
                  <p className="text-2xl font-black text-blue-700">{analytics.views.toLocaleString()}</p>
                  <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide mt-0.5">Vistas</p>
                </div>
                <div className="bg-violet-50 rounded-2xl p-4 text-center">
                  <MousePointer className="w-5 h-5 text-violet-500 mx-auto mb-1.5" />
                  <p className="text-2xl font-black text-violet-700">{analytics.clicks.toLocaleString()}</p>
                  <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-wide mt-0.5">Clics</p>
                </div>
                <div className="bg-pink-50 rounded-2xl p-4 text-center">
                  <Heart className="w-5 h-5 text-pink-500 mx-auto mb-1.5" />
                  <p className="text-2xl font-black text-pink-700">{analytics.saves.toLocaleString()}</p>
                  <p className="text-[10px] font-semibold text-pink-400 uppercase tracking-wide mt-0.5">Guardados</p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-4 text-center">
                  <MessageCircle className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
                  <p className="text-2xl font-black text-emerald-700">{analytics.messages}</p>
                  <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide mt-0.5">Mensajes</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 text-white text-center">
                <p className="text-xs font-semibold opacity-80 uppercase tracking-wider mb-1">Engagement Score</p>
                <p className="text-5xl font-black">{analytics.engagement_score}</p>
                <p className="text-sm opacity-70 mt-1">/ 10.0</p>
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
