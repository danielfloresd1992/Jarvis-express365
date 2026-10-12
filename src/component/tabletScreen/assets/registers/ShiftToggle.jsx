/*  EL TURNO: DE DÍA O DE NOCHE
 *
 *  Un interruptor en la barra del register, junto a las pestañas. Dice con qué turno nacen las rotaciones
 *  ('shift' de cada una, ver stampShift en tableRecords.js): las que se creen desde ahora toman este, y
 *  cambiarlo no toca las que ya existen.
 *
 *  Monocromo, como el resto de la barra: un sol y una luna en tinta, y la bolita que se desliza al que
 *  manda. De noche el carril se oscurece, que es lo primero que se lee de un vistazo; y al lado va el
 *  nombre del turno, para no tener que adivinarlo por el dibujo. Su aspecto, en las clases
 *  'register-shift…' de registers.css.
 *
 *  Es un 'switch' para los lectores de pantalla: encendido = nocturno.
 *
 *  La hora manda ('locked', de shiftByClock en useTabletSession): de 08:00 a 17:30 es diurno y de 18:30 a
 *  07:00 nocturno, y el interruptor va desactivado. Solo se mueve en los cambios de turno.
 */


// Sun = «el sol»: el turno de día
const Sun = () => (
    <svg className='register-shift__icon register-shift__icon--sun' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
        <circle cx='12' cy='12' r='4' />
        <path d='M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41' />
    </svg>
);

// Moon = «la luna»: el turno de noche
const Moon = () => (
    <svg className='register-shift__icon register-shift__icon--moon' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
        <path d='M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z' />
    </svg>
);


/*  @param {string}   shift     el turno: 'day' | 'night'
 *  @param {boolean}  locked    la hora no deja cambiarlo
 *  @param {function} onToggle  lo cambia (toggleShift, de la sesión)
 */
export default function ShiftToggle({ shift, locked, onToggle }) {

    // night = «es de noche»
    const night = shift === 'night';

    // name / other = «el turno de ahora» y «al que se cambia»
    const name = night ? 'Nocturno' : 'Diurno';
    const other = night ? 'diurno' : 'nocturno';

    // why = «lo que se lee al pasar el ratón»: por qué no se mueve, o qué pasa al moverlo
    const why = locked
        ? `Turno ${name.toLowerCase()}, fijo por la hora: de 08:00 a 17:30 es diurno y de 18:30 a 07:00 nocturno. Solo se cambia entre esos tramos.`
        : `Turno ${name.toLowerCase()}: las rotaciones nuevas nacen con este turno. Clic para cambiar a ${other}.`;

    return (
        <button
            type='button'
            role='switch'
            aria-checked={night}
            aria-label={locked ? `Turno ${name.toLowerCase()}, fijo por la hora` : `Turno ${name.toLowerCase()}. Pulsa para cambiar a ${other}`}
            title={why}
            className={`register-shift ${night ? 'register-shift--night' : ''}`}
            onClick={onToggle}
            disabled={locked}
        >
            <span className='register-shift__track' aria-hidden='true'>
                <span className='register-shift__thumb' />
                <Sun />
                <Moon />
            </span>
            <span className='register-shift__label'>{name}</span>
        </button>
    );
}
