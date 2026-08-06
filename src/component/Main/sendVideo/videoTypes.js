// Tipos MIME aceptados al cargar un video, compartidos por el reproductor
// único (videoComponent.jsx) y por cada recuadro de la unión (video.jsx).
// Antes cada archivo tenía su propia lista y no coincidían: en modo múltiple
// un .avi legítimo se "rechazaba" (aunque igual se subía por un `return` que
// faltaba) y en modo único quedaba bloqueado de verdad.
//
// Notas de cada entrada:
//  · 'video/x-msvideo' es lo que reportan Chrome y Firefox para un .avi real;
//    'video/avi' es un alias no estándar que casi nunca se emite.
//  · La cadena vacía es OBLIGATORIA: es lo único que deja pasar los .dav de
//    IVMS-4200, a los que el navegador no les reconoce ningún tipo.
//
// El servidor no valida MIME (compress resuelve el formato con ffmpeg), así
// que esta lista es solo para avisar temprano al usuario, no una barrera.
export const VIDEO_TYPES = [
    'video/mp4',
    'video/avi',
    'video/x-msvideo',
    'video/quicktime',
    'video/webm',
    'video/x-matroska',
    '',
];
