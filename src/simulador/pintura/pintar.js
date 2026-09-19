import { fuente } from './temas.js';
import { estadoDeCabecera } from './maquetar.js';




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

function texto(ctx, contenido, x, y, { css, color, alinear = 'left' }) {
    ctx.font = css;
    ctx.fillStyle = color;
    ctx.textAlign = alinear;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(contenido, x, y);
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
    ctx.lineWidth = Math.max(1.4, radio * 0.26);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
}

//  Doble palomita: despachado también por el expedidor.
function doblePalomita(ctx, cx, cy, radio, color) {
    palomita(ctx, cx - radio * 0.55, cy, radio * 0.82, color);
    palomita(ctx, cx + radio * 0.55, cy, radio * 0.82, color);
}

function lineaDiscontinua(ctx, x1, x2, y, color) {
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
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

function iconoPersonas(ctx, cx, cy, color) {
    ctx.fillStyle = color;
    for (const [dx, r] of [[-5, 2.4], [5, 2.4], [0, 3]]) {
        ctx.beginPath(); ctx.arc(cx + dx, cy - 3, r, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + dx, cy + 5, r + 1.6, 3.4, 0, Math.PI, 0); ctx.fill();
    }
}

function iconoMesero(ctx, cx, cy, color) {
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(cx - 3, cy - 3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx - 3, cy + 6, 5, 4, 0, Math.PI, 0); ctx.fill();
    //  La bandeja
    ctx.beginPath(); ctx.moveTo(cx + 2, cy - 1); ctx.lineTo(cx + 9, cy - 1); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 5.5, cy - 1, 3, Math.PI, 0); ctx.stroke();
}

function campana(ctx, cx, cy, avisos) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 32, 0, Math.PI * 2); ctx.fillStyle = '#e9ce01'; ctx.fill();
    ctx.restore();

    //  La campana
    ctx.fillStyle = '#6f6200';
    ctx.beginPath();
    ctx.moveTo(cx - 13, cy + 10);
    ctx.quadraticCurveTo(cx - 9, cy + 4, cx - 9, cy - 4);
    ctx.quadraticCurveTo(cx - 9, cy - 15, cx, cy - 16);
    ctx.quadraticCurveTo(cx + 9, cy - 15, cx + 9, cy - 4);
    ctx.quadraticCurveTo(cx + 9, cy + 4, cx + 13, cy + 10);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy + 14, 4, 0, Math.PI); ctx.fill();

    if (avisos > 0) {
        ctx.beginPath(); ctx.arc(cx + 20, cy - 22, 15, 0, Math.PI * 2); ctx.fillStyle = '#f53655'; ctx.fill();
        texto(ctx, String(Math.min(999, avisos)), cx + 20, cy - 17, { css: fuente(14, 700), color: '#ffffff', alinear: 'center' });
    }
}




//  ── LAS BARRAS ───────────────────────────────────────────────────────────────

