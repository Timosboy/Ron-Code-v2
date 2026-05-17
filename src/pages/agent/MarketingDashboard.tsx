import { useEffect, useState } from 'react';
import {
  Megaphone, Sparkles, Share2, Camera, Eye, MousePointer,
  Heart, MessageCircle, Copy, Check, ChevronDown, ChevronUp, BarChart2,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usePropertyStore } from '../../store/propertyStore';
import { useMarketingStore } from '../../store/marketingStore';
import type { SocialPlatform, SocialPostRecord } from '../../types';

export default function MarketingDashboard() {
  const user = useAuthStore((s) => s.user);
  const { properties, fetchProperties } = usePropertyStore();
  const { campaign, analytics, loading, publishing, generateMarketing, publishContent, fetchAnalytics, reset } =
    useMarketingStore();

  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [platforms, setPlatforms] = useState<SocialPlatform[]>(['FACEBOOK', 'INSTAGRAM']);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showLongDesc, setShowLongDesc] = useState(false);
  const [showScript, setShowScript] = useState(false);

  useEffect(() => {
    if (user) fetchProperties({ agent_id: user.id });
  }, [user, fetchProperties]);

  useEffect(() => {
    reset();
    setPublishSuccess(false);
    setShowLongDesc(false);
    setShowScript(false);
    if (selectedPropertyId) fetchAnalytics(selectedPropertyId);
  }, [selectedPropertyId, fetchAnalytics, reset]);

  const agentProperties = properties.filter((p) => p.stage_crm1 >= 4);

  const handleGenerate = async () => {
    if (!selectedPropertyId) return;
    await generateMarketing(selectedPropertyId);
  };

  const handlePublish = async () => {
    if (!selectedPropertyId || !campaign || platforms.length === 0) return;
    const ok = await publishContent(selectedPropertyId, { platforms, content: campaign.content });
    if (ok) {
      setPublishSuccess(true);
      fetchAnalytics(selectedPropertyId);
      setTimeout(() => setPublishSuccess(false), 4000);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const togglePlatform = (platform: SocialPlatform) => {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const CopyBtn = ({ text, field }: { text: string; field: string }) => (
    <button
      onClick={() => handleCopy(text, field)}
      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer flex-shrink-0"
      title="Copiar"
    >
      {copiedField === field ? (
        <Check className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-gray-400" />
      )}
    </button>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Marketing Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Genera y publica contenido IA para tus propiedades</p>
      </div>

      {/* Property Selector */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
          Seleccionar Propiedad
        </label>
        <select
          value={selectedPropertyId}
          onChange={(e) => setSelectedPropertyId(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent cursor-pointer"
        >
          <option value="">-- Elige una propiedad --</option>
          {agentProperties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} · {p.currency === 'USD' ? '$' : 'Bs.'}{p.price.toLocaleString()}
            </option>
          ))}
        </select>
        {agentProperties.length === 0 && (
          <p className="text-xs text-gray-400 mt-2">
            No tienes propiedades en mercado. Completa el Flujo Corretaje primero.
          </p>
        )}
      </div>

      {selectedPropertyId ? (
        <>
          {/* AI Content Generation */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Contenido IA</h2>
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold shadow-lg shadow-violet-600/20 hover:bg-violet-700 transition-all disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Generar con IA
                  </>
                )}
              </button>
            </div>

            {!campaign && !loading && (
              <div className="text-center py-8 text-gray-300">
                <Megaphone className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-400">
                  Presiona "Generar con IA" para crear el contenido de marketing
                </p>
              </div>
            )}

            {campaign && (
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Título</span>
                    <CopyBtn text={campaign.content.title} field="title" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800 bg-gray-50 rounded-xl p-3">
                    {campaign.content.title}
                  </p>
                </div>

                {/* Short Description */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Descripción Corta</span>
                    <CopyBtn text={campaign.content.short_description} field="short" />
                  </div>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 leading-relaxed">
                    {campaign.content.short_description}
                  </p>
                </div>

                {/* Long Description (collapsible) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Descripción Larga</span>
                    <div className="flex items-center gap-1">
                      <CopyBtn text={campaign.content.long_description} field="long" />
                      <button
                        onClick={() => setShowLongDesc(!showLongDesc)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        {showLongDesc ? (
                          <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  {showLongDesc && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 whitespace-pre-line leading-relaxed">
                      {campaign.content.long_description}
                    </p>
                  )}
                </div>

                {/* Hashtags */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hashtags</span>
                    <CopyBtn text={campaign.content.hashtags.join(' ')} field="tags" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {campaign.content.hashtags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-semibold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">CTA</span>
                    <CopyBtn text={campaign.content.cta} field="cta" />
                  </div>
                  <p className="text-sm font-semibold text-violet-700 bg-violet-50 rounded-xl p-3">
                    {campaign.content.cta}
                  </p>
                </div>

                {/* Reel Script (collapsible) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Script de Reel / Video
                    </span>
                    <div className="flex items-center gap-1">
                      <CopyBtn text={campaign.content.reel_script} field="script" />
                      <button
                        onClick={() => setShowScript(!showScript)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        {showScript ? (
                          <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  {showScript && (
                    <pre className="text-xs text-gray-600 bg-gray-50 rounded-xl p-3 whitespace-pre-wrap font-mono leading-relaxed overflow-auto max-h-64">
                      {campaign.content.reel_script}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Publish Section */}
          {campaign && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Share2 className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Publicar en Redes</h2>
              </div>

              <div className="flex gap-3 mb-4">
                {(['FACEBOOK', 'INSTAGRAM'] as SocialPlatform[]).map((platform) => {
                  const selected = platforms.includes(platform);
                  const isFB = platform === 'FACEBOOK';
                  return (
                    <button
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all cursor-pointer ${
                        selected
                          ? isFB
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-pink-500 bg-pink-50 text-pink-700'
                          : 'border-gray-200 text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      {isFB ? <Share2 className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                      {isFB ? 'Facebook' : 'Instagram'}
                    </button>
                  );
                })}
              </div>

              {publishSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 mb-3">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <p className="text-sm font-semibold text-emerald-700">
                    ¡Publicado en {platforms.join(' e ')}! (modo simulado)
                  </p>
                </div>
              )}

              <button
                onClick={handlePublish}
                disabled={publishing || platforms.length === 0}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-semibold text-sm shadow-lg hover:from-blue-600 hover:to-violet-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {publishing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Publicando...
                  </>
                ) : (
                  <>
                    <Megaphone className="w-4 h-4" />
                    Publicar Ahora
                  </>
                )}
              </button>
            </div>
          )}

          {/* Analytics */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                <BarChart2 className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Estadísticas</h2>
            </div>

            {analytics ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
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

                <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 text-white text-center mb-4">
                  <p className="text-xs font-semibold opacity-80 uppercase tracking-wider mb-1">Engagement Score</p>
                  <p className="text-5xl font-black">{analytics.engagement_score}</p>
                  <p className="text-sm opacity-70 mt-1">/ 10.0</p>
                </div>
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
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900 via-indigo-900 to-purple-900 p-[1px] mb-6 shadow-2xl">
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

                {analytics.posts.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Publicaciones</p>
                    <div className="space-y-2">
                      {analytics.posts.map((post: SocialPostRecord) => (
                        <div
                          key={post.id}
                          className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50"
                        >
                          <div className="flex items-center gap-2">
                            {post.platform === 'FACEBOOK' ? (
                              <Share2 className="w-4 h-4 text-blue-500" />
                            ) : (
                              <Camera className="w-4 h-4 text-pink-500" />
                            )}
                            <span className="text-xs font-semibold text-gray-700">{post.platform}</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 font-semibold">
                            {post.status === 'simulated' ? 'Simulado' : 'Publicado'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <BarChart2 className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Cargando estadísticas...</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-3xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-7 h-7 text-violet-400" />
          </div>
          <p className="text-gray-400 font-medium">Selecciona una propiedad para comenzar</p>
          <p className="text-gray-300 text-sm mt-1">Genera contenido IA y publica en redes sociales</p>
        </div>
      )}
    </div>
  );
}
