/*  CÓMO VA LA SUBIDA EN VIVO DE MESAS, en la barra del registro. Solo pinta.
 *
 *      ● En vivo                          todo subido: los demás equipos del local ven estas mesas
 *      ● Subiendo 2…                      hay cambios subiendo
 *      ● Sin conexión · 5 sin subir       se sigue trabajando: se suben solos al volver la conexión
 *      ● Servidor sin actualizar · 5      la API todavía no tiene la subida en vivo (falta desplegarla)
 *      ● No se subió una                  la API no aceptó algo: el title dice qué
 *
 *  @param {object} status  { state, pending, message } (useRotationSync, en store.sync.status)
 */


// LOOKS = «el aspecto de cada estado»: la píldora y su punto
const LOOKS = {
    idle: { pill: 'border-jx-verde-suave bg-jx-verde-suave text-jx-verde-texto', dot: 'bg-jx-verde' },
    syncing: { pill: 'border-jx-regla2 bg-jx-panel text-jx-tinta2', dot: 'bg-jx-tinta3 animate-pulse' },
    waiting: { pill: 'border-jx-aviso-suave bg-jx-aviso-suave text-jx-aviso-texto', dot: 'bg-jx-ocre' },
    failed: { pill: 'border-jx-critico-suave bg-jx-critico-suave text-jx-critico-texto', dot: 'bg-jx-critico' },
};


// describe = «qué dice la píldora y su title», según el estado
function describe({ state, pending, message }) {
    if (state === 'syncing') return { look: 'syncing', text: pending > 0 ? `Subiendo ${pending}…` : 'Subiendo…', title: 'Subiendo los cambios de Mesas al servidor' };
    if (state === 'offline') return { look: 'waiting', text: `Sin conexión · ${pending} sin subir`, title: `Se sigue trabajando: lo escrito está guardado en este equipo y se sube solo al volver la conexión.${message ? `\n${message}` : ''}` };
    if (state === 'unavailable') return { look: 'waiting', text: `Servidor sin actualizar · ${pending} sin subir`, title: 'La API todavía no tiene la subida en vivo de Mesas: falta desplegarla. Lo escrito está guardado en este equipo y se sube cuando esté.' };
    if (message) return { look: 'failed', text: 'No se subió una', title: message };
    return { look: 'idle', text: 'En vivo', title: 'Todo subido: los demás equipos del local ven estas mesas al momento' };
}


export default function SyncStatus({ status }) {

    const { look, text, title } = describe(status);
    const { pill, dot } = LOOKS[look];

    return (
        <span role='status' aria-live='polite' title={title} className={`inline-flex items-center gap-1.5 shrink-0 h-7 px-2.5 rounded-full border text-[11px] font-semibold whitespace-nowrap ${pill}`}>
            <span aria-hidden='true' className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {text}
        </span>
    );
}
