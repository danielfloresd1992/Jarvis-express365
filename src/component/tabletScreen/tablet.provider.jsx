import { createContext, useContext, useState, useMemo, useCallback, useLayoutEffect, memo } from 'react';
import { useDispatch } from 'react-redux';
import { isMobile } from 'react-device-detect';

import { useTabletSession } from './hook/useTabletSession.jsx';
import { useTabletWindow } from '../../hook/useTabletWindow.js';
import { pedirReporteDemora } from '../../store/slices/reporteDemora.js';


/*  ══════════════════════════════════════════════════════════════════════════════════════
 *  LA TABLET DENTRO DE LA VENTANA PRINCIPAL
 *
 *  Por defecto la tablet vive en Home: el espejo en la barra de la izquierda (component/TabletDock)
 *  y los registers en el centro (component/RegisterBoard). Son dos sitios distintos de la pantalla
 *  pero UNA sola sesión —una conexión, una lectura, un registro—, y este archivo es quien la monta y
 *  se la pasa a los dos. Ellos la leen con 'useTabletContext'.
 *
 *
 *  CUANDO LA TABLET SALE A SU VENTANA («Sacar tablet»), la sesión de aquí se desmonta entera:
 *  suelta el USB, deja de leer y deja de guardar. Si siguiera montada, las dos ventanas se pelearían
 *  por el USB y cada una pisaría lo que la otra guarda de los registers. Al cerrar la flotante se
 *  vuelve a montar y lee lo guardado, que ya trae lo que se apuntó allí.
 *
 *  Por eso la sesión va en un componente aparte, SessionRunner, que no pinta nada: así se puede
 *  montar y desmontar sin llevarse por delante el resto de Home —el chat, la bandeja, el formulario
 *  abierto—, que es lo que pasaría si la sesión envolviera a todo. Cada vez que la sesión cambia, se
 *  la pasa al proveedor, y el proveedor a quien la lea.
 *
 *
 *  En el teléfono y en la tableta no hay tablet que espejar: no se monta nada, y el centro de Home
 *  se queda con la bienvenida.
 *  ══════════════════════════════════════════════════════════════════════════════════════ */



// TabletContext = «la tablet de esta ventana». El valor por defecto es el de «aquí no hay tablet»:
// es lo que lee quien esté fuera de un TabletProvider.
const TabletContext = createContext({ available: false, away: false, session: null });



/*  LA SESIÓN — no pinta nada
 *
 *  Monta la sesión y se la pasa al proveedor cada vez que cambia.
 *
 *  Va con 'memo' para que el proveedor, al repintarse con la sesión nueva, no la vuelva a pintar a
 *  ella: su única prop es 'onChange', que es siempre la misma función. Sin 'memo' sería un bucle.
 *
 *  @param {function} onChange  recibe la sesión cada vez que cambia, y null al desmontarse
 */
const SessionRunner = memo(function SessionRunner({ onChange }) {

    const dispatch = useDispatch();

    // reportDelay = «reportar la demora de una mesa»
    // Aquí no hace falta el puente de Electron: el formulario está en esta misma ventana. El aviso
    // se deja en el mismo buzón donde caen los que llegan de la ventana flotante
    // (store/slices/reporteDemora.js), y Home lo abre en el panel de la derecha.
    const reportDelay = useCallback((data) => {
        dispatch(pedirReporteDemora({ ...data, recibidoEn: Date.now() }));
        return true;
    }, [dispatch]);

    const session = useTabletSession({ onReportDelay: reportDelay });

    //  'useLayoutEffect' y no 'useEffect': se pasa antes de que el navegador pinte, así que nunca se
    //  llega a ver un fotograma con la sesión anterior.
    useLayoutEffect(() => {
        onChange(session);
    });

    //  Al desmontarse —la tablet salió a su ventana, o se salió de Home— deja de haber sesión.
    useLayoutEffect(() => () => onChange(null), [onChange]);

    return null;
});



/*  EL PROVEEDOR — va en Home, envolviendo la barra de la izquierda y el centro
 */
function TabletProvider({ children }) {

    // away = «la tablet está fuera, en su ventana flotante»
    const away = useTabletWindow();

    // session = «la sesión de la tablet», la que va pasando SessionRunner. null mientras no hay ninguna.
    const [session, setSession] = useState(null);

    // available = «aquí puede haber tablet»: en la computadora sí; en el teléfono y en la tableta, no.
    const available = !isMobile;

    //  Un objeto nuevo solo cuando cambia algo: si no, quien lee la tablet se repintaría cada vez que
    //  se repinta Home, aunque no hubiera cambiado nada de la tablet.
    const value = useMemo(() => ({ available, away, session }), [available, away, session]);

    return (
        <TabletContext.Provider value={value}>
            {available && !away && <SessionRunner onChange={setSession} />}
            {children}
        </TabletContext.Provider>
    );
}



// useTabletContext = «la tablet de esta ventana»
// Devuelve: { available, away, session }
//   available  aquí puede haber tablet (en el teléfono, no)
//   away       está fuera, en su ventana flotante
//   session    la sesión (lo que devuelve hook/useTabletSession.jsx), o null si no hay ninguna montada
function useTabletContext() {
    return useContext(TabletContext);
}



export { TabletProvider, useTabletContext };
