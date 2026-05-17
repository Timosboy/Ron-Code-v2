import { useState } from 'react';
import { X, FileText, ShieldCheck, CheckCircle, Send, XCircle } from 'lucide-react';
import type { Property, CommissionType } from '../types';

interface AutoContractGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  ownerName: string;
  isAgentView?: boolean;
  aiContent?: string | null;
  onAccept: (filename: string) => void;
  onReject?: () => void;
  onCounteroffer?: (data: { type: CommissionType; amount: string; exclusivity: string; message: string }) => void;
}

export default function AutoContractGenerator({ isOpen, onClose, property, ownerName, isAgentView, aiContent, onAccept, onReject, onCounteroffer }: AutoContractGeneratorProps) {
  const [isCounteroffering, setIsCounteroffering] = useState(false);
  const [counterofferForm, setCounterofferForm] = useState<{
    type: CommissionType;
    amount: string;
    exclusivity: string;
    message: string;
  }>({
    type: 'porcentaje',
    amount: '',
    exclusivity: '',
    message: ''
  });

  if (!isOpen || !property) return null;

  const handleAccept = () => {
    onAccept(`Contrato_Corretaje_${property.id.slice(0, 5)}.pdf`);
    onClose();
  };

  const submitCounteroffer = () => {
    if (onCounteroffer) {
      onCounteroffer(counterofferForm);
    }
  };

  const formattedPrice = `${property.currency === 'USD' ? '$' : 'Bs.'} ${property.price.toLocaleString()}`;
  const commissionText = property.commission_type === 'porcentaje'
    ? `${property.proposed_commission}% del precio de venta final`
    : `$${property.proposed_commission?.toLocaleString()} (Monto Fijo)`;

  const today = new Date().toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose} />

      <div className="relative bg-gray-50 rounded-3xl shadow-2xl w-full max-w-3xl h-[90vh] flex flex-col overflow-hidden animate-scaleIn border border-gray-200">

        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center border border-violet-200">
              <FileText className="w-5 h-5 text-violet-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Generador de Contrato</h2>
              <p className="text-xs text-gray-500 font-medium">Contrato de Corretaje Inmobiliario Autogenerado</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Contract Paper Viewer */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-100">
          <div className="bg-white w-full max-w-2xl mx-auto shadow-md border border-gray-200 p-8 sm:p-12 font-serif text-gray-800 text-sm leading-relaxed" style={{ minHeight: '800px' }}>
            <div className="text-center mb-10">
              <h1 className="text-xl font-bold uppercase tracking-widest border-b-2 border-gray-800 pb-4 mb-2">
                Contrato de Corretaje Inmobiliario
              </h1>
              <p className="text-xs text-gray-500">Cochabamba, Bolivia — {today}</p>
            </div>

            {aiContent ? (
              // Render AI-generated content
              <div className="whitespace-pre-wrap text-justify text-sm leading-relaxed text-gray-800">
                {aiContent}
              </div>
            ) : (
              // Fallback: hardcoded template
              <>
                <p className="mb-6 text-justify">
                  Conste por el presente documento privado, que se suscribe con el valor de instrumento público al solo reconocimiento de firmas y rúbricas, el <strong>CONTRATO DE CORRETAJE INMOBILIARIO</strong>, sujeto a las cláusulas y condiciones que se detallan a continuación:
                </p>

                <h3 className="font-bold mb-2">PRIMERA: (LAS PARTES)</h3>
                <p className="mb-4 text-justify">
                  Intervienen en la celebración del presente contrato:
                  <br /><br />
                  <strong>1.1.</strong> Por una parte, el/la Sr/a. <strong>{ownerName}</strong>, mayor de edad, hábil por derecho, en adelante denominado/a <strong>EL/LA PROPIETARIO/A</strong>.
                  <br /><br />
                  <strong>1.2.</strong> Por otra parte, <strong>MORAR S.R.L.</strong>, representada legalmente por su agente inmobiliario autorizado, en adelante denominado <strong>EL CORREDOR</strong>.
                </p>

                <h3 className="font-bold mb-2">SEGUNDA: (DEL OBJETO DEL CONTRATO)</h3>
                <p className="mb-4 text-justify">
                  EL/LA PROPIETARIO/A declara ser único y legítimo titular del inmueble denominado <strong>"{property.title}"</strong>. Por medio del presente documento, otorga a EL CORREDOR el mandato exclusivo para la promoción, mediación y comercialización para la operación de <strong>{property.type.toUpperCase()}</strong> del mencionado inmueble.
                </p>

                <h3 className="font-bold mb-2">TERCERA: (PRECIO DE OFERTA)</h3>
                <p className="mb-4 text-justify">
                  Las partes acuerdan que el precio base para la oferta pública del inmueble será de <strong>{formattedPrice}</strong>. Cualquier modificación a este precio deberá ser aprobada por escrito por EL/LA PROPIETARIO/A a través de la plataforma digital.
                </p>

                <h3 className="font-bold mb-2">CUARTA: (DE LA COMISIÓN Y HONORARIOS)</h3>
                <p className="mb-4 text-justify">
                  En caso de concretarse la {property.type} del inmueble producto de la gestión de EL CORREDOR, EL/LA PROPIETARIO/A se compromete a cancelar por concepto de honorarios profesionales la suma equivalente a:
                  <br /><br />
                  <span className="block p-3 bg-violet-50 border border-violet-200 rounded text-violet-900 font-semibold text-center text-lg my-2">
                    {commissionText}
                  </span>
                  Este monto será cancelado en el momento de la firma del documento definitivo y/o entrega de anticipos, según lo que ocurra primero.
                </p>

                <h3 className="font-bold mb-2">QUINTA: (CONFORMIDAD Y ACEPTACIÓN DIGITAL)</h3>
                <p className="mb-12 text-justify">
                  En señal de absoluta conformidad con cada una de las cláusulas procedentes, las partes aceptan digitalmente el presente documento a través de la plataforma MORAR.
                </p>
              </>
            )}

            {/* Status Area */}
            <div className="grid grid-cols-2 gap-8 mt-16 pt-8 border-t border-gray-300">
              <div className="text-center">
                <p className="font-bold text-sm">{ownerName}</p>
                <p className="text-xs text-gray-500 mb-2">EL/LA PROPIETARIO/A</p>
                {property.is_client_signed_crm1 ? (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Aceptado</span>
                ) : (
                  <span className="text-xs text-gray-400 italic">Pendiente de aceptación</span>
                )}
              </div>
              <div className="text-center">
                <p className="font-bold text-sm">Agente Autorizado</p>
                <p className="text-xs text-gray-500 mb-2">EL CORREDOR</p>
                {property.is_agent_signed_crm1 ? (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Enviado/Aceptado</span>
                ) : (
                  <span className="text-xs text-gray-400 italic">Pendiente</span>
                )}
              </div>
            </div>
          </div>
        </div>



        {/* Footer actions & Counteroffer form */}
        {isCounteroffering ? (
          <div className="bg-white border-t border-gray-200 p-6 shrink-0 space-y-4 animate-scaleIn">
            <h4 className="text-sm font-bold text-gray-800">Enviar Contraoferta</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de Comisión</label>
                <select
                  value={counterofferForm.type}
                  onChange={(e) => setCounterofferForm({ ...counterofferForm, type: e.target.value as CommissionType })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-violet-500 outline-none"
                >
                  <option value="porcentaje">Porcentaje (%)</option>
                  <option value="fijo">Monto Fijo ($/Bs)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Monto / Porcentaje</label>
                <input
                  type="number"
                  placeholder="Ej: 3"
                  value={counterofferForm.amount}
                  onChange={(e) => setCounterofferForm({ ...counterofferForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Meses de Exclusividad</label>
                <input
                  type="number"
                  placeholder="Ej: 6"
                  value={counterofferForm.exclusivity}
                  onChange={(e) => setCounterofferForm({ ...counterofferForm, exclusivity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Mensaje para el Agente (Opcional)</label>
                <textarea
                  placeholder="Ej: Acepto los 6 meses de exclusividad, pero propongo una comisión del 2.5%..."
                  value={counterofferForm.message}
                  onChange={(e) => setCounterofferForm({ ...counterofferForm, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-violet-500 outline-none min-h-[60px]"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsCounteroffering(false)}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={submitCounteroffer}
                disabled={!counterofferForm.amount || !counterofferForm.exclusivity}
                className="px-6 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm shadow-lg hover:bg-violet-700 transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" /> Enviar Contraoferta
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border-t border-gray-200 p-4 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 hidden sm:flex">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-bold">Documento acordado digitalmente</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer w-full sm:w-auto"
              >
                Cerrar
              </button>

              {isAgentView ? (
                <button
                  onClick={handleAccept}
                  className="px-6 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm shadow-lg hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                >
                  <Send className="w-4 h-4" /> Enviar al Cliente
                </button>
              ) : (
                <>
                  {onReject && (
                    <button
                      onClick={onReject}
                      className="px-5 py-2.5 rounded-xl font-semibold text-sm text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                    >
                      <XCircle className="w-4 h-4" /> Rechazar
                    </button>
                  )}
                  {onCounteroffer && (
                    <button
                      onClick={() => setIsCounteroffering(true)}
                      className="px-5 py-2.5 rounded-xl font-semibold text-sm text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                    >
                      Contraofertar
                    </button>
                  )}
                  <button
                    onClick={handleAccept}
                    className="px-6 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm shadow-lg hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                  >
                    <CheckCircle className="w-4 h-4" /> Aceptar Términos
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
