import { useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { ReactReduxContext } from 'react-redux';
import { getTimeServices } from '../../../libs/fetch_data/establishmentFetching.js';


/*  LOS TIEMPOS DE SERVICIO DEL LOCAL: cuánto puede tardar la primera atención y la limpieza
 *
 *  Son 'timeServices' del local en api_jarvis365 —`firstAtenttion` y `TableCleaning`—, los que se configuran en
 *  el formulario del establecimiento de Client365. La sesión de la tablet mide con ellos (limitesDelLocal).
 *
 *  DE DÓNDE SALEN, en este orden:
 *
 *      1. De Redux (state.establishment), en la ventana principal: Home pide el local con
 *         'populate=timeServices' al elegirlo, así que ya están ahí (lo vio el usuario). Solo si ese local es
 *         el mismo que el de la sesión.
 *      2. De la API (getTimeServices), si no: en la ventana flotante, que no monta Redux, o mientras Home
 *         todavía no los trajo.
 *
 *  No se leen del local guardado en el navegador ('local_appExpress'): ahí está la versión ligera de la lista,
 *  con 'timeServices' como un simple id. Y cambiar lo que se guarda ahí no se puede: más de diez componentes lo
 *  leen, y varios lo envían tal cual en sus reportes.
 *
 *  Mientras no hay ninguno, o si fallan, es null, y los límites son los de la lista de nombres de siempre.
 */


// noStore = «suscribirse a nada»: para cuando no hay Redux (la ventana flotante)
const noStore = () => () => {};

// isTimeServices = «es el documento de los tiempos», y no solo su id
const isTimeServices = (value) => Boolean(value) && typeof value === 'object';


// useTimeServices = «los tiempos configurados del local»: { firstAtenttion, TableCleaning }, o null
// Recibe: establishmentId, el _id del local de la sesión (o nada, si todavía no se eligió).
function useTimeServices(establishmentId) {

    //  1. Redux, si hay. useSyncExternalStore y no useSelector: este hook también corre donde no hay Redux,
    //     y useSelector sin su proveedor rompe.
    const reduxStore = useContext(ReactReduxContext)?.store ?? null;
    const reduxEstablishment = useSyncExternalStore(
        reduxStore ? reduxStore.subscribe : noStore,
        () => reduxStore?.getState().establishment ?? null
    );
    const fromRedux = reduxEstablishment?._id && reduxEstablishment._id === establishmentId && isTimeServices(reduxEstablishment.timeServices)
        ? reduxEstablishment.timeServices
        : null;

    //  2. La API, solo si Redux no los tiene
    const [fromApi, setFromApi] = useState(null);

    useEffect(() => {
        setFromApi(null);
        if (!establishmentId || fromRedux) return undefined;

        // current = «esta petición sigue siendo la que vale»: si se cambia de local antes de que conteste, la vieja no pisa
        let current = true;
        getTimeServices(establishmentId)
            .then(answer => { if (current) setFromApi(answer); })
            .catch(error => console.log('No se pudieron traer los tiempos de servicio del local:', error?.message ?? error));

        return () => { current = false; };
    }, [establishmentId, fromRedux]);

    return fromRedux ?? fromApi;
}



export { useTimeServices };
