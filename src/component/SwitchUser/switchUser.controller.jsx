import { useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectProcessRegister } from '../../store/slices/establishment.js';
import useSwitchUser from './hook/useSwitchUser.jsx';
import SwitchUserButton from './assets/SwitchUserButton.jsx';
import SwitchUserDialog from './assets/SwitchUserDialog.jsx';
import './style.css';


/*  CAMBIAR DE USUARIO: la tecla de la barra de arriba y su formulario
 *
 *  Solo en un local con Mesas (selectProcessRegister): es donde una misma estación pasa de un operador a otro
 *  durante el día. Cómo se hace el cambio, sin recargar ni perder las mesas, lo cuenta useSwitchUser.
 *
 *  El formulario se queda abierto aunque el local deje de tener Mesas a medio escribir: lo que se quita es la tecla.
 */
export default function SwitchUserController() {

    const processRegister = useSelector(selectProcessRegister);
    const session = useSwitchUser();

    // buttonRef = «la tecla de la barra»: al cancelar, el foco vuelve a ella, y no se pierde en la página. Al entrar
    // no: el foco es del BoxModal que avisa del cambio (su «Aceptar»), y quitárselo haría que Enter reabriera esto.
    const buttonRef = useRef(null);

    const cancel = useCallback(() => {
        if (session.sending) return;
        session.closeDialog();
        buttonRef.current?.focus();
    }, [session.sending, session.closeDialog]);

    const submit = session.switchTo;

    if (!session.currentUser) return null;

    return (
        <>
            {processRegister && <SwitchUserButton user={session.currentUser} onClick={session.openDialog} buttonRef={buttonRef} />}
            {
                session.open && (
                    <SwitchUserDialog
                        currentUser={session.currentUser}
                        sending={session.sending}
                        failure={session.failure}
                        onSubmit={submit}
                        onCancel={cancel}
                        onEdit={session.clearFailure}
                    />
                )
            }
        </>
    );
}
