import { useState, useCallback, useEffect } from 'react';
import { X, Upload, Shield, AlertTriangle, CheckCircle, FileText, PenTool } from 'lucide-react';
import type { DocumentContext, TransactionType, DocumentClause } from '../types';

interface AIDocumentAnalyzerProps {
  isOpen: boolean;
  onClose: () => void;
  context: DocumentContext;
  transactionType: TransactionType;
  onSign: (filename: string) => void;
}

export default function AIDocumentAnalyzer({ isOpen, onClose, context, transactionType, onSign }: AIDocumentAnalyzerProps) {
  const [phase, setPhase] = useState<'upload' | 'scanning' | 'results'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [filename, setFilename] = useState('');
  const [score, setScore] = useState(0);
  const [clauses, setClauses] = useState<DocumentClause[]>([]);
  const [hoveredClause, setHoveredClause] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPhase('upload');
      setFilename('');
      setScore(0);
      setClauses([]);
    }
  }, [isOpen]);

  const handleFileDrop = useCallback(
    async (file: File) => {
      setFilename(file.name);
      setPhase('scanning');

      // Simulate 2-second AI analysis
      setTimeout(async () => {
        try {
          const res = await fetch('/api/ai/analyze-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              context,
              transaction_type: transactionType,
            }),
          });
          const data = await res.json();
          setScore(data.score);
          setClauses(data.clauses);
          setPhase('results');
        } catch {
          setScore(85);
          setClauses([]);
          setPhase('results');
        }
      }, 2000);
    },
    [context, transactionType]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileDrop(file);
    },
    [handleFileDrop]
  );

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileDrop(file);
    },
    [handleFileDrop]
  );

  if (!isOpen) return null;

  const contextLabels: Record<DocumentContext, string> = {
    corretaje: 'Contrato de Corretaje',
    compromiso: 'Contrato de Compromiso / Reserva',
    final: 'Contrato Definitivo de Transferencia',
  };

  const scoreColor = score >= 90 ? 'text-emerald-500' : score >= 70 ? 'text-amber-500' : 'text-rose-500';
  const scoreTrackColor = score >= 90 ? '#10b981' : score >= 70 ? '#f59e0b' : '#f43f5e';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scaleIn">
        {/* Header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 flex items-center justify-between p-6 pb-4 border-b border-gray-100 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Auditor IA de Contratos</h2>
              <p className="text-xs text-gray-400">{contextLabels[context]}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {/* ─── PHASE 1: Upload ─── */}
          {phase === 'upload' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-violet-500 bg-violet-50 scale-[1.02]'
                  : 'border-violet-300 bg-violet-50/30 hover:bg-violet-50/60'
              }`}
            >
              <input
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={onFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className={`w-12 h-12 mx-auto mb-4 transition-colors ${isDragging ? 'text-violet-600' : 'text-violet-400'}`} />
              <p className="text-sm font-semibold text-gray-700 mb-1">
                Arrastra tu contrato legal aquí
              </p>
              <p className="text-xs text-gray-400">.pdf, .docx</p>
            </div>
          )}

          {/* ─── PHASE 2: Scanning ─── */}
          {phase === 'scanning' && (
            <div className="flex flex-col items-center py-16 gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-violet-500" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">IA analizando cláusulas de riesgo</p>
                <p className="text-sm font-semibold text-gray-700">y validando saneamiento...</p>
              </div>
              <p className="text-xs text-gray-400">{filename}</p>
              <div className="flex gap-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-violet-400"
                    style={{ animation: `bounce 1s infinite ${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ─── PHASE 3: Results ─── */}
          {phase === 'results' && (
            <div className="space-y-6">
              {/* Score Donut */}
              <div className="flex items-center justify-center gap-8">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke={scoreTrackColor}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(score / 100) * 314} 314`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-black ${scoreColor}`}>{score}%</span>
                    <span className="text-[10px] font-medium text-gray-400">Seguro</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs text-gray-500">Cláusulas seguras</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-xs text-gray-500">Cláusulas de riesgo</span>
                  </div>
                </div>
              </div>

              {/* Contract Viewer */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500">{filename}</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-4 space-y-4 text-sm leading-relaxed">
                  {clauses.map((clause, i) => (
                    <div
                      key={i}
                      className="relative"
                      onMouseEnter={() => setHoveredClause(i)}
                      onMouseLeave={() => setHoveredClause(null)}
                    >
                      <div
                        className={`p-3 rounded-xl transition-all cursor-help ${
                          clause.type === 'dangerous'
                            ? 'bg-rose-50 border border-rose-200 text-gray-700'
                            : 'bg-emerald-50 border border-emerald-200 text-gray-700'
                        }`}
                      >
                        <div className="flex items-start gap-2 mb-1">
                          {clause.type === 'dangerous' ? (
                            <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          )}
                          <span className={`text-[10px] font-bold uppercase tracking-wide ${
                            clause.type === 'dangerous' ? 'text-rose-600' : 'text-emerald-600'
                          }`}>
                            {clause.type === 'dangerous' ? 'Cláusula de Riesgo' : 'Cláusula Segura'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{clause.text}</p>
                      </div>

                      {/* Tooltip */}
                      {hoveredClause === i && (
                        <div className={`absolute left-4 right-4 z-30 p-3 rounded-xl shadow-xl text-xs font-medium leading-relaxed animate-fadeIn ${
                          clause.type === 'dangerous'
                            ? 'bg-rose-600 text-white -bottom-2 translate-y-full'
                            : 'bg-emerald-600 text-white -bottom-2 translate-y-full'
                        }`}>
                          <div className={`absolute -top-1.5 left-6 w-3 h-3 rotate-45 ${
                            clause.type === 'dangerous' ? 'bg-rose-600' : 'bg-emerald-600'
                          }`} />
                          {clause.tooltip}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sign Button */}
              <button
                onClick={() => {
                  onSign(filename);
                  onClose();
                }}
                className="w-full py-3.5 rounded-2xl bg-violet-600 text-white font-semibold text-sm shadow-lg shadow-violet-600/25 hover:bg-violet-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <PenTool className="w-4 h-4" />
                Firmar Digitalmente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
