import IP from './api_conexion';
import axiosInstance from './instanceAxios';


/*  LAS PETICIONES DEL CICLO DE LA ROTACIÓN
 *
 *  Todo lo que el register de mesas le pide a api_jarvis365 sobre las rotaciones (su recurso
 *  'rotation'). La estructura de una rotación está en libs/tickets/tableRecords.js.
 *
 *  Cada función devuelve una promesa que, si falla, rechaza con un Error cuyo `message` ya se puede
 *  enseñar al operador tal cual: lo que contestó la API (el interceptor de instanceAxios lo pone ahí)
 *  o, cuando la API no dijo nada útil, uno escrito aquí según el caso. Lleva además `status`, por si
 *  el componente quiere hacer algo más que mostrarlo.
 *
 *  Los cuerpos viajan TAL CUAL los arma quien llama, sin una lista de propiedades: el ciclo de la
 *  rotación va a seguir creciendo, y un campo nuevo no debe obligar a tocar este archivo. Lo que sobre
 *  —lo interno de esta app, como 'key' y 'edited' de los procesos— lo descarta la API, que valida con
 *  `stripUnknown`; lo que sí tiene que guardar, tiene que estar en su esquema y su modelo.
 */


// rotationError = «el error de una petición, con un mensaje que entienda el operador»
// Recibe el error de axios, el mensaje para cuando nadie dijo nada útil ('No se pudo guardar…') y el de
// un 409, que no quiere decir lo mismo al guardar que al corregir; devuelve un Error con `message`,
// `status` y el original en `cause`.
function rotationError(error, fallback, conflict = 'Esta rotación ya estaba guardada') {

    // status = «el código HTTP»; sin respuesta (red caída, servidor apagado) es 0
    const status = error?.response?.status ?? 0;

    // fromApi = «el texto que mandó la API», si mandó uno (el interceptor lo dejó en error.message)
    const fromApi = error?.response?.data?.message;

    //  Un 404 CON texto es de la API («No existe un establecimiento llamado…»); SIN texto es que la
    //  ruta no existe: la API todavía no tiene el recurso desplegado.
    const message = status === 0 ? 'No hay conexión con el servidor'
        : status === 401 ? 'La sesión expiró: vuelve a iniciar sesión'
        : status === 409 ? conflict
        : fromApi || (status === 404 ? 'El servidor todavía no tiene las rotaciones: falta actualizar la API' : fallback);

    return Object.assign(new Error(message), { status, cause: error });
}



// saveRotation = «guardar UNA rotación en la API» (POST /rotation)
// Resuelve con la rotación tal como quedó guardada. Rechaza con el error de rotationError.
// Recibe: body, el cuerpo tal cual se envía —la rotación con `establishment` y `clientId`—.
export const saveRotation = (body) => {
    return new Promise((resolve, reject) => {
        axiosInstance.post(`${IP}/rotation`, body)
            .then(response => resolve(response.data))
            .catch(error => reject(rotationError(error, 'No se pudo guardar la rotación')));
    });
};

// saveRecord = «guardar una rotación de Mesas»: la rotación entera, con su local y su id como `clientId` (la API
// reconoce así la misma rotación). Sin lista de campos: lo que crezca el ciclo viaja solo. La usan el disquete de
// cada fila (RegisterRecordRow) y el bloque de las de días anteriores (useStaleRotations).
export const saveRecord = (record, establishmentId) => saveRotation({ ...record, establishment: establishmentId, clientId: record.id });



// updateRotation = «corregir una rotación ya guardada» (PUT /rotation/id=<id>)
// La API anota cada cambio en `changes` de la rotación —quién, cuándo, la propiedad, el valor de antes y
// el nuevo— y resuelve con la rotación entera, ya corregida. Rechaza con el error de rotationError.
// Recibe: data, lo que cambia tal cual ({ tableNumber: '33' }, { hourTouch: '10:45:00' }), e id, el _id
// de lo que cambia: la rotación, uno de sus procesos o uno de sus toques.
export const updateRotation = (data, id) => {
    return new Promise((resolve, reject) => {
        axiosInstance.put(`${IP}/rotation/id=${id}`, data)
            .then(response => resolve(response.data))
            .catch(error => reject(rotationError(error, 'No se pudo guardar el cambio', 'Alguien la corrigió al mismo tiempo: vuelve a intentarlo')));
    });
};



// addRotationTouch = «apuntar un toque nuevo en una rotación guardada» (POST /rotation/id=<id>/touch)
// Resuelve con la rotación entera, ya con el toque (y su _id). Rechaza con el error de rotationError.
// Recibe: id, el _id de la rotación, y touch, el toque tal cual ({ ref, name, hourTouch, hourTouchFinish, createdAt, recovered }).
export const addRotationTouch = (id, touch) => {
    return new Promise((resolve, reject) => {
        axiosInstance.post(`${IP}/rotation/id=${id}/touch`, touch)
            .then(response => resolve(response.data))
            .catch(error => reject(rotationError(error, 'No se pudo apuntar el toque')));
    });
};



// deleteRotationTouch = «quitar un toque de una rotación guardada» (DELETE /rotation/touch/id=<id>)
// Resuelve con la rotación entera, ya sin el toque. Rechaza con el error de rotationError.
// Recibe: id, el _id del TOQUE (no el de la rotación).
export const deleteRotationTouch = (id) => {
    return new Promise((resolve, reject) => {
        axiosInstance.delete(`${IP}/rotation/touch/id=${id}`)
            .then(response => resolve(response.data))
            .catch(error => reject(rotationError(error, 'No se pudo quitar el toque')));
    });
};



// getRotationsByEstablishment = «las rotaciones de un establecimiento en un día» (GET /rotation)
// El día es un DÍA OPERATIVO, como en el resto de la API: de las 08:00 a las 07:00 del día siguiente,
// hora de Caracas, así que una mesa de las 02:00 cuenta en el día anterior.
// Resuelve con { establishment, name, from, to, total, documents }: `documents` son las rotaciones,
// ordenadas por la hora en que empezaron. Rechaza con el error de rotationError; un nombre que no existe
// llega con el mensaje de la API («No existe un establecimiento llamado…»).
// Recibe: name (el nombre del establecimiento, tal cual está en Local) y date (el día, 'AAAA-MM-DD').
export const getRotationsByEstablishment = (name, date) => {
    return new Promise((resolve, reject) => {
        axiosInstance.get(`${IP}/rotation`, { params: { name, from: date } })
            .then(response => resolve(response.data))
            .catch(error => reject(rotationError(error, 'No se pudieron traer las rotaciones')));
    });
};
