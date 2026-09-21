import { fuente } from './temas.js';
import { estadoDeCabecera, anchoDeFicha } from './maquetar.js';




/*  ─────────────────────────────────────────────────────────────────────────────
 *  PINTAR LA PANTALLA DE TOAST EN UN LIENZO
 *
 *  Se dibuja en un <canvas> y no con HTML por una razón concreta: lo que se ve aquí
 *  tiene que ser, píxel a píxel, lo que recibe la ventana de la tablet como si fuera
 *  su 'screencap'. De un lienzo sale un PNG exacto en un par de milisegundos; de un
 *  trozo de HTML hay que fotografiarlo con una librería, que tarda cien veces más y no
 *  siempre pinta lo mismo que el navegador.
 *
 *  Todo se dibuja en las coordenadas de una tablet de 1024 px de ancho. Si el lienzo
 *  va a más resolución, quien llama ya le ha puesto la escala al contexto.
 *  ───────────────────────────────────────────────────────────────────────────── */




//  ── PIEZAS PEQUEÑAS ──────────────────────────────────────────────────────────

function rectangulo(ctx, x, y, ancho, alto, radio = 0) {
    ctx.beginPath();
    if (radio > 0 && ctx.roundRect) ctx.roundRect(x, y, ancho, alto, radio);
    else ctx.rect(x, y, ancho, alto);
}

//  'espaciado' separa las letras, en px. Los botones de la barra clara lo llevan; donde
//  el lienzo no lo admite (navegadores viejos) se pinta sin él y no pasa nada.
function texto(ctx, contenido, x, y, { css, color, alinear = 'left', espaciado = 0 }) {
    ctx.font = css;
    ctx.fillStyle = color;
    ctx.textAlign = alinear;
    ctx.textBaseline = 'alphabetic';

    if ('letterSpacing' in ctx) ctx.letterSpacing = `${espaciado}px`;
    ctx.fillText(contenido, x, y);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
}

