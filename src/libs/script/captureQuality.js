/*  LA CALIDAD DE LAS IMÁGENES QUE SE CREAN AL REPORTAR
 *
 *  Dos pasos deciden lo nítida que llega una foto al grupo:
 *
 *      1. al soltarla en una caja (ImgBox), Compressor la reduce. Antes la dejaba en 500 px de ancho como mucho;
 *      2. luego se captura la caja entera con html-to-image (ImgBox y la compuesta, useImgAlternative). Sin
 *         decirle nada, captura a los píxeles de la pantalla: una caja de 390×200 salía de 390×200.
 *
 *  La API guarda el archivo tal cual llega (sin límite ni recompresión), así que la calidad se decide aquí.
 */


// SOURCE_MAX_SIZE = «el lado más largo que conserva la foto al soltarla», en px. Da para capturar a 3× la caja más
// grande (la compuesta, 550 de ancho) sin que la foto se quede corta.
export const SOURCE_MAX_SIZE = 1920;

// SOURCE_QUALITY = «la calidad del JPEG al comprimir la foto soltada» (0–1). Compressor usa 0,8 si no se le dice.
export const SOURCE_QUALITY = 0.92;

// capturePixelRatio = «cuántos píxeles por cada punto de pantalla tiene la captura»: al menos 2, o los de la
// pantalla si son más. Una caja de 390×200 sale de 780×400; la compuesta, de 1100 de ancho.
export const capturePixelRatio = () => Math.max(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
