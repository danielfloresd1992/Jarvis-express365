/*  LA HORA DE UNA CELDA, POR BLOQUES: HH │ MM │ SS
 *
 *  La lógica de teclado de CellTimeInput, sin React: un reductor puro que recibe el estado y una acción
 *  y devuelve el estado nuevo. Así se prueba en Node, sin navegador, y el componente solo pinta, lleva
 *  el foco y avisa.
 *
 *  El estado:
 *      segments  los tres bloques, como texto de 0 a 2 cifras: ['10', '3', '']
 *      active    el bloque en el que se escribe: 0 las horas, 1 los minutos, 2 los segundos
 *      fresh     el próximo dígito REEMPLAZA el bloque en vez de añadirse: es lo que pasa al entrar en él
 */


// SEGMENT_MAX = «el mayor valor de cada bloque»
export const SEGMENT_MAX = [23, 59, 59];

// SEGMENT_LABELS = «cómo se llama cada bloque», para los lectores de pantalla
export const SEGMENT_LABELS = ['Horas', 'Minutos', 'Segundos'];

// LAST = «el último bloque»
const LAST = SEGMENT_MAX.length - 1;


// pad = «un bloque con sus dos cifras»: '7' → '07', '' → '00'
const pad = (segment) => segment.padStart(2, '0');


// parseTime = «una hora en sus tres bloques»: '10:03:07' → ['10', '03', '07']
// Lo que no sea una hora válida deja su bloque vacío, que se pinta con la marca '00'.
export function parseTime(value) {
    const parts = String(value ?? '').split(':');
    return SEGMENT_MAX.map((max, index) => {
        const digits = (parts[index] ?? '').replace(/\D/g, '').slice(0, 2);
        return digits !== '' && Number(digits) <= max ? digits : '';
    });
}


// formatTime = «los tres bloques como hora»: ['10', '3', ''] → '10:03:00'
// Sin ninguna cifra devuelve '': no hay hora, que no es lo mismo que las 00:00:00.
export function formatTime(segments) {
    return segments.every(segment => segment === '') ? '' : segments.map(pad).join(':');
}


// initialState = «el estado al abrir el campo»: la hora que había, con el cursor en las horas
export const initialState = (value) => ({ segments: parseTime(value), active: 0, fresh: true });


// withSegment = «el estado con un bloque cambiado»
const withSegment = (state, index, segment) => ({
    ...state,
    segments: state.segments.map((current, position) => (position === index ? segment : current)),
});

// moveTo = «pasar a un bloque»: lo siguiente que se escriba lo reemplaza
const moveTo = (state, index) => ({ ...state, active: Math.min(Math.max(index, 0), LAST), fresh: true });


/*  timeReducer = «lo que hace cada tecla»
 *
 *  Acciones:
 *      { type: 'digit', digit }   una cifra
 *      { type: 'step', delta }    ↑ (+1) o ↓ (−1); da la vuelta: 59 → 00, 00 → 59
 *      { type: 'move', to }       ← →, «:», espacio, o un clic en un bloque
 *      { type: 'backspace' }
 *      { type: 'paste', text }    '10:20:00' o '102000'
 */
export function timeReducer(state, action) {
    const { segments, active, fresh } = state;
    const max = SEGMENT_MAX[active];

    switch (action.type) {

        case 'digit': {
            //  Una primera cifra que ya no admite segunda —un 7 en las horas, un 6 en los minutos— se
            //  completa con un cero y se pasa al bloque siguiente: no hace falta teclear el 0.
            if (fresh && Number(action.digit) * 10 > max) {
                return moveTo(withSegment(state, active, `0${action.digit}`), active + 1);
            }

            // typed = «el bloque con la cifra nueva»: al entrar la reemplaza; si no, se añade a la que había
            const typed = fresh ? action.digit : (segments[active] + action.digit).slice(-2);

            //  Si así se pasa del máximo (25 horas), el bloque empieza de nuevo con la cifra nueva.
            const segment = Number(typed) > max ? action.digit : typed;

            const next = { ...withSegment(state, active, segment), fresh: false };
            return segment.length === 2 && active < LAST ? moveTo(next, active + 1) : next;
        }

        case 'step': {
            // size = «cuántos valores tiene el bloque»: 24 las horas, 60 los minutos y los segundos
            const size = max + 1;
            const stepped = ((Number(segments[active] || 0) + action.delta) % size + size) % size;
            return { ...withSegment(state, active, pad(String(stepped))), fresh: true };
        }

        case 'move':
            return action.to === active ? state : moveTo(state, action.to);

        case 'backspace':
            if (segments[active] !== '') return { ...withSegment(state, active, segments[active].slice(0, -1)), fresh: false };
            return active > 0 ? { ...state, active: active - 1, fresh: false } : state;

        case 'paste': {
            const digits = String(action.text ?? '').replace(/\D/g, '').slice(0, 6);
            if (digits === '') return state;
            const padded = digits.padEnd(6, '0');
            return { segments: parseTime(`${padded.slice(0, 2)}:${padded.slice(2, 4)}:${padded.slice(4, 6)}`), active: LAST, fresh: true };
        }

        default:
            return state;
    }
}
