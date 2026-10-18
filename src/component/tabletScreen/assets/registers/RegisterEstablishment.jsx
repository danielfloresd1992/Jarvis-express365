/*  EL NOMBRE DEL LOCAL, EN LA BARRA DE LOS REGISTERS (pedido del usuario)
 *
 *  En el hueco entre el turno (ShiftToggle) y los totales del día (RegisterTotals): ocupa lo que sobra de la barra
 *  y va centrado en él, con el icono de una tienda delante. Si el nombre no cabe, se corta con «…» y se lee
 *  entero al pasar el ratón.
 *
 *  El local es el mismo que usan las tablas: en Home el de Redux, en la ventana flotante el de la sesión
 *  (Registers). Sin local, no pinta nada. Su aspecto va en 'register-establishment' de registers.css.
 */


/*  @param {string} name  el nombre del local
 */
export default function RegisterEstablishment({ name }) {
    if (!name) return null;

    return (
        <div className='register-establishment'>
            <span className='register-establishment__name' title={`Local: ${name}`}>
                <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'
                     strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                    <path d='M3 9l1.5-5h15L21 9' />
                    <path d='M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0' />
                    <path d='M5 12v8h14v-8' />
                    <path d='M10 20v-5h4v5' />
                </svg>
                <span className='register-establishment__text'>{name}</span>
            </span>
        </div>
    );
}
