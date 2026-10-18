import { isTakeOut } from './tableRecords.js';


/*  CUÁNTAS ROTACIONES Y CUÁNTOS TOQUES
 *
 *  La cuenta que hacía la pestaña Registros por dentro (RegisterSaved), sacada aquí para poder hacerla
 *  también arriba, en la barra del registro, sumando las de Registros y las de Mesas (RegisterTotals).
 *
 *  Un pedido para llevar sale en las listas pero NO cuenta como rotación: no hubo mesa ocupada (isTakeOut).
 */


// rotationTotals = «los totales de unas rotaciones»: { rotations, takeOut, touches }
//   rotations  las rotaciones de verdad (sin los pedidos para llevar)
//   takeOut    los pedidos para llevar
//   touches    los toques de gerente, de todas
// Recibe: rotations, las guardadas (Registros) o las de Mesas en uso (rotationsInUse).
export function rotationTotals(rotations) {
    const takeOut = rotations.filter(isTakeOut).length;
    return {
        rotations: rotations.length - takeOut,
        takeOut,
        touches: rotations.reduce((sum, rotation) => sum + (rotation.touch?.length ?? 0), 0),
    };
}


// rotationsInUse = «las rotaciones de Mesas que ya son una mesa»: con fecha (en uso) y con su número. Las
// filas libres no cuentan, ni una en la que todavía no se escribió la mesa. Una que se guarda con el
// disquete se limpia de Mesas y pasa a Registros: así nunca se cuenta dos veces.
// Recibe: records, las filas de Mesas (session.store.records).
export const rotationsInUse = (records) => records.filter(record => record.date && String(record.tableNumber ?? '').trim() !== '');
