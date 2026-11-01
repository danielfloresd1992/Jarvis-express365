import axiosInstance from './instanceAxios';
import sessionAxios from './sessionAxios.js';
import IP from './dataFetch';



// setNovelty y saveVideo, las de los formularios, van por sessionAxios: si la sesión venció, se vuelve a entrar sin
// recargar y la petición se repite. Las de la bandeja del Toast POS siguen por instanceAxios: las usa también la
// ventana flotante, que no tiene ese formulario.
export const setNovelty = dataForRequest => {
    return new Promise((resolve, reject) => {
        sessionAxios.post(`${IP}/novelties`, dataForRequest)
            .then(response => resolve(response))
            .catch(error => reject(error));
    });
};


export const saveVideo = (file) => {
    return new Promise((resolve, reject) => {
        // Faltaba el `return`: resolver la promesa no corta la ejecución, así
        // que sin archivo se enviaba igual un POST con el FormData vacío.
        // Hoy queda tapado porque los llamadores comprueban antes, pero
        // cualquier llamador nuevo mandaría una petición inválida.
        if (!file) return resolve(null);
        const formData = new FormData();
        formData.append('video', file);
        sessionAxios.post(`${IP}/novelty/video`, formData)
            .then(response => resolve(response))
            .catch(error => reject(error));
    });
}


/**
 * Sube una imagen a la bandeja del Toast POS de un local.
 *
 * Es el MISMO endpoint que usa el formulario «Subir imagen a mi Jarvis» de las
 * tabletas (component/for_tablet/loadImg.jsx). Se saca acá para que la ventana
 * flotante de la tablet pueda mandar su captura sin repetir la petición, y para
 * que el día que cambie la ruta se cambie en un sitio.
 *
 * NO se manda quién la envía. El nombre que después aparece bajo cada imagen en
 * la bandeja lo pone el servidor a partir de la sesión de la cookie. Mandarlo
 * desde acá sería, además de innecesario, falsificable.
 *
 * Al terminar, jarvis_api emite `fileLoader` por el socket y la bandeja se
 * actualiza sola en todas las pantallas que estén mirando ese local.
 *
 * @param {string} idLocal  El `_id` del establecimiento.
 * @param {Blob|File} imagen  La imagen. Si es un Blob se le pone nombre acá:
 *   `FormData` lo llamaría "blob" y el servidor guardaría un archivo sin
 *   extensión.
 */
export const enviarImagenToastPos = (idLocal, imagen) => {
    return new Promise((resolve, reject) => {
        if (!idLocal) return reject(new Error('No hay un local seleccionado.'));
        if (!imagen) return reject(new Error('No hay ninguna imagen que enviar.'));

        const formData = new FormData();
        formData.append('img', imagen, imagen.name ?? `tablet_${Date.now()}.png`);

        axiosInstance.post(`${IP}/noventy/imageToasdPos?id=${idLocal}`, formData)
            .then(response => resolve(response))
            .catch(error => reject(error));
    });
};


export const getFileToastPos = id => {
    return new Promise((resolve, reject) => {
        axiosInstance.get(`${IP}/noventy/imageToasdPos?id=${id}`)
            .then(response => resolve(response))
            .catch(error => reject(error));
    })
}



export const deleteFileToasPos = id => {
    return new Promise((resolve, reject) => {
        axiosInstance.delete(`${IP}/noventy/imageToasdPos?id=${id}`)
            .then(response => resolve(response))
            .catch(error => reject(error));
    });
}



/*  LAS NOVEDADES POR SU _id: las que tiene enlazadas una rotación de Mesas
 *
 *  Una rotación guarda solo el _id de cada novedad que se reportó desde ella (firstAttentionDelay, preparationDelay…;
 *  ver libs/tickets/linkedNovelties.js). Con estas se trae el documento ENTERO, para saber si se aprobó, se invalidó o
 *  se modificó. Las usa component/tabletScreen/hook/useLinkedNovelties.jsx.
 *
 *  Son LECTURAS DE FONDO: van por instanceAxios y no por sessionAxios. Si la sesión venció, una tabla que se pone al
 *  día sola no debe abrir por su cuenta el formulario de volver a entrar (como stampFetching.js).
 */


// getNoveltyById = «una novedad entera, por su _id» (GET /novelties/id=<id>). La API la devuelve dentro de una lista
// (hace un find), sin populate. Resuelve con el documento, o null si no existe.
export const getNoveltyById = id => {
    return new Promise((resolve, reject) => {
        axiosInstance.get(`${IP}/novelties/id=${id}`)
            .then(response => {
                const found = Array.isArray(response.data) ? response.data[0] : response.data;
                resolve(found ?? null);
            })
            .catch(error => reject(error));
    });
};


// FETCH_CONCURRENCY = «cuántas se piden a la vez, como mucho»: al abrir la app puede haber decenas enlazadas, y no
// hace falta lanzarlas todas juntas contra la API
const FETCH_CONCURRENCY = 4;

// getNoveltiesByIds = «varias novedades enteras, por su _id», de FETCH_CONCURRENCY en FETCH_CONCURRENCY.
// No rechaza nunca: resuelve con un Map _id → el documento (null = no existe). Las que fallaron (sin red, sesión
// vencida…) no entran en el Map, para que quien pide las vuelva a pedir más tarde.
export const getNoveltiesByIds = async (ids) => {
    const found = new Map();
    const queue = [...new Set(ids)];
    const failed = [];

    // fetchNext = «uno de los que piden»: toma la siguiente de la cola hasta que no quede ninguna
    const fetchNext = async () => {
        while (queue.length > 0) {
            const id = queue.shift();
            try { found.set(id, await getNoveltyById(id)); }
            catch (error) { failed.push({ id, error }); }
        }
    };

    await Promise.all(Array.from({ length: Math.min(FETCH_CONCURRENCY, queue.length) }, fetchNext));

    //  Un solo aviso por tanda, no uno por novedad: con la API caída serían decenas
    if (failed.length > 0) console.warn(`No se pudieron traer ${failed.length} novedades enlazadas; se volverán a pedir:`, failed[0].error?.message ?? failed[0].error);

    return found;
};