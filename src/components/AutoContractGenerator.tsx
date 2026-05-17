import { useState } from 'react';
import { X, FileSignature, ShieldCheck, PenTool } from 'lucide-react';
import type { Property } from '../types';

interface AutoContractGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  ownerName: string;
  onSign: (filename: string) => void;
}

export default function AutoContractGenerator({ isOpen, onClose, property, ownerName, onSign }: AutoContractGeneratorProps) {
  const [isSigning, setIsSigning] = useState(false);

  if (!isOpen || !property) return null;

  const handleSign = () => {
    setIsSigning(true);
    // Simulate digital signature process
    setTimeout(() => {
      setIsSigning(false);
      onSign(`Contrato_Corretaje_${property.id.slice(0, 5)}.pdf`);
      onClose();
    }, 1500);
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
              <FileSignature className="w-5 h-5 text-violet-700" />
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

            <p className="mb-6 text-justify">
              Conste por el presente documento privado, que se suscribe con el valor de instrumento público al solo reconocimiento de firmas y rúbricas, el <strong>CONTRATO DE CORRETAJE INMOBILIARIO</strong>, sujeto a las cláusulas y condiciones que se detallan a continuación:
            </p>

            <h3 className="font-bold mb-2">PRIMERA: (LAS PARTES)</h3>
            <p className="mb-4 text-justify">
              Intervienen en la celebración del presente contrato:
              <br/><br/>
              <strong>1.1.</strong> Por una parte, el/la Sr/a. <strong>{ownerName}</strong>, mayor de edad, hábil por derecho, en adelante denominado/a <strong>EL/LA PROPIETARIO/A</strong>.
              <br/><br/>
              <strong>1.2.</strong> Por otra parte, <strong>PROPTECH-FLOW S.R.L.</strong>, representada legalmente por su agente inmobiliario autorizado, en adelante denominado <strong>EL CORREDOR</strong>.
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
              <br/><br/>
              <span className="block p-3 bg-violet-50 border border-violet-200 rounded text-violet-900 font-semibold text-center text-lg my-2">
                {commissionText}
              </span>
              Este monto será cancelado en el momento de la firma del documento definitivo y/o entrega de anticipos, según lo que ocurra primero.
            </p>

            <h3 className="font-bold mb-2">QUINTA: (CONFORMIDAD Y ACEPTACIÓN DIGITAL)</h3>
            <p className="mb-12 text-justify">
              En señal de absoluta conformidad con cada una de las cláusulas procedentes, las partes firman y aceptan digitalmente el presente documento a través de la plataforma PropTech-Flow.
            </p>

            {/* Signature Area */}
            <div className="grid grid-cols-2 gap-8 mt-16 pt-8 border-t border-gray-300">
              <div className="text-center">
                <div className="border-b border-gray-400 h-10 mb-2 relative">
                  <span className="absolute bottom-1 left-0 w-full text-gray-300 text-xs italic opacity-50 text-center">(Firma Digital Pendiente)</span>
                </div>
                <p className="font-bold text-sm">{ownerName}</p>
                <p className="text-xs text-gray-500">EL/LA PROPIETARIO/A</p>
              </div>
              <div className="text-center">
                <div className="border-b border-gray-400 h-10 mb-2 relative flex items-end justify-center pb-1">
                  <span className="text-violet-600 font-bold italic text-lg opacity-80" style={{ fontFamily: 'cursive' }}>PropTech-Flow</span>
                </div>
                <p className="font-bold text-sm">Agente Autorizado</p>
                <p className="text-xs text-gray-500">EL CORREDOR</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-white border-t border-gray-200 p-4 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 hidden sm:flex">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-bold">Documento con validez legal digital</span>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer w-full sm:w-auto"
            >
              Cancelar
            </button>
            <button
              onClick={handleSign}
              disabled={isSigning}
              className="px-6 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm shadow-lg shadow-violet-600/20 hover:bg-violet-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 w-full sm:w-auto"
            >
              {isSigning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Firmando...
                </>
              ) : (
                <>
                  <PenTool className="w-4 h-4" />
                  Firmar Digitalmente
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
