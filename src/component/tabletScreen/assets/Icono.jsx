/*  LOS ÍCONOS DE LA VENTANA
 *
 *  Todos del mismo dibujo: caja de 24, trazo de 1,8, puntas redondeadas y sin
 *  relleno. Van aquí dentro y no en una librería porque son pocos y así el trazo es
 *  el mismo en todos. Toman el color del texto del botón (`currentColor`), y el
 *  tamaño va en atributos para que ninguna clase de Tailwind compita con él.
 *
 *  Están en su propio archivo porque los usan los dos: la cabecera (TabletContainer)
 *  y la barra de zoom (TabletScreen). Dejarlos donde estaban obligaba a que la
 *  cabecera importara de quien la importa a ella.
 */


// TRAZOS = «los trazos de cada ícono»
const TRAZOS = {
    //  Enchufe: conectar la tablet por USB.
    conectar: <><path d='M9 3v4M15 3v4' /><path d='M6.5 7h11v3.5a5.5 5.5 0 0 1-11 0z' /><path d='M12 16v5' /></>,

    //  El mismo enchufe, tachado.
    desconectar: <><path d='M9 3v4M15 3v4' /><path d='M6.5 7h11v3.5a5.5 5.5 0 0 1-11 0z' /><path d='M12 16v5' /><line x1='3' y1='3' x2='21' y2='21' /></>,

    //  Cámara con una flecha hacia arriba: mandar esta captura a Jarvis.
    captura: <><path d='M3 8.5A1.5 1.5 0 0 1 4.5 7h2.2l1.2-2h8.2l1.2 2h2.2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z' /><path d='M12 16.5v-6' /><polyline points='9.3 13 12 10.3 14.7 13' /></>,

    //  Destellos: el modo IA. Tachados cuando está en pausa.
    ia: <><path d='M11 3.5l1.7 4.6 4.6 1.7-4.6 1.7L11 16.1l-1.7-4.6-4.6-1.7 4.6-1.7z' /><path d='M18 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z' /></>,
    iaPausa: <><path d='M11 3.5l1.7 4.6 4.6 1.7-4.6 1.7L11 16.1l-1.7-4.6-4.6-1.7 4.6-1.7z' /><path d='M18 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z' /><line x1='3' y1='3' x2='21' y2='21' /></>,

    cerrar: <><line x1='6' y1='6' x2='18' y2='18' /><line x1='18' y1='6' x2='6' y2='18' /></>,
    hecho: <polyline points='5 12.5 10 17 19 7' />,
    aviso: <><circle cx='12' cy='12' r='9' /><path d='M12 7v6M12 16.5v.01' /></>,
    acercar: <><circle cx='11' cy='11' r='7' /><line x1='16.5' y1='16.5' x2='21' y2='21' /><line x1='8' y1='11' x2='14' y2='11' /><line x1='11' y1='8' x2='11' y2='14' /></>,
    alejar: <><circle cx='11' cy='11' r='7' /><line x1='16.5' y1='16.5' x2='21' y2='21' /><line x1='8' y1='11' x2='14' y2='11' /></>,
    mover: <><polyline points='5 9 2 12 5 15' /><polyline points='9 5 12 2 15 5' /><polyline points='15 19 12 22 9 19' /><polyline points='19 9 22 12 19 15' /><line x1='2' y1='12' x2='22' y2='12' /><line x1='12' y1='2' x2='12' y2='22' /></>,
    guardar: <><path d='M12 4v11' /><polyline points='7.5 10.5 12 15 16.5 10.5' /><path d='M5 20h14' /></>,

    //  Un matraz: probar con una tablet de mentira.
    simular: <><path d='M9.5 3h5' /><path d='M10.5 3v6.2L5.2 18a2 2 0 0 0 1.7 3h10.2a2 2 0 0 0 1.7-3l-5.3-8.8V3' /><path d='M7.6 15h8.8' /></>,
};


// Icono = «el ícono»
// Recibe: nombre (cuál de los TRAZOS) y tamano (en píxeles).
export default function Icono({ nombre, tamano = 18 }) {

    //  El anillo que gira mientras algo está en curso.
    if (nombre === 'girando') return (
        <svg className='animate-spin' width={tamano} height={tamano} viewBox='0 0 24 24' fill='none' aria-hidden='true'>
            <circle cx='12' cy='12' r='8.5' stroke='currentColor' strokeWidth='2.5' opacity='0.25' />
            <path d='M20.5 12a8.5 8.5 0 0 0-8.5-8.5' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' />
        </svg>
    );

    return (
        <svg width={tamano} height={tamano} viewBox='0 0 24 24' fill='none' stroke='currentColor'
             strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
            {TRAZOS[nombre]}
        </svg>
    );
}
