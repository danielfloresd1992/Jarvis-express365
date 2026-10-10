import { useState, useEffect } from 'react';


/*  EL LOCAL QUE SE ESTÁ MONITOREANDO
 *
 *  Esta ventana NO monta Redux —montarlo abriría una segunda sesión y un segundo socket contra
 *  el servidor—, así que el local se lee de donde la ventana principal lo deja al elegirlo.
 *
 *  Funciona porque las dos ventanas cargan el mismo origen en la misma sesión de Electron:
 *  mismo origen, mismo almacenamiento.
 */


// ESTABLISHMENT_KEY = «la llave donde la ventana principal deja el local elegido»
const ESTABLISHMENT_KEY = 'local_appExpress';



// readEstablishment = «leer el local en curso»
// Devuelve: el local ({ _id, name, dishes… }), o null si todavía no se ha elegido ninguno. Eso último
//           es un estado normal: la ventana se puede abrir antes de entrar a un establecimiento.
function readEstablishment() {
    try { return JSON.parse(localStorage.getItem(ESTABLISHMENT_KEY))?.[0] ?? null; }
    catch { return null; }
}



// useEstablishment = «el local en curso, siempre al día»
// El evento 'storage' avisa a las OTRAS ventanas del mismo origen cuando una escribe. Es justo lo que
// hace falta: si alguien cambia de local en la ventana principal con esta abierta, aquí se entera sola.
// Devuelve: el local, o null.
function useEstablishment() {

    const [establishment, setEstablishment] = useState(readEstablishment);

    useEffect(() => {
        const onStorage = (event) => { if (event.key === ESTABLISHMENT_KEY) setEstablishment(readEstablishment()); };

        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    return establishment;
}



export { useEstablishment, readEstablishment };
