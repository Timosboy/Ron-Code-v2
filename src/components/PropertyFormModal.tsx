import { useState } from 'react';
import { X, Home, FileText, DollarSign, CheckSquare, Square } from 'lucide-react';
import type { TransactionType, Currency } from '../types';

interface PropertyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    price: number;
    currency: Currency;
    type: TransactionType;
    has_titulo: boolean;
    has_folio: boolean;
    has_impuestos: boolean;
  }) => void;
}

export default function PropertyFormModal({ isOpen, onClose, onSubmit }: PropertyFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [type, setType] = useState<TransactionType>('venta');
  const [hasTitulo, setHasTitulo] = useState(false);
  const [hasFolio, setHasFolio] = useState(false);
  const [hasImpuestos, setHasImpuestos] = useState(false);

  if (!isOpen) return null;

  const allDocs = hasTitulo && hasFolio && hasImpuestos;

  const handleSubmit = () => {
    if (!title || !price) return;
    onSubmit({
      title,
      description,
      price: parseFloat(price),
      currency,
      type,
      has_titulo: hasTitulo,
      has_folio: hasFolio,
      has_impuestos: hasImpuestos,
    });
    setTitle('');
    setDescription('');
    setPrice('');
    setCurrency('USD');
    setType('venta');
    setHasTitulo(false);
    setHasFolio(false);
    setHasImpuestos(false);
    onClose();
  };

  const CheckItem = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
    <button onClick={onChange} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors w-full text-left cursor-pointer">
      {checked ? (
        <CheckSquare className="w-5 h-5 text-emerald-500 flex-shrink-0" />
      ) : (
        <Square className="w-5 h-5 text-gray-300 flex-shrink-0" />
      )}
      <span className={`text-sm font-medium ${checked ? 'text-gray-700' : 'text-gray-500'}`}>{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scaleIn">
        {/* Header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 flex items-center justify-between p-6 pb-4 border-b border-gray-100 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center">
              <Home className="w-5 h-5 text-violet-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Nueva Propiedad</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Departamento Zona Sur"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe tu propiedad..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Price + Currency */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Precio</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  type="number"
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div className="w-28">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Moneda</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full px-3 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all cursor-pointer"
              >
                <option value="USD">USD</option>
                <option value="BOB">BOB</option>
              </select>
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Transacción</label>
            <div className="flex gap-2">
              {(['venta', 'alquiler', 'anticretico'] as TransactionType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    type === t
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {t === 'venta' ? 'Venta' : t === 'alquiler' ? 'Alquiler' : 'Anticrético'}
                </button>
              ))}
            </div>
          </div>

          {/* Legal Checklist */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-violet-600" />
              <label className="text-sm font-semibold text-gray-700">Saneamiento Legal</label>
            </div>
            <div className="space-y-2">
              <CheckItem label="Título de Propiedad Original" checked={hasTitulo} onChange={() => setHasTitulo(!hasTitulo)} />
              <CheckItem label="Folio Real Actualizado" checked={hasFolio} onChange={() => setHasFolio(!hasFolio)} />
              <CheckItem label="Impuestos al Día" checked={hasImpuestos} onChange={() => setHasImpuestos(!hasImpuestos)} />
            </div>
            {/* Badge preview */}
            <div className="mt-3">
              {allDocs ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-semibold">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Saneado Garantizado
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-700 text-xs font-semibold">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Alerta Legal: Papeles Pendientes
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!title || !price}
            className="w-full py-3.5 rounded-2xl bg-violet-600 text-white font-semibold text-sm shadow-lg shadow-violet-600/25 hover:bg-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Registrar Propiedad
          </button>
        </div>
      </div>
    </div>
  );
}
