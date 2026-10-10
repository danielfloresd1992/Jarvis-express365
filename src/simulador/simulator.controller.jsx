import { useState, useMemo, useCallback } from 'react';
import './simulador.css';
import { cargarEscena } from './motor/escenas.js';

//  LA LÓGICA — un hook por cada cosa que el simulador sabe hacer (carpeta hook/)
import { useSettings, sceneRequest, SCREEN_ONLY, INITIAL_SCENE } from './hook/useSettings.jsx';
import { useEngine, readShift } from './hook/useEngine.jsx';
import { useScreen } from './hook/useScreen.jsx';
import { useTabletLink, describeLastReading } from './hook/useTabletLink.jsx';
import { useComparison } from './hook/useComparison.jsx';

//  LO QUE SE VE — un componente por cada elemento de la pantalla (carpeta assets/)
import SimulatorFrame from './assets/layout/SimulatorFrame.jsx';
import SimulatorBody from './assets/layout/SimulatorBody.jsx';

import SimulatorHeader from './assets/header/SimulatorHeader.jsx';
import AiReadingStatus from './assets/header/AiReadingStatus.jsx';
import TabletLinkStatus from './assets/header/TabletLinkStatus.jsx';
import TabletClock from './assets/header/TabletClock.jsx';

import ScreenArea from './assets/screen/ScreenArea.jsx';
import SimulationControl from './assets/screen/SimulationControl.jsx';
import ManualKitchenBanner from './assets/screen/ManualKitchenBanner.jsx';
import ShiftOverBanner from './assets/screen/ShiftOverBanner.jsx';
import TabletCanvas from './assets/screen/TabletCanvas.jsx';
import BareScreen from './assets/screen/BareScreen.jsx';

import ControlPanel from './assets/panel/ControlPanel.jsx';
import ShiftSection from './assets/panel/ShiftSection.jsx';
import ManualTicketSection from './assets/panel/ManualTicketSection.jsx';
import TimesSection from './assets/panel/TimesSection.jsx';
import KitchenSection from './assets/panel/KitchenSection.jsx';
import ReaderSection from './assets/panel/ReaderSection.jsx';
import ScreenSection from './assets/panel/ScreenSection.jsx';
import ScenesSection from './assets/panel/ScenesSection.jsx';

import LogSection from './assets/log/LogSection.jsx';
import Scoreboard from './assets/log/Scoreboard.jsx';
import LogActions from './assets/log/LogActions.jsx';
import SimulationTable from './assets/log/SimulationTable.jsx';
import InferenceTable from './assets/log/InferenceTable.jsx';


/*  ══════════════════════════════════════════════════════════════════════════════════════
 *  EL SIMULADOR DE TOAST — EL CONTROLADOR
 *
 *  Una tablet de cocina de mentira, en su propia ventana. Hace tres cosas:
 *
 *      1. PINTA la pantalla del expedidor de Toast, igual que la de verdad, y se la sirve a la
 *         ventana de la tablet cada vez que esta pide una «captura».
 *      2. SE COMPORTA como un restaurante en pleno turno: se ocupan mesas, cada una pide su
 *         entrada, su plato fuerte y su postre, la cocina los va marcando listos —unos en plazo y
 *         otros con demora— y el expedidor los despacha. Solo, o a mano tocando las tarjetas como
 *         en la tablet real. Y en medio de ese turno se puede meter un ticket hecho a mano y
 *         decidir uno mismo cuándo está listo y cuándo sale.
 *      3. APUNTA LA VERDAD —a qué hora entró y se despachó cada tarjeta, cuánto tardó en
 *         prepararse y si eso fue una demora— y la pone al lado de lo que la ventana de la tablet
 *         ha inferido leyendo la pantalla.
 *
 *  Lo tercero es la razón de ser de todo esto: con la tablet real nunca se sabe si la hora que
 *  salió en el register es la buena. Aquí sí.
 *
 *  Se abre desde el botón «Simular» de la ventana de la tablet, o a mano con '?view=toast-sim'.
 *
 *
 *  CÓMO ESTÁ HECHO
 *
 *  Todo empieza aquí. Este archivo no pinta nada por su cuenta ni sabe hacer nada por su cuenta:
 *  junta las piezas y dice qué pasa cuando se pulsa cada cosa.
 *
 *      hook/     LA LÓGICA. Cada hook se ocupa de UNA cosa y no sabe nada de las demás.
 *      assets/   LO QUE SE VE. Cada componente SOLO PINTA: recibe datos por props y avisa
 *                llamando a una función.
 *      motor/    la cocina de mentira (no sabe de React ni de pantallas)
 *      pintura/  cómo se dibuja la pantalla de Toast en el lienzo
 *
 *  Para cambiar CÓMO SE VE algo: está en el JSX de abajo, con su nombre; se abre su archivo.
 *  Para cambiar QUÉ HACE algo: se mira qué función recibe ese componente y de dónde sale.
 *
 *
 *  LA PANTALLA, DE ARRIBA ABAJO
 *
 *      SimulatorHeader   el título, cómo va la lectura de la IA, la tablet conectada y el reloj
 *      ScreenArea        el mando de empezar, los avisos y la pantalla de Toast
 *      ControlPanel      a la derecha: el turno, el ticket a mano, los tiempos, la cocina…
 *      LogSection        debajo de todo: la verdad frente a lo inferido, en dos tablas
 *  ══════════════════════════════════════════════════════════════════════════════════════ */



