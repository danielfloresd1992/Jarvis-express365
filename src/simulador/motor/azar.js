/*  AZAR CON SEMILLA
 *
 *  'Math.random' no se puede repetir, y una simulación que no se puede repetir no sirve
 *  para perseguir un fallo: el turno en que la lectura se equivocó no vuelve a salir.
 *  Con una semilla, la misma secuencia de pedidos se reproduce las veces que haga falta.
 *
 *  El generador es mulberry32: pequeño, rápido y de sobra para repartir platos.
 */
export function crearAzar(semilla = Date.now()) {

    let estado = (Number(semilla) >>> 0) || 1;

    //  Un número en [0, 1), como Math.random.
    const siguiente = () => {
        estado = (estado + 0x6D2B79F5) | 0;
        let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    return {
        siguiente,

        //  Un decimal entre los dos, y un entero entre los dos (ambos incluidos).
        entre: (min, max) => min + siguiente() * (max - min),
        entero: (min, max) => Math.floor(min + siguiente() * (max - min + 1)),

        elegir: (lista) => lista[Math.floor(siguiente() * lista.length)],

        //  Varios distintos de una lista, sin repetir.
        elegirVarios: (lista, cuantos) => {
            const bolsa = [...lista];
            const salida = [];
            while (salida.length < cuantos && bolsa.length > 0) {
                salida.push(bolsa.splice(Math.floor(siguiente() * bolsa.length), 1)[0]);
            }
            return salida;
        },

        probabilidad: (p) => siguiente() < p,

        //  Tiempo entre llegadas de un proceso de Poisson: muchas esperas cortas y
        //  alguna larga, que es como entran los pedidos en un restaurante.
        exponencial: (media) => -Math.log(1 - siguiente()) * media,

        //  Una opción según su peso: [{ peso: 60, valor: 'mesa' }, …]
        segunPeso: (opciones) => {
            const total = opciones.reduce((suma, o) => suma + Math.max(0, o.peso), 0);
            if (total <= 0) return opciones[0]?.valor;

            let tirada = siguiente() * total;
            for (const opcion of opciones) {
                tirada -= Math.max(0, opcion.peso);
                if (tirada < 0) return opcion.valor;
            }
            return opciones[opciones.length - 1].valor;
        },
    };
}
