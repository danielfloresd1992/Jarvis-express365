# Banco de pruebas: qué modelo lee mejor la pantalla

Sirve para decidir **con números** si hace falta cambiar de modelo, en vez de hacerlo
por intuición. Le pasa las mismas imágenes a varios modelos, con el mismo prompt que
corre en la ventana, y cuenta aciertos y segundos.

> **Esto no es código de la aplicación.** Es una herramienta. No debe entrar en el
> commit junto con el resto: la carpeta entera se puede borrar sin que nada deje de
> funcionar.

---

## Paso 1 — Reunir capturas

Con la ventana flotante conectada y `npm run dev` corriendo, pulsa **«guardar captura»**
en la barra del zoom (solo aparece en desarrollo). Cada pulsación baja:

```
2026-09-14T15-33-07-completa.png      la pantalla entera
2026-09-14T15-33-07-tira0.png ... 4   las tiras, ya recortadas
```

Las tiras son **exactamente** las imágenes que se le mandan al modelo en marcha. Por eso
se guardan: si el banco recortara por su cuenta estaría midiendo otra cosa.

Mueve los PNG a `banco-de-pruebas/capturas/`.

**Cuántas hacen falta:** con 3 o 4 capturas en momentos distintos del turno —una con la
pantalla llena, otra con pocos tickets, otra con varios Take Out— ya se ve la tendencia.
Más no hace daño, pero cada una alarga la prueba.

---

## Paso 2 — Escribir la verdad

Abre cada tira en el visor de imágenes y **apunta a mano lo que ves**. Esto es el trabajo
aburrido y es el que hace que todo lo demás valga: sin una respuesta correcta no hay nada
contra qué comparar.

Crea `banco-de-pruebas/verdad.json`:

```json
{
  "2026-09-14T15-33-07-tira0.png": [
    { "mesa": "34",      "ticket": "149", "tiempo": "17:48:36" },
    { "mesa": "65",      "ticket": "154", "tiempo": "18:07:36" },
    { "mesa": "#3",      "ticket": "3",   "tiempo": "3:33:56" }
  ],
  "2026-09-14T15-33-07-tira1.png": [
    { "mesa": "32",      "ticket": "7",   "tiempo": "3:31:10" }
  ]
}
```

Reglas para apuntar, las mismas que sigue la aplicación:

- **mesa**: solo el número (`Table 34` → `"34"`). Si la tarjeta **no tiene mesa**, en su
  lugar va el número de ticket con su `#` (`"#3"`). Los nombres de cliente no se apuntan.
- **ticket**: el número del `#`, sin el `#`.
- **tiempo**: el cronómetro **copiado tal cual**, sin añadir ceros (`3:53`, no `03:53`).
- **Solo las tarjetas cuya CABECERA se vea entera** en esa tira. Si una está cortada por
  el borde, no va: el prompt pide justamente que el modelo no la incluya.

---

## Paso 3 — Correrlo

Carga en LM Studio el modelo que quieras probar y:

```bash
node banco-de-pruebas/comparar.mjs
```

Para probar varios (cárgalos todos en LM Studio antes, o ve de uno en uno):

```bash
MODELOS=google/gemma-4-e4b,qwen2.5-vl-7b-instruct node banco-de-pruebas/comparar.mjs
```

Si el servidor no está en `localhost:1234`:

```bash
AI_URL=http://192.168.1.50:1234 node banco-de-pruebas/comparar.mjs
```

---

## Cómo leer el resultado

```
══ RESUMEN ════════════════════════════════════════════════
modelo                            acierto     inventados   s/lectura
google/gemma-4-e4b                52 % (11/21)  7            30.5 s
qwen2.5-vl-7b-instruct            86 % (18/21)  1            48.2 s
```

Tres columnas y cada una dice algo distinto:

- **acierto** — un ticket cuenta solo si coinciden **las tres** cosas: mesa, número y
  cronómetro. Las tres y no dos de tres, porque el fallo que perseguimos era justamente
  que vinieran de tarjetas distintas.

- **inventados** — tickets que el modelo devuelve y que no están en pantalla. Un modelo
  que acierta mucho pero se inventa la mitad **no sirve**, y sin esta columna no se nota.

- **s/lectura** — multiplícalo por el número de tiras (hoy 5) y tienes el **recorrido
  completo**. Ese número es el techo de precisión de «Listo en tablet» y «Listo en
  cocina»: nada que pase más rápido que eso se puede medir.

**La decisión no es «cuál acierta más».** Es cuál da la mejor combinación de acierto y
recorrido para lo que se necesita. Un modelo que acierta el 86 % pero deja el recorrido
en cuatro minutos empeora las dos columnas de estado, aunque mejore mesa y ticket.

---

## Lo que este banco NO mide

- **Las palomitas verdes** (`listo`). Habría que apuntarlas también en la verdad; se
  puede añadir, pero primero conviene ver si el texto se lee bien.
- **OCR clásico** (Tesseract, PaddleOCR). Es el candidato más prometedor para leer
  `Table 16 #34 1:03:01` y no está aquí porque necesita instalar una dependencia. Si el
  resultado de los modelos de visión no convence, ese es el siguiente paso.
- **El coste en memoria de GPU**, que puede decidir la cuestión antes que el acierto.
