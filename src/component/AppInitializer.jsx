import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import useAuthCheck from '../hook/useAuthCheck';
import LoadingPage from './loanding/loadingPage';
import { pedirReporteDemora } from '../store/slices/reporteDemora.js';


export default function AppInitializer({ children }) {

    const { authChecked } = useAuthCheck();
    const dispatch = useDispatch();


    /*  EL AVISO DE DEMORA QUE LLEGA DE LA VENTANA FLOTANTE
     *
     *  La parrilla de la tablet vive en otra ventana y no puede abrir formularios aquí:
     *  no tiene la sesión ni el catálogo de alertas. Lo que hace es pedirlo, el aviso
     *  cruza por el puente de Electron, y aquí se deja anotado para que el formulario
     *  lo recoja.
     *
     *  El oyente va en ESTE componente y no en Main ni en Home a propósito: hace falta
     *  que esté escuchando siempre, y Main solo existe cuando alguien ya entró a un
     *  local. Un aviso que llegue antes se perdería sin dejar rastro.
     *
     *  La marca de tiempo la ponemos aquí, al recibir: es lo que permite distinguir dos
     *  reportes seguidos de la misma mesa, que de otro modo serían idénticos.
     *
     *  Fuera de la aplicación de escritorio no hay puente y esto no se suscribe a nada.
     *  La acción del store sigue existiendo, así que el camino se puede probar en el
     *  navegador despachándola a mano.
     */
    useEffect(() => {
        const desuscribir = window.electronAPI?.onReportarDemora?.((datos) => {
            dispatch(pedirReporteDemora({ ...datos, recibidoEn: Date.now() }));
        });

        return desuscribir;
    }, [dispatch]);


    /*  GANCHO DE PRUEBA — SOLO EN DESARROLLO
     *
     *  Hace exactamente lo mismo que el oyente de arriba, pero desde la consola del
     *  navegador. Sirve para recorrer el camino completo del reporte sin la carcasa de
     *  escritorio, que es la única que puede disparar el evento de verdad.
     *
     *      __probarReporteDemora({ tableNumber: '28', customerSeatedTime: '12:00:00', firtAtenttionTime: '12:04:00' })
     *
     *  'import.meta.env.DEV' es falso al compilar, así que esto NO llega a la versión
     *  publicada: el bloque entero desaparece del paquete.
     */
    useEffect(() => {
        if (!import.meta.env.DEV) return;

        window.__probarReporteDemora = (datos) => {
            dispatch(pedirReporteDemora({ ...datos, recibidoEn: Date.now() }));
        };

        return () => { delete window.__probarReporteDemora; };
    }, [dispatch]);


    if (authChecked) {
        return <LoadingPage />;
    }

    return children;
}
