/*  LA COLUMNA «¿RECONOCIDO?» DE LA TABLA 1: si la inferencia dio con este ticket
 *
 *  Distingue el NO que es un fallo («✗ no») de los que no lo son: «ya estaba» y «no se vio» son tickets
 *  que la ventana de la tablet no podía reconocer.
 */


/*  @param {object} row  la fila de la comparación
 */
export default function RecognitionCell({ row }) {
    if (row.ia) return <span className='sim-bien' title={`La inferencia lo reconoció: ${row.veredicto.texto}`}>✓ sí</span>;
    if (row.yaEstaba) return <span className='sim-tenue' title='Ya estaba en pantalla cuando se conectó la ventana de la tablet: se aparta a propósito, no es un fallo'>ya estaba</span>;
    if (!row.verdad.vistaEnPantalla) return <span className='sim-tenue' title='Nunca llegó a pintarse en la pantalla que se estaba viendo (quedó en otra página): nadie pudo leerlo'>no se vio</span>;
    if (!row.reconocible) return <span className='sim-tenue'>—</span>;

    return <span className='sim-aviso' title='Estuvo en pantalla y la inferencia todavía no ha dado con él'>✗ no</span>;
}
