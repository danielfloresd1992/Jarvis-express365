/*  LA CÁPSULA QUE DESPLIEGA UNA LISTA DE LA ROTACIÓN GUARDADA: «2 procesos», «4 toques»
 *
 *  Con 0 no hay nada que abrir y se apaga, salvo que la lista sirva también para añadir ('openEmpty'):
 *  la de toques se abre vacía para apuntar el primero. La flecha gira cuando la lista está abierta.
 */


// Chevron = «la flecha de desplegar»: gira cuando la lista está abierta. También la usa «Edición».
export const Chevron = ({ open }) => (
    <svg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true' style={{ flex: 'none', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}>
        <path d='m6 9 6 6 6-6' />
    </svg>
);


/*  @param {string}   className  el color de la cápsula: 'register-saved-chip--process' o '--touches'
 *  @param {number}   count      cuántos hay
 *  @param {string}   word       qué son, en singular: 'proceso', 'toque'
 *  @param {boolean}  open       la lista está abierta
 *  @param {function} onToggle   abre o cierra la lista
 *  @param {boolean}  openEmpty  con 0 también se abre: la lista sirve para añadir
 */
export default function RegisterSavedToggle({ className, count, word, open, onToggle, openEmpty = false }) {

    // words = «qué son, con su número»: 1 toque, 3 toques
    const words = `${word}${count === 1 ? '' : 's'}`;

    // opens = «la cápsula abre algo»: hay alguno, o se pueden añadir
    const opens = count > 0 || openEmpty;

    return (
        <button
            type='button'
            className={`register-saved-chip register-saved-chip--toggle ${className}`}
            onClick={onToggle}
            disabled={!opens}
            aria-expanded={opens ? open : undefined}
            title={!opens ? `Esta mesa no tuvo ${word}s`
                : count === 0 ? `${open ? 'Cerrar' : 'Añadir'} ${word}s a esta mesa`
                : `${open ? 'Cerrar' : openEmpty ? 'Ver, corregir, añadir o quitar' : 'Ver y corregir'} los ${word}s de esta mesa`}
        >
            {count} {words}
            {opens && <Chevron open={open} />}
        </button>
    );
}
