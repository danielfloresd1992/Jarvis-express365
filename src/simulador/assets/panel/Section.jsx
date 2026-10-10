/*  UNA SECCIÓN DEL PANEL, QUE SE PLIEGA
 *
 *  El panel ya no cabe en una pantalla, y lo que se toca a diario —el turno, los tiempos, la cocina— no
 *  tiene por qué quedar enterrado bajo lo que se ajusta una vez y se olvida. Es un <details> de los de
 *  siempre: se abre con el teclado y lo anuncia un lector de pantalla sin tener que enseñarle nada.
 *
 *  'open' solo cuenta al aparecer: después la abre y la cierra quien la usa, y React no la toca.
 */


/*  @param {string}  title  el título, que es también lo que se pulsa para plegarla
 *  @param {boolean} open   si nace abierta
 */
export default function Section({ title, open = true, children }) {
    return (
        <details className='sim-seccion' open={open}>
            <summary><h2>{title}</h2></summary>
            {children}
        </details>
    );
}
