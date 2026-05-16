import { useState, useEffect } from 'react';
import { X, Cpu, Star, Clock, MapPin, Zap } from 'lucide-react';
import type { User, Property } from '../types';

interface AIRecommenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  agents: User[];
  onSelectAgent: (agentId: string) => void;
}

export default function AIRecommenderModal({ isOpen, onClose, property, agents, onSelectAgent }: AIRecommenderModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnalyzing(true);
      setShowResults(false);
      const timer = setTimeout(() => {
        setIsAnalyzing(false);
        setShowResults(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const matchScores = [98, 94, 89];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scaleIn">
        {/* Header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 flex items-center justify-between p-6 pb-4 border-b border-gray-100 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recomendador IA</h2>
              <p className="text-xs text-gray-400">Agentes óptimos para tu propiedad</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {isAnalyzing && (
            <div className="flex flex-col items-center py-12 gap-4 animate-pulse">
              <div className="w-16 h-16 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
              <p className="text-sm font-medium text-gray-500">Evaluando mercado y agentes disponibles...</p>
              <div className="flex gap-1 mt-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          )}

          {showResults && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">
                {property ? `Analizamos ${agents.length} agentes para "${property.title}"` : 'Resultados del análisis:'}
              </p>

              {agents.slice(0, 3).map((agent, i) => (
                <div key={agent.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-violet-50/50 transition-all group">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {agent.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-bold text-gray-900 truncate">{agent.name}</h4>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                          <Zap className="w-3 h-3" />
                          <span className="text-xs font-bold">Match: {matchScores[i]}%</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Star className="w-3 h-3 text-amber-400" />
                          <span>{agent.properties_closed || 0} cerradas</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{agent.avg_close_days || 0} días prom.</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span>{agent.zone || 'Nacional'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onSelectAgent(agent.id);
                      onClose();
                    }}
                    className="w-full mt-3 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold shadow-lg shadow-violet-600/20 hover:bg-violet-700 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                  >
                    Enviar Oferta de Captación
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
