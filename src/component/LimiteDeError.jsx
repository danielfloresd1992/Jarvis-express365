import { Component } from 'react';




/*  ─────────────────────────────────────────────────────────────────────────────
 *  QUE UN FALLO SE VEA, EN VEZ DE DEJAR LA PANTALLA EN BLANCO
 *
 *  Cuando algo revienta durante el pintado, React DESMONTA el árbol entero. No avisa,
 *  no deja rastro en pantalla: queda el fondo de la ventana y nada más. Y un rectángulo
 *  vacío se parece muchísimo a «la tablet no está conectada», a «no ha llegado ningún
 *  ticket» y a «el panel no tiene altura». Cuatro cosas distintas, el mismo aspecto.
 *
 *  Distinguirlas obligaba a abrir la consola del navegador, y en el equipo del
 *  restaurante nadie la abre. Con esto, el propio panel dice qué pasó.
 *
 *  Es una CLASE y no un enganche porque React solo ofrece esta capacidad a las clases:
 *  'componentDidCatch' no tiene equivalente en funciones. No es código anticuado, es el
 *  único que hay.
 *
 *  OJO CON LO QUE NO ATRAPA, para no confiarse:
 *    · errores dentro de un manejador de eventos (un clic)
 *    · errores dentro de código asíncrono (una petición que falla)
 *    · errores del propio límite
 *  Para esos sigue haciendo falta el try/catch de siempre.
 *  ───────────────────────────────────────────────────────────────────────────── */
export class LimiteDeError extends Component {

    constructor(props) {
        super(props);
        this.state = { error: null, pila: '' };
    }


    static getDerivedStateFromError(error) {
        return { error };
    }


    componentDidCatch(error, info) {
        //  A la consola también, con la pila de componentes: ahí se ve QUÉ componente
        //  falló, que es lo que el mensaje de error por sí solo no dice.
        console.error('[PANTALLA] se cayó el pintado:', error);
        console.error('[PANTALLA] componente:', info?.componentStack);

        this.setState({ pila: info?.componentStack ?? '' });
    }


    render() {
        const { error, pila } = this.state;

        if (!error) return this.props.children;

        return (
            <div className='w-full h-full min-h-0 overflow-auto bg-[#01122c] text-[#aecbf0] p-4'>

                <p className='text-[13px] font-semibold text-[#e0b341]'>
                    Se cayó el pintado de esta ventana
                </p>

                <p className='text-[11px] text-[#5e7ba0] mt-1'>
                    No es que la tablet esté desconectada: es un fallo del programa. Esto es
                    lo que dijo.
                </p>

                <pre className='mt-3 p-2 rounded bg-black/30 text-[11px] text-[#f08a6a] whitespace-pre-wrap break-words'>
                    {String(error?.message ?? error)}
                </pre>

                {
                    pila && (
                        <pre className='mt-2 p-2 rounded bg-black/20 text-[10px] text-[#5e7ba0] whitespace-pre-wrap break-words'>
                            {pila.trim().split('\n').slice(0, 8).join('\n')}
                        </pre>
                    )
                }

                <button
                    className='mt-3 rounded-md bg-[#0a3a66] text-[#aecbf0] hover:bg-[#0b4b85]'
                    onClick={() => this.setState({ error: null, pila: '' })}
                    //  El tamaño va en 'style': la regla global 'button {}' de index.css
                    //  gana a las utilidades de Tailwind.
                    style={{ padding: '4px 12px', fontSize: '11px' }}
                >
                    Reintentar
                </button>

            </div>
        );
    }
}
