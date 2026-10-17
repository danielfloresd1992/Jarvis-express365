/*  QUÉ SE ESTÁ REPORTANDO, EN PALABRAS
 *
 *  Cuando un formulario de Demoras se abre desde el reloj rojo del register, encabeza el formulario esta
 *  descripción en vez del título (FormLayaut, prop 'description'): la mesa, sus dos horas, lo que tardó y el
 *  tiempo de referencia del local con que el register la marcó como demora. Se arma con lo que el formulario
 *  tiene en ese momento, así que si alguien corrige una hora, la descripción la sigue.
 *
 *      Mesa 59: se ocupó a las 12:41:31 y recibió la primera atención a las 12:48:32. Tardó 00:07:01, más que
 *      el tiempo de referencia del local (00:03:30). Adjunta las dos capturas y envía la alerta.
 */


// KINDS = «cómo se cuenta cada demora»: qué pasa a la primera hora y qué a la segunda
const KINDS = {
    'primera atención': { start: 'se ocupó', end: 'recibió la primera atención', took: 'Tardó' },
    limpieza: { start: 'se desocupó', end: 'quedó limpia', took: 'La limpieza tardó' },
};


/*  reportDescription = «la descripción de una demora del register»
 *
 *  @param {string} kind    'primera atención' | 'limpieza'
 *  @param {object} fields  { table, start, end, total, limit }: la mesa, las dos horas, lo que tardó y el tiempo de
 *                          referencia del local (los dos últimos pueden faltar)
 */
export function reportDescription(kind, { table, start, end, total, limit }) {
    const words = KINDS[kind] ?? KINDS['primera atención'];
    const tookPart = String(total ?? '').trim()
        ? ` ${words.took} ${String(total).trim()}${limit ? `, más que el tiempo de referencia del local (${limit})` : ''}.`
        : '';

    return `Mesa ${table || '?'}: ${words.start} a las ${start || '?'} y ${words.end} a las ${end || '?'}.${tookPart} Adjunta las dos capturas y envía la alerta.`;
}
