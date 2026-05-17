import { useRef, useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import type { Property } from '../types';
import { usePropertyStore } from '../store/propertyStore';

const MAX_BYTES = 15 * 1024 * 1024;

interface PanoramaUploadProps {
  property: Property;
  agentId: string;
  onUpdated?: () => void;
}

type UploadPhase = 'idle' | 'uploading' | 'success' | 'error';

export default function PanoramaUpload({ property, agentId, onUpdated }: PanoramaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [message, setMessage] = useState('');
  const [ratioWarning, setRatioWarning] = useState('');
  const { requestPanoramaUploadUrl, confirmPanorama, deletePanorama } = usePropertyStore();

  const handleFile = async (file: File) => {
    setRatioWarning('');
    if (!file.type.match(/^image\/jpe?g$/i)) {
      setPhase('error');
      setMessage('Solo archivos JPEG (.jpg)');
      return;
    }
    if (file.size > MAX_BYTES) {
      setPhase('error');
      setMessage('Máximo 15 MB');
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const ratio = img.width / img.height;
      if (ratio < 1.8 || ratio > 2.2) {
        setRatioWarning('La imagen no parece 360° (proporción 2:1). Pannellum puede verse deformada.');
      }
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;

    setPhase('uploading');
    setMessage('Subiendo...');

    try {
      const { uploadUrl, publicUrl } = await requestPanoramaUploadUrl(
        property.id,
        agentId,
        file.type || 'image/jpeg',
      );

      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': 'image/jpeg' },
      });
      if (!putRes.ok) {
        throw new Error('Error al subir a almacenamiento (revisa CORS del bucket R2)');
      }

      const label =
        property.panorama_label?.trim() ||
        property.title.split(' ').slice(0, 3).join(' ') ||
        'Tour 360';

      await confirmPanorama(property.id, agentId, publicUrl, label);
      setPhase('success');
      setMessage('Tour 360 guardado');
      onUpdated?.();
    } catch (e) {
      setPhase('error');
      setMessage(e instanceof Error ? e.message : 'Error al subir');
    }
  };

  const handleDelete = async () => {
    setPhase('uploading');
    try {
      await deletePanorama(property.id, agentId);
      setPhase('idle');
      setMessage('');
      onUpdated?.();
    } catch (e) {
      setPhase('error');
      setMessage(e instanceof Error ? e.message : 'No se pudo eliminar');
    }
  };

  const hasPanorama = Boolean(property.panorama_url);

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 w-full">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tour 360</p>
        {hasPanorama && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-semibold">
            <CheckCircle className="w-3 h-3" /> 360 listo
          </span>
        )}
      </div>
      <p className="text-[11px] text-gray-400 mb-2 leading-relaxed">
        Exporta desde Polycam o Google Street View en formato 360 (JPG 2:1).
      </p>
      {hasPanorama && property.panorama_label && (
        <p className="text-xs text-gray-600 mb-2">{property.panorama_label}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={phase === 'uploading'}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-50 text-violet-700 text-xs font-semibold hover:bg-violet-100 transition-colors cursor-pointer disabled:opacity-50"
        >
          {phase === 'uploading' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          {hasPanorama ? 'Reemplazar foto' : 'Subir panorámica'}
        </button>
        {hasPanorama && (
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={phase === 'uploading'}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 text-gray-600 text-xs font-semibold hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Quitar
          </button>
        )}
      </div>
      {ratioWarning && (
        <p className="text-[11px] text-amber-600 mt-2 flex items-start gap-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          {ratioWarning}
        </p>
      )}
      {message && (
        <p
          className={`text-xs mt-2 flex items-center gap-1 ${
            phase === 'error' ? 'text-rose-600' : phase === 'success' ? 'text-emerald-600' : 'text-gray-500'
          }`}
        >
          {phase === 'error' && <AlertCircle className="w-3.5 h-3.5" />}
          {phase === 'success' && <CheckCircle className="w-3.5 h-3.5" />}
          {message}
        </p>
      )}
    </div>
  );
}