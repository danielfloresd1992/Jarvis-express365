import { useRef, useEffect } from 'react';
import { crearMotor } from '../motor/motor.js';
import { cargarEscena } from '../motor/escenas.js';
import { esNumero } from '../formato.js';
import { engineSettings, INITIAL_SCENE } from './useSettings.jsx';


/*  EL MOTOR: LA COCINA DE MENTIRA
 *
 *  Se crea UNA vez, al abrir la ventana, y dura lo que ella. Cómo se comporta está en motor/motor.js;
 *  aquí solo se crea, se le cargan la escena de la dirección (si la hay) y se le pasan los ajustes
 *  cada vez que cambian.
 *
 *  Su semilla y su reloj salen de Date.now(): misma hora de arranque, misma historia.
 */



// useEngine = «el motor»
// Recibe: settings (los ajustes de ahora, los de useSettings).
// Devuelve: el motor (ver la lista de lo que sabe hacer al final de motor/motor.js).
function useEngine(settings) {

    const engineRef = useRef(null);

    if (!engineRef.current) {
        engineRef.current = crearMotor({ ajustes: engineSettings(settings) });
        if (INITIAL_SCENE) cargarEscena(engineRef.current, INITIAL_SCENE);
    }

    const engine = engineRef.current;


    //  Cada cambio de ajustes le llega al motor. Le llegan TODOS cada vez: él mismo rehace solo lo
    //  que depende de algo que haya cambiado de verdad.
    useEffect(() => {
        engine.ajustar(engineSettings(settings));
    }, [settings, engine]);


    return engine;
}



/*  readShift = «leer el turno»
 *
 *  'engine.turno()' con todos sus campos asegurados. Se lee a la defensiva: un motor que no lleve la
 *  cuenta del turno (o que la lleve a medias) no puede tumbar el panel. 'disponible' dice si el dato es
 *  de verdad o si lo que hay aquí son ceros de relleno, para no enseñar «mesa 0 de 70» como si fuera
 *  cierto.
 *
 *  Los nombres de los campos son los del motor, y los de la exportación.
 */
function readShift(engine) {
    const shiftData = (typeof engine.turno === 'function' ? engine.turno() : null) ?? {};
    const numberOr = (value, fallback = 0) => (esNumero(value) ? value : fallback);

    return {
        disponible: typeof engine.turno === 'function',
        terminado: shiftData.terminado === true,
        rotacionesDelTurno: numberOr(shiftData.rotacionesDelTurno, numberOr(engine.ajustes?.rotacionesDelTurno)),
        rotacionesIniciadas: numberOr(shiftData.rotacionesIniciadas),
        rotacionesTerminadas: numberOr(shiftData.rotacionesTerminadas),
        rotacionesManuales: numberOr(shiftData.rotacionesManuales),
        inicio: shiftData.inicio ?? '',
        fin: shiftData.fin ?? '',
        transcurridoS: numberOr(shiftData.transcurridoS),
        duracionS: numberOr(shiftData.duracionS, numberOr(engine.ajustes?.duracionDelTurnoH) * 3600),
        activasEnPantalla: numberOr(shiftData.activasEnPantalla),
        tickets: numberOr(shiftData.tickets),
        proximaRotacionEnS: esNumero(shiftData.proximaRotacionEnS) ? shiftData.proximaRotacionEnS : null,
        demoras: {
            total: numberOr(shiftData.demoras?.total),
            entradas: numberOr(shiftData.demoras?.entradas),
            fuertes: numberOr(shiftData.demoras?.fuertes),
            postres: numberOr(shiftData.demoras?.postres),
            otros: numberOr(shiftData.demoras?.otros),
        },
    };
}



export { useEngine, readShift };
