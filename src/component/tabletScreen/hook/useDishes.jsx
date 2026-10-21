import { useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { ReactReduxContext } from 'react-redux';
import { getDishes } from '../../../libs/fetch_data/establishmentFetching.js';


/*  LA CARTA DEL LOCAL: sus platos ('dishes' en api_jarvis365, los que gerencia da de alta en Client365)
 *
 *  De ella salen las opciones del «Tipo de plato» de Mesas y Registros, y con ella elige la IA (dishTypes.js).
 *
 *  DE DÓNDE SALE, en este orden (como los tiempos de servicio, useTimeServices):
 *
 *      1. De Redux (state.establishment), en la ventana principal: Home pide el local con 'populate=dishes' al
 *         elegirlo. Solo si ese local es el mismo que el de la sesión y sus platos vienen enteros.
 *      2. De la API (getDishes), si no: en la ventana flotante, que no monta Redux, o mientras Home todavía no
 *         la trajo.
 *
 *  No se lee del local guardado en el navegador ('local_appExpress'): ahí está la versión ligera, con los platos
 *  como simples _id, sin su nombre.
 *
 *  Mientras no llega, o si falla, es [] (NO_DISHES), y el select ofrece la lista de siempre.
 */


// NO_DISHES = «sin carta». Siempre la misma lista: una nueva en cada pintado volvería a montar el índice de búsqueda.
const NO_DISHES = [];

// noStore = «suscribirse a nada»: para cuando no hay Redux (la ventana flotante)
const noStore = () => () => {};

// isFullMenu = «son los platos enteros», y no solo sus _id
const isFullMenu = (dishes) => Array.isArray(dishes) && dishes.every(dish => Boolean(dish) && typeof dish === 'object');


// useDishes = «la carta del local»: sus platos, o [] si no tiene
// Recibe: establishmentId, el _id del local de la sesión (o nada, si todavía no se eligió).
function useDishes(establishmentId) {

    //  1. Redux, si hay. useSyncExternalStore y no useSelector: este hook también corre donde no hay Redux.
    const reduxStore = useContext(ReactReduxContext)?.store ?? null;
    const reduxEstablishment = useSyncExternalStore(
        reduxStore ? reduxStore.subscribe : noStore,
        () => reduxStore?.getState().establishment ?? null
    );
    const fromRedux = reduxEstablishment?._id && reduxEstablishment._id === establishmentId && isFullMenu(reduxEstablishment.dishes)
        ? reduxEstablishment.dishes
        : null;

    //  2. La API, solo si Redux no la tiene
    const [fromApi, setFromApi] = useState(null);

    useEffect(() => {
        setFromApi(null);
        if (!establishmentId || fromRedux) return undefined;

        // current = «esta petición sigue siendo la que vale»: si se cambia de local antes de que conteste, la vieja no pisa
        let current = true;
        getDishes(establishmentId)
            .then(answer => { if (current) setFromApi(answer); })
            .catch(error => console.log('No se pudo traer la carta del local:', error?.message ?? error));

        return () => { current = false; };
    }, [establishmentId, fromRedux]);

    return fromRedux ?? fromApi ?? NO_DISHES;
}



export { useDishes };