function barraDeEstado(ctx, tema, hora) {
    const oscura = tema.id === 'oscura';
    const tinta = oscura ? '#ffffff' : '#3a3a3a';

    ctx.fillStyle = oscura ? '#000000' : tema.fondo;
    ctx.fillRect(0, 0, tema.ancho, 24);

    texto(ctx, hora.slice(0, 5), 16, 17, { css: fuente(13, 700), color: tinta });

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


function barraClara(ctx, tema, estado, zonas) {
    const tinta = '#252525';

    flechaAtras(ctx, 36, 56, tinta);
    texto(ctx, tema.estacion, 80, 62, { css: fuente(18, 500), color: tinta });

    const botones = [
        { x: 225, ancho: 206, accion: 'vistaTotal', rotulo: tema.textos.vistaTotal, icono: iconoLista,     activo: estado.vistaTotal },
        { x: 439, ancho: 318, accion: 'recientes',  rotulo: tema.textos.recientes,  icono: iconoReloj,     activo: estado.recientesVisibles },
        { x: 765, ancho: 175, accion: 'recuperar',  rotulo: tema.textos.recuperar,  icono: iconoRecuperar, activo: false },
    ];

    for (const boton of botones) {
        rectangulo(ctx, boton.x, 27, boton.ancho, 60, 6);
        ctx.fillStyle = boton.activo ? tinta : tema.fondo;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = tinta;
        ctx.stroke();

        const color = boton.activo ? '#ffffff' : tinta;

        ctx.font = fuente(20, 500);
        const anchoTexto = ctx.measureText(boton.rotulo).width;
        const inicio = boton.x + (boton.ancho - anchoTexto - 30) / 2;

        boton.icono(ctx, inicio + 10, 57, color);
        texto(ctx, boton.rotulo, inicio + 30, 64, { css: fuente(20, 500), color });

        zonas.push({ x: boton.x, y: 27, ancho: boton.ancho, alto: 60, accion: boton.accion });
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


function contadorDeTickets(ctx, tema, total) {
    const y = tema.alto - 72;
    const tinta = '#252525';
    const apagado = '#c4c4c4';

    const celdas = [
        { x: 748, ancho: 79,  activo: false, flecha: -1 },
        { x: 829, ancho: 107, activo: true,  rotulo: `${total} ${tema.textos.tickets}` },
        { x: 938, ancho: 78,  activo: false, flecha: 1 },
    ];

    for (const celda of celdas) {
        rectangulo(ctx, celda.x, y, celda.ancho, 64, 3);
        ctx.fillStyle = tema.fondo;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = celda.activo ? tinta : apagado;
        ctx.stroke();

        const cx = celda.x + celda.ancho / 2;
        const cy = y + 32;

        if (celda.rotulo) {
            texto(ctx, celda.rotulo, cx, cy + 7, { css: fuente(19, 500), color: tinta, alinear: 'center' });
            continue;
        }

        //  «|←» y «→|»: ir al primer ticket y al último.
        ctx.strokeStyle = apagado;
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - 10 * celda.flecha, cy); ctx.lineTo(cx + 8 * celda.flecha, cy);
        ctx.moveTo(cx + 2 * celda.flecha, cy - 6); ctx.lineTo(cx + 8 * celda.flecha, cy); ctx.lineTo(cx + 2 * celda.flecha, cy + 6);
        ctx.moveTo(cx + 12 * celda.flecha, cy - 8); ctx.lineTo(cx + 12 * celda.flecha, cy + 8);
        ctx.stroke();
    }
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

function cabeceraOscura(ctx, tema, tarjeta, x, y, ancho, fila, colores) {
    ctx.fillStyle = colores.fondo;
    ctx.fillRect(x, y, ancho, fila.alto);

    const izquierda = x + 7;
    const derecha = x + ancho - 7;

    //  Un pedido online enseña su hora prometida donde los demás llevan el contador.
    const arribaDerecha = tarjeta.horaPrometida && tema.horaPrometidaEnCabecera ? tarjeta.horaPrometida : tarjeta.tiempoCabecera;

    ctx.font = fuente(18);
    const anchoHora = ctx.measureText(arribaDerecha).width;

    if (tarjeta.mesa !== null) {
        texto(ctx, tarjeta.textoMesa, izquierda, y + 25, { css: fuente(18, 700), color: colores.texto });
        texto(ctx, `G/${tarjeta.comensales}`, x + 105, y + 25, { css: fuente(18), color: colores.texto });
    }
    else {
        textoRecortado(ctx, tarjeta.cliente, izquierda, y + 25, ancho - 24 - anchoHora, { css: fuente(18, 700), color: colores.texto });
    }

    texto(ctx, arribaDerecha, derecha, y + 25, { css: fuente(18), color: colores.texto, alinear: 'right' });

    texto(ctx, tarjeta.textoNumero, izquierda, y + 48, { css: fuente(14), color: colores.texto });
    if (tarjeta.mesero) texto(ctx, tarjeta.mesero, derecha, y + 48, { css: fuente(14), color: colores.texto, alinear: 'right' });
}


function ficha(ctx, x, y, contenido, { color, icono }) {
    ctx.font = fuente(15);
    const ancho = ctx.measureText(contenido).width + 12 + (icono ? 20 : 0);

    rectangulo(ctx, x, y, ancho, 25, 4);
    ctx.fillStyle = '#f7f7f7';
    ctx.fill();

    if (icono) icono(ctx, x + 14, y + 12.5, color);
    texto(ctx, contenido, x + 6 + (icono ? 20 : 0), y + 18, { css: fuente(15), color });

    return ancho;
}

//  Círculo con palomita o con aspa, para PAGADO y NO PAGADO.
const iconoPagado = (pagado) => (ctx, cx, cy, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.stroke();

    ctx.beginPath();
    if (pagado) { ctx.moveTo(cx - 3.5, cy); ctx.lineTo(cx - 1, cy + 3); ctx.lineTo(cx + 3.5, cy - 3); }
    else { ctx.moveTo(cx - 3, cy - 3); ctx.lineTo(cx + 3, cy + 3); ctx.moveTo(cx + 3, cy - 3); ctx.lineTo(cx - 3, cy + 3); }
    ctx.stroke();
};


function cabeceraClara(ctx, tema, tarjeta, x, y, ancho, fila, colores) {
    ctx.fillStyle = colores.fondo;
    ctx.fillRect(x, y, ancho, fila.alto);

    const izquierda = x + 6;
    const derecha = x + ancho - 5;

    texto(ctx, tarjeta.mesa !== null ? tarjeta.textoMesa : tarjeta.textoNumero, izquierda, y + 22, { css: fuente(20, 700), color: colores.texto });
    texto(ctx, tarjeta.tiempoCabecera, derecha, y + 22, { css: fuente(18), color: colores.texto, alinear: 'right' });

    if (tarjeta.mesa !== null) {
        texto(ctx, tarjeta.textoNumero, izquierda + 2, y + 51, { css: fuente(20), color: colores.texto });

        const anchoFicha = ficha(ctx, izquierda + 2, y + 64, String(tarjeta.comensales), { color: tema.tinta.texto, icono: iconoPersonas });
        ficha(ctx, izquierda + 2 + anchoFicha + 4, y + 64, tarjeta.mesero, { color: tema.tinta.texto, icono: iconoMesero });
        return;
    }

    fila.lineasNombre.forEach((linea, i) => {
        texto(ctx, linea, izquierda + 2, y + 52 + i * 25, { css: fuente(18), color: colores.texto });
    });

    if (tarjeta.pagado !== null) {
        const rotulo = tarjeta.pagado ? tema.textos.pagado : tema.textos.noPagado;
        ctx.font = fuente(15);
        const anchoFicha = ctx.measureText(rotulo).width + 32;
        ficha(ctx, derecha - anchoFicha - 2, y + 34, rotulo, { color: tarjeta.pagado ? tema.tinta.pagado : tema.tinta.noPagado, icono: iconoPagado(tarjeta.pagado) });
    }
}




//  ── UNA TARJETA (O UN TROZO DE ELLA) ─────────────────────────────────────────

function pintarFragmento(ctx, tema, fragmento, umbrales) {
    const { tarjeta, x, y, ancho, alto, filas } = fragmento;
    const { columna, m, tinta, cuerpo } = tema;

    const hecha = tarjeta.estado === 'lista' || tarjeta.estado === 'despachada';
    const fondoCuerpo = tarjeta.estado === 'despachada' ? cuerpo.despachada : tarjeta.estado === 'lista' ? cuerpo.lista : cuerpo.normal;

    //  En la vista clara, sobre el crema o el verde, los rojos pasan a tinta oscura.
    const atenuar = tema.id === 'clara' && hecha;

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

    if (fragmento.vieneDeArriba) {
        texto(ctx, tema.textos.viene, centro, iy + 20, { css: fuente(m.continuaPx, tema.id === 'clara' ? 500 : 400), color: tinta.continua, alinear: 'center' });
        if (tema.id === 'clara') lineaDiscontinua(ctx, ix, ix + iancho, iy + m.continuaAlto - 4, tinta.continua);
    }

    for (const fila of filas) {

        if (fila.tipo === 'cabecera') {
            const colores = tema.cabecera[estadoDeCabecera(tarjeta, tema, umbrales)];
            (tema.id === 'oscura' ? cabeceraOscura : cabeceraClara)(ctx, tema, tarjeta, ix, fila.y, iancho, fila, colores);
        }

        if (fila.tipo === 'recuperada') {
            texto(ctx, fila.texto, centro, fila.y + 17, { css: fuente(15, 700), color: tinta.fuego, alinear: 'center' });
        }

        if (fila.tipo === 'rotulo') {
            fila.lineas.forEach((linea, i) => {
                texto(ctx, linea, centro, fila.y + m.rotuloLinea * (i + 1) - m.rotuloLinea * 0.24, { css: fuente(m.rotuloPx, 700), color: tinta.rotulo, alinear: 'center' });
            });
        }

        if (fila.tipo === 'franja') {
            ctx.fillStyle = hecha ? cuerpo.franjaHecha : cuerpo.franja;
            if (tema.franjaCentrada) ctx.fillRect(ix + 2, fila.y, iancho - 4, fila.alto);
            else ctx.fillRect(ix, fila.y, iancho, fila.alto);

            texto(ctx, fila.texto, tema.franjaCentrada ? centro : ix + 8, fila.y + fila.alto / 2 + m.franjaPx * 0.36, {
                css: fuente(m.franjaPx, tema.franjaCentrada ? 700 : 400),
                color: tinta.franja,
                alinear: tema.franjaCentrada ? 'center' : 'left',
            });
        }

        if (fila.tipo === 'fuego') {
            texto(ctx, fila.texto, centro, fila.y + fila.alto / 2 + m.fuegoPx * 0.36, {
                css: fuente(m.fuegoPx, 700),
                color: atenuar ? tinta.texto : tinta.fuego,
                alinear: 'center',
            });
        }

        if (fila.tipo === 'item') pintarProducto(ctx, tema, tarjeta, fila, ix, atenuar);
    }

    if (fragmento.sigueAbajo) {
        const yPie = iy + ialto - m.continuaAlto;
        if (tema.id === 'clara') lineaDiscontinua(ctx, ix, ix + iancho, yPie + 5, tinta.continua);
        texto(ctx, tema.textos.sigue, centro, yPie + m.continuaAlto - 9, { css: fuente(m.continuaPx, tema.id === 'clara' ? 500 : 400), color: tinta.continua, alinear: 'center' });
    }

    ctx.restore();
}


function pintarProducto(ctx, tema, tarjeta, fila, ix, atenuar) {
    const { m, tinta } = tema;

    const cursiva = fila.retenido;
    const colorNombre = fila.retenido ? tinta.retenido : tinta.texto;
    const colorMod = atenuar ? tinta.texto : fila.retenido && tema.id === 'oscura' ? tinta.retenido : tinta.modificador;

    const despachada = tarjeta.estado === 'despachada';

    //  La palomita: centrada en el nombre en la vista oscura, en su primer renglón en
    //  la clara. Lo despachado en la clara lleva doble palomita.
    if (fila.hecho) {
        const cy = tema.id === 'oscura' ? fila.y + fila.altoNombre / 2 : fila.y + m.nombreLinea / 2;

        if (despachada && tema.id === 'clara') doblePalomita(ctx, ix + m.palomitaX, cy, m.palomitaRadio, tinta.palomita);
        else palomita(ctx, ix + m.palomitaX, cy, m.palomitaRadio, tinta.palomita);
    }

    //  La cantidad. En la vista clara, más de uno va en rojo y negrita.
    const varios = tema.id === 'clara' && fila.cantidad > 1 && !atenuar;
    texto(ctx, String(fila.cantidad), ix + m.cantidadX, fila.y + m.nombreLinea - 6, {
        css: fuente(m.nombrePx, varios ? 700 : 400, cursiva),
        color: varios ? tinta.modificador : colorNombre,
        alinear: 'center',
    });

    fila.lineasNombre.forEach((linea, i) => {
        texto(ctx, linea, ix + m.nombreX, fila.y + m.nombreLinea * (i + 1) - 6, { css: fuente(m.nombrePx, 400, cursiva), color: colorNombre });
    });

    let y = fila.y + fila.altoNombre + m.trasNombre;

    for (const mod of fila.mods) {
        if (fila.hecho && tema.id === 'clara') {
            const cy = y + m.modLinea / 2;
            if (despachada) doblePalomita(ctx, ix + m.modX - 12, cy, 5.5, tinta.palomita);
            else palomita(ctx, ix + m.modX - 11, cy, 5.5, tinta.palomita);
        }

        mod.lineas.forEach((linea, i) => {
            texto(ctx, linea, ix + m.modX, y + m.modLinea * (i + 1) - 5, { css: fuente(m.modPx, 400, m.modCursiva || cursiva), color: colorMod });
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
 * @returns {Array} las zonas de las barras que responden a un toque
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
    }
    else {
        barraClara(ctx, tema, estado, zonas);
        contadorDeTickets(ctx, tema, estado.totalTickets);
    }

    //  La campana de avisos de Toast, que en la tablet de verdad tapa el último botón.
    campana(ctx, tema.ancho - 38, 62, estado.avisos);

    return zonas;
}
