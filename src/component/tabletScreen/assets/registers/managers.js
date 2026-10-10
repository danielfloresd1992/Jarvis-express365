/*  LOS BOTONES DE LOS GERENTES DE CADA ROTACIÓN
 *
 *  Uno por cada gerente ACTIVO del local, a la derecha de cada fila. Salen de Local.managers, la lista
 *  de gerentes del local. Si está vacía —o no viene—, de las cantidades de Local.touchs: 'totalManager'
 *  gerentes y 'totalAttendee' asistentes.
 *
 *  OJO: el local tiene que venir entero (en Home, state.establishment). La copia de /localLigth que
 *  usa la ventana flotante NO trae ni 'managers' ni 'touchs', y con ella no sale ningún botón.
 */


// managerButtons = «los botones de gerentes del local», cada uno { id, ref, name, label, title }
//   ref    el ObjectId del gerente (manager.model), o null si el botón sale de las cantidades
//   name   su nombre, o el texto del botón si no tiene
//   label  lo que se lee en el botón: la inicial del cargo y su número ('Gerente', 2 → 'G2'), o G1, G2…
//          (y A1, A2… los asistentes) si faltan
//   title  lo que se lee al pasar el ratón: el nombre, el cargo y cómo se le reconoce
// Recibe: establishment (el local en curso, o null).
export function managerButtons(establishment) {

    // managers = «la lista de gerentes». Puede venir poblada (objetos) o solo con sus _id.
    const managers = Array.isArray(establishment?.managers) ? establishment.managers : [];

    if (managers.length > 0) {
        //  Solo los activos: 'status' en false es un gerente dado de baja. Sin 'status' cuenta como activo,
        //  que es lo que pone el modelo por defecto (y lo que hay que suponer si la lista viene sin poblar).
        //  Si la lista tiene gerentes pero ninguno activo, no sale ningún botón: no se cae a las cantidades.
        return managers.filter(manager => manager?.status !== false).map((manager, index) => {
            const isObject = typeof manager === 'object' && manager !== null;
            const name = isObject && manager.name ? manager.name : '';
            const label = isObject && manager.burden && manager.numberManager != null ? `${manager.burden.trim()[0].toUpperCase()}${manager.numberManager}` : `G${index + 1}`;

            return {
                id: isObject ? String(manager._id ?? `gerente-${index}`) : String(manager),
                ref: isObject ? (manager._id ?? null) : manager,
                name: name || label,
                label,
                title: [name || `Gerente ${index + 1}`, isObject ? manager.burden : '', isObject ? manager.characteristic : ''].filter(Boolean).join(' · '),
            };
        });
    }

    // Sin lista: las cantidades del local
    const managersCount = Number(establishment?.touchs?.totalManager) || 0;
    const attendeesCount = Number(establishment?.touchs?.totalAttendee) || 0;

    return [
        ...Array.from({ length: managersCount }, (unused, index) => ({ id: `gerente-${index}`, ref: null, name: `G${index + 1}`, label: `G${index + 1}`, title: `Gerente ${index + 1}` })),
        ...Array.from({ length: attendeesCount }, (unused, index) => ({ id: `asistente-${index}`, ref: null, name: `A${index + 1}`, label: `A${index + 1}`, title: `Asistente ${index + 1}` })),
    ];
}
