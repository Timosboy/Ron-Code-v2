import { useEffect } from 'react';
import { Globe, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usePropertyStore } from '../../store/propertyStore';
import { TRANSACTION_LABELS } from '../../types';

export default function PublicarOferta() {
  const user = useAuthStore((s) => s.user);
  const { properties, fetchProperties, updateStage } = usePropertyStore();

  useEffect(() => {
    if (user) fetchProperties({ agent_id: user.id });
  }, [user, fetchProperties]);

  const publishableProperties = properties.filter((p) => p.stage_crm1 === 4);

  const handleTogglePublish = async (propertyId: string, currentState: boolean) => {
    await updateStage(propertyId, { published_to_map: !currentState });
    fetchProperties({ agent_id: user!.id });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Publicar Oferta</h1>
        <p className="text-sm text-gray-400 mt-0.5">Gestiona la visibilidad de propiedades captadas</p>
      </div>

      {publishableProperties.length === 0 ? (
        <div className="text-center py-20">
          <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No tienes propiedades listas para publicar</p>
          <p className="text-gray-300 text-sm mt-1">Completa el flujo de corretaje primero</p>
        </div>
      ) : (
        <div className="space-y-3">
          {publishableProperties.map((prop) => (
            <div
              key={prop.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-100 to-purple-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🏠</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{prop.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">
                      {prop.currency === 'USD' ? '$' : 'Bs.'}{prop.price.toLocaleString()}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-violet-100 text-violet-700 text-[10px] font-semibold">
                      {TRANSACTION_LABELS[prop.type]}
                    </span>
                    {prop.status_documents === 'saneado' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-semibold">
                        <div className="w-1 h-1 rounded-full bg-emerald-500" /> Saneado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 text-[10px] font-semibold">
                        <div className="w-1 h-1 rounded-full bg-rose-500" /> Alerta
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* iOS Toggle */}
              <button
                onClick={() => handleTogglePublish(prop.id, prop.published_to_map)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <span className={`text-xs font-semibold ${prop.published_to_map ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {prop.published_to_map ? 'Publicada' : 'Sin publicar'}
                </span>
                {prop.published_to_map ? (
                  <ToggleRight className="w-10 h-10 text-emerald-500" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-gray-300" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
