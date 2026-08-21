/**
 * Qué cambió en la bonificación de una alerta.
 *
 * Los cambios vienen YA REDACTADOS desde jarvis_api (`diffBonusSystems`), en
 * `meta.bonusChanges`. Acá no se compara nada ni se traduce: se pintan.
 *
 * Es a propósito. El texto de una notificación se guarda renderizado, así que
 * uno de hace seis meses tiene que seguir diciendo lo que dijo aunque hoy los
 * campos se llamen de otra forma. Si el cliente lo recompusiera, un aviso viejo
 * se releería con las reglas de hoy.
 *
 * Los colores salen de la variable de la familia (`--fam-rgb`), que el ítem ya
 * dejó puesta: así el desglose es del mismo dorado que el resto del aviso sin
 * repetir el valor acá.
 */
export default function BonusDetail({ n }) {
    const cambios = n?.meta?.bonusChanges;
    if (!Array.isArray(cambios) || cambios.length === 0) return null;

    return (
        <ul className='notif-bonus'>
            {cambios.map((cambio, i) => (
                <li key={`${i}_${cambio}`} className='notif-bonus__linea'>
                    <span className='notif-bonus__punto' aria-hidden='true' />
                    <span>{cambio}</span>
                </li>
            ))}
        </ul>
    );
}
