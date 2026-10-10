/*  EL PUNTO DE ESTADO
 *
 *  Lo dice de un vistazo: violeta simulación, verde conectada, oro conectando, rojo si el último
 *  intento falló, hueco si no hay nada.
 *
 *  Una simulación se distingue DE UN VISTAZO: punto y texto en violeta, un color que la ventana no
 *  usa para nada más. Lo que sale en los registers es de mentira, y nadie debería tener que leer la
 *  barra para darse cuenta.
 *
 *  El violeta no está en la paleta —la casa no tiene ningún color frío— y por eso va en
 *  hexadecimal: es el mismo de los apuntes de la tablet en InferencePanel.css.
 */


/*  @param {boolean} simulating  lo conectado es una tablet de mentira
 *  @param {boolean} connected   la tablet está conectada
 *  @param {boolean} connecting  se está conectando ahora mismo
 *  @param {boolean} failed      el último intento de conexión falló
 */
export default function StatusDot({ simulating, connected, connecting, failed }) {

    // color = «la clase del punto»
    const color = simulating ? 'bg-[#5e45a8] shadow-[0_0_0_3px_rgba(94,69,168,0.18)]'
        : connected ? 'bg-jx-verde shadow-[0_0_0_3px_rgba(41,197,12,0.18)]'
            : connecting ? 'bg-jx-ocre shadow-[0_0_0_3px_rgba(217,164,65,0.22)]'
                : failed ? 'bg-jx-critico'
                    : 'border-2 border-jx-borde-campo';

    return <span aria-hidden='true' className={`shrink-0 w-2.5 h-2.5 rounded-full ${color}`} />;
}
