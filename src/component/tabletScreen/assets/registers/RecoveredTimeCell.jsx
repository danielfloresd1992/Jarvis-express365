import { useEffect, useRef, useState } from 'react';
import CellTimeInput from '../../../cells/CellTimeInput.jsx';


/*  UNA HORA DE LA ROTACIÓN QUE SE ESTÁ ANOTANDO A MANO (RegisterSavedNew)
 *
 *  En Mesas un clic estampa la hora de ahora, porque allí se anota lo que está pasando. Una rotación
 *  recuperada se anota DESPUÉS: sus horas ya pasaron y hay que escribirlas. Por eso aquí un clic (o Enter)
 *  abre directamente el campo de hora (CellTimeInput: HH:MM:SS sin teclear los «:»), que guarda con Enter
 *  o al salir y descarta con Escape.
 */


/*  @param {string}   value     la hora: 'HH:MM:SS', o '' si todavía no tiene
 *  @param {function} onChange  recibe la hora nueva
 *  @param {string}   label     qué hora es, para los lectores de pantalla ('Ocupa', 'Limpieza'…)
 */
export default function RecoveredTimeCell({ value, onChange, label }) {

    // editing = «el campo de hora está abierto»
    const [editing, setEditing] = useState(false);

    // buttonRef / wasEditingRef = «la celda» y «el campo estaba abierto en el pintado anterior»
    const buttonRef = useRef(null);
    const wasEditingRef = useRef(false);

    //  Al cerrarse el campo con Enter o Escape, el cursor vuelve a la celda, para seguir con Tab. Si se
    //  cerró porque se pinchó en otro sitio, el cursor ya está allí (no en <body>) y se deja donde está.
    useEffect(() => {
        if (wasEditingRef.current && !editing && (document.activeElement === document.body || !document.activeElement)) buttonRef.current?.focus();
        wasEditingRef.current = editing;
    }, [editing]);

    if (editing) return (
        <CellTimeInput
            value={value}
            onCommit={time => {
                setEditing(false);
                if (time !== value) onChange(time);
            }}
            onCancel={() => setEditing(false)}
        />
    );

    return (
        <button
            ref={buttonRef}
            type='button'
            className='register-new-time'
            onClick={() => setEditing(true)}
            aria-label={`${label}: ${value || 'sin hora'}. Pulsa para escribirla`}
            title='Clic para escribir la hora'
        >
            {value || '-'}
        </button>
    );
}
