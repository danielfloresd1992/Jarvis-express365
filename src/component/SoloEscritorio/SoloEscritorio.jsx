import { nombreDelNavegador } from '../../libs/entorno/esEscritorio';
import './SoloEscritorio.css';

/**
 * Lo único que se pinta cuando la aplicación se abre fuera del escritorio.
 *
 * No es un aviso encima de la aplicación: es su REEMPLAZO. Nada del resto se
 * monta, así que no hay nada detrás que se pueda alcanzar cerrando un cartel.
 *
 * El texto nombra el navegador concreto —"Google Chrome", "Brave"— en vez de
 * decir "tu navegador": quien lo lee entiende de inmediato que el problema es
 * dónde lo abrió, no que la aplicación esté rota.
 */
export default function SoloEscritorio() {
    return (
        <div className='solo-escritorio'>
            <div className='solo-escritorio__caja'>
                <span className='solo-escritorio__icono' aria-hidden='true'>
                    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'
                        strokeWidth='1.6' strokeLinecap='round' strokeLinejoin='round'>
                        <rect x='2' y='3' width='20' height='14' rx='2' />
                        <path d='M8 21h8M12 17v4' />
                    </svg>
                </span>

                <h1 className='solo-escritorio__titulo'>Reportes Express</h1>

                <p className='solo-escritorio__texto'>
                    En la computadora, esta aplicación funciona únicamente desde el
                    programa instalado en las estaciones de monitoreo.
                </p>

                <p className='solo-escritorio__texto solo-escritorio__texto--apagado'>
                    La abriste desde <strong>{nombreDelNavegador()}</strong>, y desde
                    ahí no puede trabajar: le faltan permisos del equipo y la sesión
                    quedaría abierta en una máquina que no es la de monitoreo.
                </p>

                <p className='solo-escritorio__pie'>
                    Cerrá esta pestaña y abrí <strong>Reportes Express</strong> desde
                    el escritorio del equipo. Desde el teléfono sí podés entrar con
                    el navegador, sin instalar nada.
                </p>
            </div>
        </div>
    );
}
