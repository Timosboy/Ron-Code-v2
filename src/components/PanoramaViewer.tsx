import { useEffect, useId, useRef, useState } from 'react';
import 'pannellum/build/pannellum.css';

interface PannellumViewerInstance {
  destroy: () => void;
}

interface PanoramaViewerProps {
  panoramaUrl: string;
  label?: string;
  className?: string;
}

export default function PanoramaViewer({ panoramaUrl, label, className = '' }: PanoramaViewerProps) {
  const reactId = useId();
  const containerId = `pano-${reactId.replace(/:/g, '')}`;
  const viewerRef = useRef<PannellumViewerInstance | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setError(false);
      await import('pannellum/build/pannellum.js');
      if (cancelled) return;

      const pannellum = (
        window as Window & {
          pannellum?: { viewer: (el: HTMLElement, config: object) => PannellumViewerInstance };
        }
      ).pannellum;
      const container = document.getElementById(containerId);
      if (!pannellum?.viewer || !container) {
        setError(true);
        return;
      }

      container.innerHTML = '';
      viewerRef.current?.destroy();

      try {
        viewerRef.current = pannellum.viewer(container, {
          type: 'equirectangular',
          panorama: panoramaUrl,
          autoLoad: true,
          showControls: true,
          compass: false,
        });
      } catch {
        setError(true);
      }
    };

    void init();

    return () => {
      cancelled = true;
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, [containerId, panoramaUrl]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-gray-100 text-sm text-gray-500 ${className}`}
      >
        No se pudo cargar el tour 360
      </div>
    );
  }

  return (
    <div className={className}>
      {label && (
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">{label}</p>
      )}
      <div
        id={containerId}
        className="w-full h-[50vh] min-h-[280px] md:h-[400px] rounded-2xl overflow-hidden border border-gray-100"
      />
    </div>
  );
}