function anchoDeTexto(ctx, contenido, css, espaciado = 0) {
    ctx.font = css;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${espaciado}px`;
    const ancho = ctx.measureText(contenido).width;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    return ancho;
}

//  Un texto que, si no cabe, se corta con puntos suspensivos.
function textoRecortado(ctx, contenido, x, y, anchoMax, estilo) {
    ctx.font = estilo.css;

    let visible = String(contenido);
    if (ctx.measureText(visible).width > anchoMax) {
        while (visible.length > 1 && ctx.measureText(`${visible}…`).width > anchoMax) visible = visible.slice(0, -1);
        visible = `${visible}…`;
    }

    texto(ctx, visible, x, y, estilo);
}

//  Palomita dentro de un círculo: el producto está hecho.
function palomita(ctx, cx, cy, radio, color) {
    ctx.beginPath();
    ctx.arc(cx, cy, radio, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx - radio * 0.45, cy + radio * 0.02);
    ctx.lineTo(cx - radio * 0.12, cy + radio * 0.38);
    ctx.lineTo(cx + radio * 0.48, cy - radio * 0.34);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1, radio * 0.22);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
}

//  Doble palomita: despachado también por el expedidor. Dos círculos pequeños que se
//  tocan, no uno grande partido: así sale en la tablet.
function doblePalomita(ctx, cx, cy, radio, separacion, color) {
    palomita(ctx, cx - separacion / 2, cy, radio, color);
    palomita(ctx, cx + separacion / 2, cy, radio, color);
}

function lineaDiscontinua(ctx, x1, x2, y, color, grosor = 1.5, trazos = [5, 4]) {
    ctx.save();
    ctx.setLineDash(trazos);
    ctx.strokeStyle = color;
    ctx.lineWidth = grosor;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
    ctx.restore();
}




//  ── ICONOS DE LAS BARRAS ─────────────────────────────────────────────────────

function flechaAtras(ctx, cx, cy, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + 8, cy);
    ctx.lineTo(cx - 8, cy);
    ctx.moveTo(cx - 1, cy - 7);
    ctx.lineTo(cx - 8, cy);
    ctx.lineTo(cx - 1, cy + 7);
    ctx.stroke();
}

function iconoLista(ctx, cx, cy, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (const dy of [-6, 0, 6]) {
        ctx.beginPath(); ctx.arc(cx - 8, cy + dy, 1.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx - 3, cy + dy); ctx.lineTo(cx + 9, cy + dy); ctx.stroke();
    }
}

//  La de la vista clara: cuatro renglones finos con su punto delante.
function iconoListaFina(ctx, cx, cy, color) {
    ctx.fillStyle = color;
    for (const dy of [-8.5, -3.5, 1.5, 6.5]) {
        ctx.fillRect(cx - 10, cy + dy, 2.5, 2);
        ctx.fillRect(cx - 5, cy + dy, 15, 2);
    }
}

function iconoReloj(ctx, cx, cy, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - 5); ctx.lineTo(cx, cy); ctx.lineTo(cx + 4, cy + 2); ctx.stroke();
}

function iconoRecuperar(ctx, cx, cy, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 9, cy - 2);
    ctx.lineTo(cx + 3, cy - 2);
    ctx.arc(cx + 3, cy + 3, 5, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(cx - 5, cy + 8);
    ctx.moveTo(cx - 5, cy - 6);
    ctx.lineTo(cx - 9, cy - 2);
    ctx.lineTo(cx - 5, cy + 2);
    ctx.stroke();
}

//  El «Recuperar» de la vista clara: un recibo con el pie en zigzag y, asomando por
//  arriba a la izquierda, la flecha de volver.
function iconoRecibo(ctx, cx, cy, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    //  El recibo
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy - 5);
    ctx.lineTo(cx + 9, cy - 5);
    ctx.lineTo(cx + 9, cy + 11);
    ctx.lineTo(cx + 6, cy + 9);
    ctx.lineTo(cx + 3, cy + 11);
    ctx.lineTo(cx, cy + 9);
    ctx.lineTo(cx - 3, cy + 11);
    ctx.lineTo(cx - 3, cy + 1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + 1, cy); ctx.lineTo(cx + 6, cy);
    ctx.moveTo(cx + 1, cy + 4); ctx.lineTo(cx + 6, cy + 4);
    ctx.stroke();

    //  La flecha
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 5, 5.5, Math.PI * 0.5, Math.PI * 1.45);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy - 11); ctx.lineTo(cx - 3, cy - 10.5); ctx.lineTo(cx - 4.5, cy - 7);
    ctx.stroke();
}

/*  Los iconos de las fichas de la vista clara van SOLO PERFILADOS, en gris, no rellenos:
 *  tres figuritas en pirámide para los comensales, y un busto con la campana de
 *  servir al hombro para el mesero.
 */
function figurita(ctx, cx, cy, escala = 1) {
    ctx.beginPath(); ctx.arc(cx, cy - 2.6 * escala, 1.9 * escala, 0, Math.PI * 2); ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 3.2 * escala, cy + 4.2 * escala);
    ctx.lineTo(cx - 2.2 * escala, cy + 0.6 * escala);
    ctx.lineTo(cx + 2.2 * escala, cy + 0.6 * escala);
    ctx.lineTo(cx + 3.2 * escala, cy + 4.2 * escala);
    ctx.closePath();
    ctx.stroke();
}

function iconoPersonasPerfilado(ctx, cx, cy, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.1;
    ctx.lineJoin = 'round';
    figurita(ctx, cx, cy - 3.2);
    figurita(ctx, cx - 3.6, cy + 3.4);
    figurita(ctx, cx + 3.6, cy + 3.4);
}

function iconoMeseroPerfilado(ctx, cx, cy, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.3;
    ctx.lineJoin = 'round';

    //  El busto
    ctx.beginPath(); ctx.arc(cx - 4, cy - 2.5, 3, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 9, cy + 7);
    ctx.lineTo(cx - 9, cy + 5.5);
    ctx.quadraticCurveTo(cx - 9, cy + 2.2, cx - 4, cy + 2.2);
    ctx.quadraticCurveTo(cx + 1, cy + 2.2, cx + 1, cy + 5.5);
    ctx.lineTo(cx + 1, cy + 7);
    ctx.closePath();
    ctx.stroke();

    //  La campana de servir
    ctx.beginPath(); ctx.arc(cx + 5.5, cy - 1.5, 3.6, Math.PI, 0); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 5.5, cy - 5.1); ctx.lineTo(cx + 5.5, cy - 6.4); ctx.stroke();
}

function campana(ctx, cx, cy, avisos, clara = false) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 32, 0, Math.PI * 2); ctx.fillStyle = '#e9ce01'; ctx.fill();
    ctx.restore();

    //  La campana
    ctx.fillStyle = clara ? '#8b7b00' : '#6f6200';
    ctx.beginPath();
    ctx.moveTo(cx - 17, cy + 13);
    ctx.lineTo(cx - 13, cy + 8);
    ctx.lineTo(cx - 13, cy - 3);
    ctx.quadraticCurveTo(cx - 13, cy - 17, cx, cy - 18);
    ctx.quadraticCurveTo(cx + 13, cy - 17, cx + 13, cy - 3);
    ctx.lineTo(cx + 13, cy + 8);
    ctx.lineTo(cx + 17, cy + 13);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy + 16, 4, 0, Math.PI); ctx.fill();

    if (avisos <= 0) return;

    const cifra = String(Math.min(999, avisos));

    if (!clara) {
        ctx.beginPath(); ctx.arc(cx + 20, cy - 22, 15, 0, Math.PI * 2); ctx.fillStyle = '#f53655'; ctx.fill();
        texto(ctx, cifra, cx + 20, cy - 17, { css: fuente(14, 700), color: '#ffffff', alinear: 'center' });
        return;
    }

    //  En la clara el globo es una píldora que crece hacia la izquierda con la cifra y
    //  llega hasta el borde de la pantalla.
    const anchoGlobo = Math.max(26, anchoDeTexto(ctx, cifra, fuente(15, 700)) + 15);
    const derecha = cx + 37;

    rectangulo(ctx, derecha - anchoGlobo, cy - 37, anchoGlobo, 26, 13);
    ctx.fillStyle = '#f53655';
    ctx.fill();
    texto(ctx, cifra, derecha - anchoGlobo / 2, cy - 18.5, { css: fuente(15, 700), color: '#ffffff', alinear: 'center' });
}




//  ── LAS BARRAS ───────────────────────────────────────────────────────────────

function barraDeEstado(ctx, tema, hora) {
    const oscura = tema.id === 'oscura';
    const tinta = oscura ? '#ffffff' : '#585858';

    ctx.fillStyle = oscura ? '#000000' : tema.fondo;
    ctx.fillRect(0, 0, tema.ancho, 24);

    texto(ctx, hora.slice(0, 5), 16, 17, { css: fuente(13, oscura ? 700 : 500), color: tinta });

    //  Dos iconillos junto a la hora, como en la tablet.
    ctx.strokeStyle = tinta;
    ctx.fillStyle = tinta;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(70, 12, 5, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(70, 12, 2, 0, Math.PI * 2); ctx.fill();
    rectangulo(ctx, 90, 7, 10, 10, 2); ctx.fill();

    //  Wifi y batería, a la derecha.
    const x = tema.ancho - 60;
    ctx.beginPath(); ctx.moveTo(x, 8); ctx.lineTo(x + 14, 8); ctx.lineTo(x + 7, 18); ctx.closePath(); ctx.fill();
    rectangulo(ctx, x + 26, 6, 9, 13, 1.5); ctx.fill();
    ctx.fillRect(x + 28.5, 4, 4, 2);
}


function barraOscura(ctx, tema, estado, zonas) {
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 24, tema.ancho, 64);

    flechaAtras(ctx, 36, 56, '#ffffff');
    texto(ctx, tema.estacion, 80, 62, { css: fuente(18, 700), color: '#ffffff' });

    const estilo = { css: fuente(14, 700), color: '#ffffff' };

    iconoLista(ctx, 472, 56, '#ffffff');
    texto(ctx, estado.vistaTotal ? 'HIDE ALL DAY VIEW' : tema.textos.vistaTotal, 493, 61, estilo);
    zonas.push({ x: 455, y: 24, ancho: 180, alto: 64, accion: 'vistaTotal' });

    iconoReloj(ctx, 664, 56, '#ffffff');
    texto(ctx, estado.recientesVisibles ? tema.textos.recientesOcultar : tema.textos.recientesMostrar, 682, 61, estilo);
    zonas.push({ x: 645, y: 24, ancho: 225, alto: 64, accion: 'recientes' });

    iconoRecuperar(ctx, 895, 55, '#ffffff');
    texto(ctx, tema.textos.recuperar, 913, 61, estilo);
    zonas.push({ x: 878, y: 24, ancho: 80, alto: 64, accion: 'recuperar' });
}


/*  La barra de la vista clara. Hay dos, y no por el idioma sino por la tablet:
 *
 *      «Expo - 2»     (768 de alto) tres botones desde x=225, la campana arriba a la
 *                     derecha tapando el hueco que dejan
 *      «Bar - Doral»  (600 de alto) bajo el nombre de la estación, en gris, los tipos de
 *                     pedido que recibe; los botones más a la derecha, un menú de tres
 *                     puntos donde la otra lleva la campana, y la campana abajo,
 *                     montada sobre el contador de tickets
 */
function barraClara(ctx, tema, estado, zonas) {
    const tinta = '#252525';
    const compacta = tema.variante === 'bar';

    flechaAtras(ctx, 36, 56, tinta);

    if (compacta) {
        texto(ctx, tema.estacion, 80, 53, { css: fuente(20, 400), color: tinta, espaciado: 0.45 });
        textoRecortado(ctx, tema.subtitulo ?? '', 80, 76, 256, { css: fuente(16, 400), color: '#666666' });
    }
    else {
        texto(ctx, tema.estacion, 80, 63, { css: fuente(20, 400), color: tinta, espaciado: 0.45 });
    }

    const botones = compacta
        ? [
            { x: 358, ancho: 193, accion: 'vistaTotal', rotulo: tema.textos.vistaTotal, icono: iconoListaFina, activo: estado.vistaTotal },
            { x: 558, ancho: 239, accion: 'recientes',  rotulo: tema.textos.recientes,  icono: iconoReloj,     activo: estado.recientesVisibles },
            { x: 804, ancho: 137, accion: 'recuperar',  rotulo: tema.textos.recuperar,  icono: iconoRecibo,    activo: false },
        ]
        : [
            { x: 225, ancho: 207, accion: 'vistaTotal', rotulo: tema.textos.vistaTotal, icono: iconoListaFina, activo: estado.vistaTotal },
            { x: 439, ancho: 319, accion: 'recientes',  rotulo: tema.textos.recientes,  icono: iconoReloj,     activo: estado.recientesVisibles },
            { x: 765, ancho: 176, accion: 'recuperar',  rotulo: tema.textos.recuperar,  icono: iconoRecibo,    activo: false },
        ];

    const css = fuente(20, 500);
    const espaciado = 0.6;

    for (const boton of botones) {
        rectangulo(ctx, boton.x, 27, boton.ancho - 1, 58, 7);
        ctx.fillStyle = boton.activo ? tinta : tema.fondo;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = boton.activo ? '#101010' : '#666666';
        ctx.stroke();

        const color = boton.activo ? '#ffffff' : '#000000';

        const anchoTexto = anchoDeTexto(ctx, boton.rotulo, css, espaciado);
        const inicio = boton.x + (boton.ancho - anchoTexto - 32) / 2;

        boton.icono(ctx, inicio + 10, 56, color);
        texto(ctx, boton.rotulo, inicio + 32, 64, { css, color, espaciado });

        //  En español el rótulo es «Recientemente completados» y no cabe: la segunda
        //  palabra baja a un renglón que el botón corta casi entero. De ella solo
        //  asoman las puntas de la «l» y la «d», y así se ve en la tablet.
        if (boton.accion === 'recientes' && tema.textos.recientesSegundoRenglon) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(boton.x, 27, boton.ancho, 45);
            ctx.clip();
            texto(ctx, tema.textos.recientesSegundoRenglon, inicio + 32 + anchoTexto / 2, 86, { css, color, espaciado, alinear: 'center' });
            ctx.restore();
        }

        zonas.push({ x: boton.x, y: 27, ancho: boton.ancho, alto: 58, accion: boton.accion });
    }

    if (compacta) {
        ctx.fillStyle = '#666666';
        for (const cy of [45.5, 55.5, 65.5]) { ctx.beginPath(); ctx.arc(985.5, cy, 3, 0, Math.PI * 2); ctx.fill(); }
    }
}


function botonesDeAndroid(ctx, tema) {
    const y = tema.alto - 48;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, y, tema.ancho, 48);

    ctx.fillStyle = '#9e9e9e';
    const cy = y + 24;

    ctx.beginPath(); ctx.moveTo(390, cy - 8); ctx.lineTo(390, cy + 8); ctx.lineTo(376, cy); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(512, cy, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(633, cy - 7, 14, 14);
}


/*  «|←», «6 tickets», «→|». Es UNA pieza de tres casillas que comparten borde: el
 *  contorno redondeado va atenuado, la casilla del centro lleva siempre su marco
 *  oscuro, y cada flecha se enciende —marco y trazo— solo si hay adónde ir.
 *
 *  'hayAntes' y 'hayDespues': si quedan pantallas por ese lado (los calcula maquetar).
 *  «|←» vuelve a la pantalla anterior y «→|» pasa a la siguiente. El número del centro
 *  NO es lo que se ve: es el total de tickets, los de todas las pantallas, como en Toast.
 *
 *  Las dos flechas responden al toque SIEMPRE, encendidas o no: tocar la que está
 *  apagada no lleva a ningún sitio (no hay pantalla a ese lado), y así quien atiende el
 *  toque no tiene que saber cuál de las dos estaba encendida cuando se pintó.
 */
function contadorDeTickets(ctx, tema, total, zonas, { hayAntes = false, hayDespues = false } = {}) {
    const compacta = tema.variante === 'bar';

    const arriba = tema.alto - 71;
    const alto = 62;
    const x = compacta ? [744, 824, 935, 1015] : [750, 829, 935, 1014];

    const oscuro = '#666666';
    const apagado = '#cbcbcb';

    //  El contorno entero, atenuado.
    rectangulo(ctx, x[0], arriba, x[3] - x[0], alto, 7);
    ctx.lineWidth = 2;
    ctx.strokeStyle = apagado;
    ctx.stroke();

    const flecha = (desde, hasta, sentido, activa) => {
        if (activa) {
            //  Su mitad del contorno, en oscuro: redondeada por fuera, recta por dentro.
            ctx.save();
            ctx.beginPath(); ctx.rect(desde - 2, arriba - 2, hasta - desde + 2, alto + 4); ctx.clip();
            rectangulo(ctx, x[0], arriba, x[3] - x[0], alto, 7);
            ctx.strokeStyle = oscuro;
            ctx.stroke();
            ctx.restore();
        }

        const cx = (desde + hasta) / 2;
        const cy = arriba + alto / 2;

        //  «|←» y «→|»: la flecha contra su tope.
        ctx.strokeStyle = activa ? '#000000' : apagado;
        ctx.lineWidth = 2;
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';
        ctx.beginPath();
        ctx.moveTo(cx - 9 * sentido, cy); ctx.lineTo(cx + 11 * sentido, cy);
        ctx.moveTo(cx + 4 * sentido, cy - 7); ctx.lineTo(cx + 11 * sentido, cy); ctx.lineTo(cx + 4 * sentido, cy + 7);
        ctx.moveTo(cx + 14 * sentido, cy - 9); ctx.lineTo(cx + 14 * sentido, cy + 9);
        ctx.stroke();
    };

    flecha(x[0], x[1], -1, hayAntes);
    flecha(x[2], x[3], 1, hayDespues);

    zonas.push({ x: x[0], y: arriba, ancho: x[1] - x[0], alto, accion: 'paginaAnterior', activa: hayAntes });
    zonas.push({ x: x[2], y: arriba, ancho: x[3] - x[2], alto, accion: 'paginaSiguiente', activa: hayDespues });

    ctx.lineWidth = 2;
    ctx.strokeStyle = oscuro;
    ctx.strokeRect(x[1], arriba, x[2] - x[1], alto);

    texto(ctx, `${total} ${tema.textos.tickets}`, (x[1] + x[2]) / 2, arriba + 37.5, { css: fuente(20, 400), color: '#000000', alinear: 'center' });
}




//  ── LA VISTA «ALL DAY» ───────────────────────────────────────────────────────

export const ANCHO_VISTA_TOTAL = 256;

function vistaTotal(ctx, tema, conteo) {
    const arriba = tema.area.arriba - 3;
    const alto = tema.area.abajo - arriba;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, arriba, ANCHO_VISTA_TOTAL - 8, alto);

    ctx.fillStyle = tema.id === 'oscura' ? '#333333' : '#252525';
    ctx.fillRect(0, arriba, ANCHO_VISTA_TOTAL - 8, 40);
    texto(ctx, tema.textos.tituloVistaTotal, 14, arriba + 27, { css: fuente(18, 700), color: '#ffffff' });

    let y = arriba + 66;
    for (const [nombre, cantidad] of conteo) {
        if (y > arriba + alto - 10) break;
        texto(ctx, String(cantidad), 34, y, { css: fuente(17, 700), color: tema.tinta.texto, alinear: 'right' });
        textoRecortado(ctx, nombre, 46, y, ANCHO_VISTA_TOTAL - 64, { css: fuente(15), color: tema.tinta.texto });
        y += 26;
    }
}




//  ── LA CABECERA DE UNA TARJETA ───────────────────────────────────────────────

//  Un pedido con hora prometida la enseña donde los demás llevan el contador.
const arribaALaDerecha = (tarjeta, tema) =>
    (tarjeta.horaPrometida && tema.horaPrometidaEnCabecera ? tarjeta.horaPrometida : tarjeta.tiempoCabecera);


function cabeceraOscura(ctx, tema, tarjeta, x, y, ancho, fila, colores) {
    ctx.fillStyle = colores.fondo;
    ctx.fillRect(x, y, ancho, fila.alto);

    const izquierda = x + 7;
    const derecha = x + ancho - 7;

    const arribaDerecha = arribaALaDerecha(tarjeta, tema);

    const grande = tema.m.cabTituloPx;
    const pequena = tema.m.cabTextoPx;

    ctx.font = fuente(grande);
    const anchoHora = ctx.measureText(arribaDerecha).width;

    if (tarjeta.mesa !== null) {
        texto(ctx, tarjeta.textoMesa, izquierda, y + 26, { css: fuente(grande, 700), color: colores.texto });
        texto(ctx, `G/${tarjeta.comensales}`, x + 105, y + 26, { css: fuente(grande), color: colores.texto });
    }
    else {
        textoRecortado(ctx, tarjeta.cliente, izquierda, y + 25, ancho - 24 - anchoHora, { css: fuente(grande, 700), color: colores.texto });
    }

    texto(ctx, arribaDerecha, derecha, y + 26, { css: fuente(grande), color: colores.texto, alinear: 'right' });

    texto(ctx, tarjeta.textoNumero, izquierda, y + 49, { css: fuente(pequena), color: colores.texto });
    if (tarjeta.mesero) texto(ctx, tarjeta.mesero, derecha, y + 49, { css: fuente(pequena), color: colores.texto, alinear: 'right' });
}


/*  Una ficha de la cabecera clara. Las de mesa (gris muy claro, icono perfilado en gris
 *  y texto negro) no son iguales que las de pago (casi blancas, todo del color del
 *  estado): ni el fondo, ni el hueco del icono.
 */
function ficha(ctx, tema, x, y, contenido, { color, icono, deMesa }) {
    const { m } = tema;
    const ancho = anchoDeFicha(contenido, tema, (t, css) => { ctx.font = css; return ctx.measureText(t).width; }, deMesa);

    rectangulo(ctx, x, y, ancho, m.fichaAlto, 4);
    ctx.fillStyle = deMesa ? '#f0f0f0' : '#f7f7f7';
    ctx.fill();

    icono(ctx, x + (deMesa ? 14 : 13), y + m.fichaAlto / 2, deMesa ? '#555555' : color);
    texto(ctx, contenido, x + (deMesa ? 28 : 25.5), y + 19, { css: fuente(m.fichaPx), color });

    return ancho;
}

//  Círculo con palomita o con aspa, para PAGADO y NO PAGADO.
const iconoPagado = (pagado) => (ctx, cx, cy, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, 6.8, 0, Math.PI * 2); ctx.stroke();

    ctx.beginPath();
    if (pagado) { ctx.moveTo(cx - 3.3, cy + 0.2); ctx.lineTo(cx - 1, cy + 2.6); ctx.lineTo(cx + 3.4, cy - 2.4); }
    else { ctx.moveTo(cx - 2.2, cy - 2.2); ctx.lineTo(cx + 2.2, cy + 2.2); ctx.moveTo(cx + 2.2, cy - 2.2); ctx.lineTo(cx - 2.2, cy + 2.2); }
    ctx.stroke();
};


function cabeceraClara(ctx, tema, tarjeta, x, y, ancho, fila, colores) {
    const { m } = tema;

    ctx.fillStyle = colores.fondo;
    ctx.fillRect(x, y, ancho, fila.alto);

    const izquierda = x + 2;
    const derecha = x + ancho - 2;

    const arribaDerecha = arribaALaDerecha(tarjeta, tema);
    const anchoHora = anchoDeTexto(ctx, arribaDerecha, fuente(m.cabTextoPx));

    textoRecortado(ctx, tarjeta.mesa !== null ? tarjeta.textoMesa : tarjeta.textoNumero, izquierda, y + 22, ancho - 10 - anchoHora, {
        css: fuente(m.cabTituloPx, m.cabTituloPeso), color: colores.texto,
    });
    texto(ctx, arribaDerecha, derecha, y + 22, { css: fuente(m.cabTextoPx), color: colores.texto, alinear: 'right' });

    const tintaFicha = '#1a1a1a';

    if (tarjeta.mesa !== null) {
        texto(ctx, tarjeta.textoNumero, x + 6, y + 52, { css: fuente(m.cabTextoPx), color: colores.texto });

        const comensales = String(tarjeta.comensales ?? '');

        if (fila.fichasApiladas) {
            //  El mesero no cabe al lado de los comensales: las dos fichas se apilan a
            //  la derecha del número, que se queda donde estaba.
            const xFichas = x + 6 + anchoDeTexto(ctx, tarjeta.textoNumero, fuente(m.cabTextoPx)) + 8;
            ficha(ctx, tema, xFichas, y + 34, comensales, { color: tintaFicha, icono: iconoPersonasPerfilado, deMesa: true });
            ficha(ctx, tema, xFichas, y + 64, tarjeta.mesero ?? '', { color: tintaFicha, icono: iconoMeseroPerfilado, deMesa: true });
            return;
        }

        const anchoFicha = ficha(ctx, tema, x + 6, y + 64, comensales, { color: tintaFicha, icono: iconoPersonasPerfilado, deMesa: true });
        ficha(ctx, tema, x + 6 + anchoFicha + 4, y + 64, tarjeta.mesero ?? '', { color: tintaFicha, icono: iconoMeseroPerfilado, deMesa: true });
        return;
    }

    fila.lineasNombre.forEach((linea, i) => {
        texto(ctx, linea, izquierda, y + 56 + i * m.cabClienteLinea, { css: fuente(m.cabTextoPx), color: colores.texto });
    });

    if (tarjeta.pagado !== null && tarjeta.pagado !== undefined) {
        const rotulo = tarjeta.pagado ? tema.textos.pagado : tema.textos.noPagado;
        const anchoFicha = anchoDeFicha(rotulo, tema, (t, css) => { ctx.font = css; return ctx.measureText(t).width; }, false);

        ficha(ctx, tema, derecha - anchoFicha, y + 34, rotulo, { color: tarjeta.pagado ? tema.tinta.pagado : tema.tinta.noPagado, icono: iconoPagado(tarjeta.pagado), deMesa: false });
    }
}




//  ── UNA TARJETA (O UN TROZO DE ELLA) ─────────────────────────────────────────

function pintarFragmento(ctx, tema, fragmento, umbrales) {
    const { tarjeta, x, y, ancho, alto, filas } = fragmento;
    const { columna, m, tinta, cuerpo } = tema;

    const clara = tema.id === 'clara';

    const hecha = tarjeta.estado === 'lista' || tarjeta.estado === 'despachada';
    const fondoCuerpo = tarjeta.estado === 'despachada' ? cuerpo.despachada : tarjeta.estado === 'lista' ? cuerpo.lista : cuerpo.normal;

    //  En la vista clara, sobre el crema o el verde, los rojos pasan a tinta oscura.
    const atenuar = clara && hecha;

    //  El marco: verde si es de mesa, azul si es para llevar.
    rectangulo(ctx, x, y, ancho, alto, columna.radio);
    ctx.fillStyle = tarjeta.tipoOrden === 'mesa' ? tema.bordes.mesa : tema.bordes.llevar;
    ctx.fill();

    const ix = x + columna.borde;
    const iy = y + columna.borde;
    const iancho = ancho - 2 * columna.borde;
    const ialto = alto - 2 * columna.borde;

    ctx.save();
    rectangulo(ctx, ix, iy, iancho, ialto, Math.max(0, columna.radio - 4));
    ctx.clip();

    ctx.fillStyle = fondoCuerpo;
    ctx.fillRect(ix, iy, iancho, ialto);

    const centro = ix + iancho / 2;

    //  En la clara el letrero va en letra fina y grande, y su raya es de trazos largos.
    const letraContinua = { css: fuente(m.continuaPx, 400), color: tinta.continua, alinear: 'center' };

    if (fragmento.vieneDeArriba) {
        texto(ctx, tema.textos.viene, centro, iy + (clara ? 22 : 19), letraContinua);
        if (clara) lineaDiscontinua(ctx, ix + 2, ix + iancho - 2, iy + 35, tinta.continua, 2, [8, 4]);
    }

    for (const fila of filas) {

        if (fila.tipo === 'cabecera') {
            const colores = tema.cabecera[estadoDeCabecera(tarjeta, tema, umbrales)];
            (clara ? cabeceraClara : cabeceraOscura)(ctx, tema, tarjeta, ix, fila.y, iancho, fila, colores);
        }

        if (fila.tipo === 'recuperada') {
            texto(ctx, fila.texto, centro, fila.y + 17, { css: fuente(15, 700), color: tinta.fuego, alinear: 'center' });
        }

        if (fila.tipo === 'rotulo') {
            fila.lineas.forEach((linea, i) => {
                texto(ctx, linea, centro, fila.y + m.rotuloLinea * (i + 1) - m.rotuloLinea * (m.rotuloSube ?? 0.24), { css: fuente(m.rotuloPx, m.rotuloPeso ?? 700), color: tinta.rotulo, alinear: 'center' });
            });
        }

        if (fila.tipo === 'franja') {
            const margen = tema.franjaCentrada ? 2 : (m.franjaMargen ?? 0);

            ctx.fillStyle = hecha ? cuerpo.franjaHecha : cuerpo.franja;
            ctx.fillRect(ix + margen, fila.y, iancho - 2 * margen, fila.alto);

            texto(ctx, fila.texto, tema.franjaCentrada ? centro : ix + (m.franjaTextoX ?? 8), fila.y + fila.alto / 2 + m.franjaPx * 0.36, {
                css: fuente(m.franjaPx, tema.franjaCentrada ? 700 : 400),
                color: tinta.franja,
                alinear: tema.franjaCentrada ? 'center' : 'left',
            });
        }

        if (fila.tipo === 'fuego') {
            texto(ctx, fila.texto, centro, fila.y + fila.alto / 2 + m.fuegoPx * (m.fuegoCentro ?? 0.36), {
                css: fuente(m.fuegoPx, 700),
                color: atenuar ? tinta.texto : tinta.fuego,
                alinear: 'center',
            });
        }

        if (fila.tipo === 'item') pintarProducto(ctx, tema, tarjeta, fila, ix, atenuar);
    }

    if (fragmento.sigueAbajo) {
        const yPie = iy + ialto - m.continuaAlto;
        if (clara) lineaDiscontinua(ctx, ix + 2, ix + iancho - 2, yPie + 1, tinta.continua, 2, [8, 4]);
        texto(ctx, tema.textos.sigue, centro, iy + ialto - (clara ? 8 : 4), letraContinua);
    }

    ctx.restore();
}


function pintarProducto(ctx, tema, tarjeta, fila, ix, atenuar) {
    const { m, tinta } = tema;

    const clara = tema.id === 'clara';

    const cursiva = fila.retenido;
    const colorNombre = fila.retenido ? tinta.retenido : tinta.texto;
    const colorMod = atenuar ? tinta.texto : fila.retenido && !clara ? tinta.retenido : tinta.modificador;

    const despachada = tarjeta.estado === 'despachada';

    //  La palomita: centrada en el nombre en la vista oscura, en su primer renglón en
    //  la clara. Lo despachado en la clara lleva doble palomita.
    if (fila.hecho) {
        const cy = clara ? fila.y + (m.palomitaY ?? m.nombreLinea / 2) : fila.y + fila.altoNombre / 2;

        if (despachada && clara) doblePalomita(ctx, ix + m.palomitaX, cy, m.palomitaDobleRadio, m.palomitaDobleSeparacion, tinta.palomita);
        else palomita(ctx, ix + m.palomitaX, cy, m.palomitaRadio, tinta.palomita);
    }

    //  La cantidad. En la vista clara, más de uno va en rojo y negrita.
    const varios = clara && fila.cantidad > 1 && !atenuar;
    const descenso = m.nombreDescenso ?? 6;

    texto(ctx, String(fila.cantidad), ix + m.cantidadX, fila.y + m.nombreLinea - descenso, {
        css: fuente(m.nombrePx, varios ? 700 : 400, cursiva),
        color: varios ? tinta.modificador : colorNombre,
        alinear: 'center',
    });

    fila.lineasNombre.forEach((linea, i) => {
        texto(ctx, linea, ix + m.nombreX, fila.y + m.nombreLinea * (i + 1) - descenso, { css: fuente(m.nombrePx, 400, cursiva), color: colorNombre });
    });

    let y = fila.y + fila.altoNombre + m.trasNombre;

    for (const mod of fila.mods) {
        if (fila.hecho && clara) {
            const cx = ix + m.modX - m.palomitaModX;
            const cy = y + m.palomitaModY;

            if (despachada) doblePalomita(ctx, cx, cy, m.palomitaModDobleRadio, m.palomitaModDobleRadio * 2, tinta.palomita);
            else palomita(ctx, cx, cy, m.palomitaModRadio, tinta.palomita);
        }

        mod.lineas.forEach((linea, i) => {
            texto(ctx, linea, ix + m.modX, y + m.modLinea * (i + 1) - (m.modDescenso ?? 5), { css: fuente(m.modPx, 400, m.modCursiva || cursiva), color: colorMod });
        });

        y += mod.lineas.length * m.modLinea + m.entreMods;
    }
}




//  ── LA PANTALLA ENTERA ───────────────────────────────────────────────────────

/**
 * @param {CanvasRenderingContext2D} ctx   ya escalado a la resolución del lienzo
 * @param {object} que
 * @param {object} que.tema
 * @param {object} que.maqueta            lo que devolvió maquetar()
 * @param {object} que.estado             { hora, avisos, recientesVisibles, vistaTotal, totalTickets, conteo }
 * @param {object} que.umbrales           { amarilloS, rojoS }
 * @returns {Array} las zonas de las barras que responden a un toque: { x, y, ancho, alto, accion },
 *                  con accion 'vistaTotal' | 'recientes' | 'recuperar' y, en la vista clara, las
 *                  dos flechas del contador: 'paginaAnterior' | 'paginaSiguiente' (con 'activa')
 */
export function pintarPantalla(ctx, { tema, maqueta, estado, umbrales }) {
    const zonas = [];

    ctx.fillStyle = tema.fondo;
    ctx.fillRect(0, 0, tema.ancho, tema.alto);

    if (estado.vistaTotal) vistaTotal(ctx, tema, estado.conteo ?? []);

    for (const fragmento of maqueta.fragmentos) pintarFragmento(ctx, tema, fragmento, umbrales);

    //  Las barras van DESPUÉS de las tarjetas: nada las pisa.
    barraDeEstado(ctx, tema, estado.hora);

    if (tema.id === 'oscura') {
        barraOscura(ctx, tema, estado, zonas);
        botonesDeAndroid(ctx, tema);

        //  La campana de avisos de Toast, que en la tablet de verdad tapa el último botón.
        campana(ctx, tema.ancho - 38, 62, estado.avisos);
    }
    else {
        barraClara(ctx, tema, estado, zonas);

        //  Lo que no cabe en esta pantalla está en otra: a la derecha se va con «→|» y a
        //  la izquierda se vuelve con «|←». La vista oscura no lleva contador, así que en
        //  ella solo se pasa de pantalla desde el panel del simulador.
        contadorDeTickets(ctx, tema, estado.totalTickets, zonas, { hayAntes: maqueta.hayAntes === true, hayDespues: maqueta.hayDespues === true });

        //  En las tablets de 600 de alto la campana va abajo, montada sobre el contador: tapa
        //  «→|», como en la captura. Aquí el toque llega igual al botón de debajo; la
        //  campana del simulador es solo un dibujo.
        campana(ctx, tema.ancho - 38, tema.variante === 'bar' ? tema.alto - 63 : 62, estado.avisos, true);
    }

    return zonas;
}
