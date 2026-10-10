/*  LOS BOTONES DE LA BARRA DE TÍTULO, A LA DERECHA
 *
 *  Siempre en este orden: modo IA · enviar captura · simular · conectar o desconectar · cerrar.
 *
 *  TODOS SON ÍCONOS. La ventana abre a 400 px y con texto no cabían: «Desconectar» empujaba la ✕
 *  fuera del borde. Lo que hace cada uno lo dice su 'title' al pasar el ratón y su 'aria-label' a un
 *  lector de pantalla.
 *
 *  Van en una zona 'no-drag' porque dentro de una zona arrastrable dejarían de responder al clic.
 *
 *  Su aspecto va en las clases 'vt-icono' de index.css y NO en utilidades de Tailwind: la regla
 *  global 'button {}' de index.css no está en ninguna capa y les gana en relleno, borde, radio y letra.
 */


export default function TitleBarActions({ children }) {
    return (
        <div className='flex-none flex items-center gap-1.5' style={{ WebkitAppRegion: 'no-drag' }}>
            {children}
        </div>
    );
}