export function SimulatorController() {


    //  ── 1 · LAS PIEZAS ────────────────────────────────────────────────────────────────

    const settings = useSettings();                      //  los ajustes: de fábrica + lo guardado; se guardan solos
    const engine = useEngine(settings.values);           //  el motor: la cocina de mentira
    const screen = useScreen({ engine, settings });      //  la pantalla de Toast: pintarla, sus páginas, el latido y los toques

    //  El cable con la ventana de la tablet: le sirve la pantalla y la hora, y recibe lo que infiere.
    const link = useTabletLink({ engine, settingsRef: settings.ref, paint: screen.paint, canvasRef: screen.canvasRef });

    //  La verdad frente a lo inferido, y cómo se exporta.
    const { comparison, exportLog } = useComparison({ engine, heartbeat: screen.heartbeat, inference: link.inference, settings });

    // started = «¿se ha pulsado ya «Empezar» en esta sesión?». Hasta entonces la pantalla está en blanco a
    // propósito. No se guarda: cada vez que se abre el simulador se empieza de cero (ver readSettings).
    const [started, setStarted] = useState(Boolean(INITIAL_SCENE));

    const { values, change } = settings;
    const { refresh, showPage, turnPage } = screen;



    //  ── LO QUE PASA CUANDO… ───────────────────────────────────────────────────────────


    /*  …se pulsa «Empezar» (o «Seguir»): se abre la puerta y entran mesas y pedidos para llevar. La
     *  PRIMERA vez además pone el turno a cero, para que sus ocho horas cuenten desde ese momento y no
     *  desde que se abrió la ventana. Las siguientes solo reanuda.
     */
    const start = () => {
        if (!started) engine.reiniciarTurno?.();
        setStarted(true);
        change({ turnoEnMarcha: true });
        refresh();
    };

    //  …se deja de recibir: no entra nadie más, pero lo que ya está en cocina sigue hasta despacharse
    //  — como un restaurante que deja de sentar gente.
    const stopReceiving = () => { change({ turnoEnMarcha: false }); refresh(); };

    //  …se empieza otro turno, cuando el anterior ya terminó.
    const newShift = () => { engine.reiniciarTurno?.(); change({ turnoEnMarcha: true }); refresh(); };

    //  …se reinicia el turno desde el panel: la cuenta de mesas a cero, sin tocar ni el registro ni la pantalla.
    const restartShift = () => { engine.reiniciarTurno?.(); refresh(); };

    //  …se mete una mesa o un pedido para llevar ahora mismo.
    const createOrder = (type) => { engine.crearOrden(type); refresh(); };

    //  …se despacha todo, o se vacía la pantalla.
    const dispatchAll = () => { engine.despacharTodo(); refresh(); };
    const emptyScreen = () => { engine.vaciar(); refresh(); };


    /*  …se carga una escena. Quien para la simulación es este controlador, no la escena: así el aviso
     *  de la cocina en manual y el mando de «Empezar» salen del mismo sitio que todo lo demás. Y una
     *  escena es la foto de UNA pantalla, la primera: se vuelve a ella.
     *
     *  Con useCallback, para que la sección de escenas ('memo') no se repinte por su culpa.
     */
    const loadScene = useCallback((id) => {
        const requested = cargarEscena(engine, id);
        if (requested) change(sceneRequest(requested));
        showPage(0);
    }, [engine, change, showPage]);


    //  …se limpia el registro: se quitan las tarjetas que ya no están en pantalla.
    const clearLog = useCallback(() => { engine.borrarRegistro(); refresh(); }, [engine, refresh]);

    //  …se pulsa un botón de una fila del registro. Hacen lo mismo que un toque en la pantalla, pero sin
    //  tener que dar con la tarjeta —que a lo mejor está tres páginas a la derecha—, y tras cada uno se
    //  repinta sin esperar al latido. Van en un objeto que no cambia para que la tabla, que es 'memo',
    //  no se redibuje por su culpa.
    const cardActions = useMemo(() => ({
        disparar: (id) => { engine.dispararTarjeta(id); refresh(); },
        lista: (id) => { engine.marcarLista(id); refresh(); },
        despachar: (id) => { engine.despacharTarjeta(id); refresh(); },
    }), [engine, refresh]);

    //  Los tiempos máximos, en un objeto que solo cambia cuando cambia alguno: el formulario del ticket
    //  a mano ('memo') los enseña y no tiene por qué repintarse con los demás ajustes.
    const limits = useMemo(() => ({
        limiteEntradaMin: values.limiteEntradaMin,
        limiteFuerteMin: values.limiteFuerteMin,
        limitePostreMin: values.limitePostreMin,
    }), [values.limiteEntradaMin, values.limiteFuerteMin, values.limitePostreMin]);



    //  ── LA PANTALLA ───────────────────────────────────────────────────────────────────

    //  '?solo=pantalla': el lienzo y nada más.
    if (SCREEN_ONLY) return <BareScreen ref={screen.canvasRef} onTap={screen.tap} />;

    const shift = readShift(engine);
    const reading = describeLastReading(link.inference, link.alive);

    // stopped = «la simulación está parada»: no entran tickets, o la cocina va a mano
    const stopped = !values.turnoEnMarcha || !values.autoCocina;

    return (
        <SimulatorFrame>

            <SimulatorHeader>
                <AiReadingStatus reading={reading} />
                <TabletLinkStatus alive={link.alive} captures={link.captures} />
                <TabletClock time={engine.reloj()} />
            </SimulatorHeader>


            <SimulatorBody>

                <ScreenArea>

                    {/*  Con una escena cargada —o un ticket hecho a mano— la pantalla ya no está en blanco
                         aunque nadie haya pulsado «Empezar»: el mando no debe decirlo.  */}
                    <SimulationControl
                        started={started || engine.visibles().length > 0}
                        receiving={values.turnoEnMarcha}
                        shift={shift}
                        tabletAlive={link.alive}
                        inference={link.inference}
                        onStart={start}
                        onStopReceiving={stopReceiving}
                    />

                    {!values.autoCocina && <ManualKitchenBanner onAutoCook={() => change({ autoCocina: true })} />}

                    {!stopped && shift.terminado && <ShiftOverBanner rotations={shift.rotacionesDelTurno} onNewShift={newShift} />}

                    <TabletCanvas ref={screen.canvasRef} onTap={screen.tap} />

                </ScreenArea>


                <ControlPanel>

                    <ShiftSection
                        settings={values}
                        change={change}
                        shift={shift}
                        started={started}
                        onStart={start}
                        onStopReceiving={stopReceiving}
                        onRestartShift={restartShift}
                        canRestartShift={typeof engine.reiniciarTurno === 'function'}
                        onCreateOrder={createOrder}
                    />

                    <ManualTicketSection engine={engine} refresh={refresh} theme={values.tema} limits={limits} />

                    <TimesSection settings={values} change={change} />

                    <KitchenSection settings={values} change={change} onDispatchAll={dispatchAll} onEmptyScreen={emptyScreen} />

                    <ReaderSection reading={reading} />

                    <ScreenSection settings={values} change={change} page={screen.page} turnPage={turnPage} />

                    <ScenesSection onLoadScene={loadScene} />

                </ControlPanel>

            </SimulatorBody>


            {/*  Los marcadores y las dos tablas SOLO SE REPINTAN CUANDO CAMBIA ALGUNA DE SUS PROPS ('memo'):
                 la comparación cambia con el latido, una vez por segundo como mucho. Por eso aquí no se
                 les pasa ninguna función escrita en línea ni ningún objeto armado en el sitio.  */}
            <LogSection
                tools={<>
                    <Scoreboard summary={comparison.resumen} shift={comparison.turno} hasInference={Boolean(link.inference)} toleranceS={values.toleranciaS} />
                    <LogActions toleranceS={values.toleranciaS} onToleranceChange={seconds => change({ toleranciaS: seconds })} empty={comparison.filas.length === 0} onExport={exportLog} onClear={clearLog} />
                </>}
            >
                <SimulationTable rows={comparison.filas} stopped={stopped} actions={cardActions} />
                <InferenceTable rows={comparison.tabla2} summary={comparison.resumen} hasInference={Boolean(link.inference)} toleranceS={values.toleranciaS} />
            </LogSection>

        </SimulatorFrame>
    );
}
