import { useState } from 'react';
import { X, User, Phone, Mail } from 'lucide-react';
import type { Property } from '../types';

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  onSubmit: (data: {
    buyer_name: string;
    buyer_phone: string;
    buyer_email: string;
  }) => void;
}

export default function LeadFormModal({ isOpen, onClose, property, onSubmit }: LeadFormModalProps) {
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');

  if (!isOpen || !property) return null;

  const handleSubmit = () => {
    if (!buyerName || !buyerPhone || !buyerEmail) return;
    onSubmit({ buyer_name: buyerName, buyer_phone: buyerPhone, buyer_email: buyerEmail });
    setBuyerName('');
    setBuyerPhone('');
    setBuyerEmail('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scaleIn">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Contactar Agente</h2>
            <p className="text-xs text-gray-400 mt-0.5">{property.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">
            Comparte tu información para que el agente se ponga en contacto contigo y te brinde más detalles sobre esta propiedad.
          </p>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Tu nombre completo"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                placeholder="+591 7XXXXXXX"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                type="email"
                placeholder="tu@email.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!buyerName || !buyerPhone || !buyerEmail}
            className="w-full py-3.5 rounded-2xl bg-violet-600 text-white font-semibold text-sm shadow-lg shadow-violet-600/25 hover:bg-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Enviar mi Información al Agente
          </button>
        </div>
      </div>
    </div>
  );
}
