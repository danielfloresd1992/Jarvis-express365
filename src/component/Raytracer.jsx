import { useEffect, useRef } from 'react';

/**
 * <Raytracer /> — Demo de trazado de rayos en CPU.
 *
 * Monta un <canvas>, transfiere su control a un OffscreenCanvas y deja que
 * raytracer.worker.js lo renderice en un hilo aparte (mismo patrón que
 * presentatiom.jsx / presentation.worker.js). Todo el cálculo es CPU.
 *
 * Props:
 *   width, height  Tamaño del canvas en píxeles (por defecto 800x600).
 *   className       Clase CSS opcional.
 */
export default function Raytracer({ width = 800, height = 600, className }) {
    const canvasRef = useRef(null);
    // Guardamos worker y offscreen en un ref para sobrevivir al doble montaje
    // de React StrictMode: transferControlToOffscreen() solo puede llamarse una
    // vez por <canvas>, así que NO recreamos nada en el segundo efecto.
    const state = useRef({ worker: null, offscreen: null });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const s = state.current;

        if (!s.offscreen) {
            s.offscreen = canvas.transferControlToOffscreen();
        }
        if (!s.worker) {
            s.worker = new Worker(
                new URL('./raytracer.worker.js', import.meta.url),
                { type: 'classic' }
            );
            s.worker.postMessage(
                { type: 'init', canvas: s.offscreen, width, height },
                [s.offscreen]
            );
        } else {
            s.worker.postMessage({ type: 'start' });
        }

        // En cleanup solo pausamos; el worker se reutiliza si React vuelve a montar.
        return () => { s.worker?.postMessage({ type: 'stop' }); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className={className}
            style={{
                display: 'block',
                width: '100%',
                maxWidth: width,
                aspectRatio: `${width} / ${height}`,
                background: '#000',
                borderRadius: 8,
            }}
        />
    );
}
