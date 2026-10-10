# CLAUDE.md

Contexto del proyecto para Claude Code. Este archivo se carga automáticamente al
inicio de cada sesión. Mantenerlo enfocado en lo **estable** (propósito, stack,
convenciones); lo que cambia todos los días vive en el historial de git.

## Propósito

**Jarvis-express** es la aplicación del **operador de monitoreo**: la pantalla
donde alguien que está mirando cámaras reporta una novedad, le adjunta la
imagen o el video, y la manda al grupo. Es la que produce los datos que después
consumen las otras tres.

No confundirla con **Client365** (`jarvis365_dev`), que es la de **gerencia**:
allá se configura, se supervisa y se liquida; acá se carga.

## Stack

- **Vite 3** + **React 18** + **React Router** — SPA, no Next.js
- Estado: **Redux Toolkit** (`src/store/slices`, 7 slices)
- Estilos: **Tailwind v4** vía `@tailwindcss/postcss`
- Realtime: **socket.io-client** (dos sockets: Jarvis y AVA)
- HTTP: axios
- Formularios: react-hook-form
- Gráficas: **chart.js + react-chartjs-2** (con los plugins `datalabels` y `zoom`)
- Medios, que es buena parte del peso: `@syncfusion/ej2-react-image-editor`,
  `react-cropper`, `react-avatar-editor`, `react-images-uploading`,
  `compressorjs`, `video-react`, `video-stitch`, `sharp`
- Búsqueda difusa: `fuse.js`

## Estructura

```
src/
├── component/   UI (AsideBar, Main, Navbar, NotificationCenter, chat,
│                inbox, for_tablet, layaut, ModalData…)
├── routes/      Home, form
├── libs/        Lógica no-UI: fetch_data, socket, entorno, date_time,
│                script, calculateBonus, orderNoventie, osNotification
├── hook/        Custom hooks
├── store/       Redux Toolkit
└── styles/      CSS
```

Alias `@` → `src/` (definido en `vite.config.js`).

## Comandos

```bash
npm run dev       # servidor de desarrollo (vite)
npm run build     # build de producción → dist/
npm run preview   # previsualizar el build
npm start         # sirve dist/ con Express sobre HTTPS, puerto 446
```

## Convenciones y quirks (IMPORTANTE)

Cosas que **no** se deducen del código y condicionan cómo se trabaja:

- **`dev` y `start` tienen el `NODE_ENV` invertido.** `dev` hace
  `set NODE_ENV=production && vite`, y `start` hace
  `set NODE_ENV=development && node index.js`. Está así en `package.json`;
  antes de "corregirlo" hay que verificar quién lee esa variable, porque puede
  haber código dependiendo del cruce.

- **HTTPS en producción, HTTP en desarrollo, y la configuración se contradice.**
  `index.js` sirve el build con `createServer` de `https` en el puerto 446. En
  cambio el servidor de Vite corre en `http://0.0.0.0:5173`: `vite.config.js`
  tiene `server.https: false` **aunque el plugin `mkcert()` esté cargado**, así
  que el certificado local se genera y no se usa. Si hace falta HTTPS en
  desarrollo —por ejemplo para cámara, micrófono o cookies `Secure`—, el
  cambio es sacar ese `https: false`, no agregar nada.

- **No se despliega en Netlify.** Se construye y se sirve con su propio Express
  (`npm start`, puerto 446). El deploy es manual, como el de `api_jarvis365`.

- **Variables de entorno, todas con prefijo `VITE_`** (van en `.env`):
  `VITE_API_URL`, `VITE_COMPRESS_URL`, `VITE_SOCKET_AVA_URL`,
  `VITE_SOCKET_JARVIS_URL`.

- **Restricción por equipo, en `src/libs/entorno/`.** En computadora la app
  **solo corre dentro de la aplicación de escritorio**; en teléfono o tableta
  corre en cualquier navegador. El móvil se comprueba PRIMERO, porque un
  teléfono nunca reporta "Electron" y caería en la pantalla de bloqueo. Ese
  archivo está bien comentado: leerlo antes de tocar nada de acceso.

- **Backend en otro dominio.** Cookies cross-domain con express-session. No
  asumir mismo origen al tocar auth o peticiones.

- Idioma del código y los commits: **español**. Mantener ese estilo.

## Los repos hermanos

Este proyecto no vive solo. En la misma carpeta padre:

| Repo | Qué es | Deploy |
|---|---|---|
| **Jarvis-express365** | esta app — el operador reporta | manual, Express :446 |
| **Client365** | `jarvis365_dev` — gerencia, Next.js 14 | Netlify, automático al push |
| **api_jarvis365** | la API — Express 4 + Mongoose, ESM, Babel → `dist/` | **manual**, en un Windows Server |
| **reportes365** | los reportes | — |

**Casi ningún cambio de negocio vive en un solo repo.** No hay contrato ni
tipos compartidos entre ellos: lo que la API devuelve se vuelve a describir a
mano de este lado. Al tocar algo que cruce, verificar el otro repo en vez de
asumir.

Y ojo con el desfase: la API se despliega a mano, así que **el front puede
estar adelante del servidor durante días**. Un endpoint recién agregado
responde 404 hasta que alguien lo despliegue.

## Un local sin cámaras no puede reportar

Es lo más nuevo del sistema y le pega de lleno a esta app, porque acá es donde
se carga.

Cuando un establecimiento tiene una **caída de DVR abierta**, el servidor
**rechaza cualquier novedad** que se intente cargar ahí. Sin cámaras no hay
nada que ver. La única que se acepta es la alerta que avisa que la conexión
volvió.

Qué le hace cada alerta al DVR lo dice **`Menu.dvrEffect`**, con tres valores:

    'down'   abre la caída — el local queda bloqueado
    'up'     la cierra — es la única que se acepta con el local caído
    null     ni una cosa ni la otra (la mayoría)

La regla vive en `api_jarvis365/src/apiServises/dvrFailure/dvrGate.lib.ts`,
pura y con pruebas, y exige **tres condiciones a la vez** para bloquear: que el
local esté caído, que la alerta no sea la de restablecimiento, y que exista en
el catálogo alguna alerta marcada `'up'` — sin esa última no habría forma de
desbloquear a nadie y el local quedaría mudo para siempre.

**Lo que esto significa acá:** al cargar una novedad hay que estar listo para
un rechazo que no es un error de validación ni de red, sino una regla de
negocio, y el operador tiene que entender por qué. Del lado de la API el
recurso completo es `dvrFailure` (modelo, rutas, esquema, informe) con cinco
endpoints: `POST /dvr-failure`, `PUT /dvr-failure/restore`, y
`GET /dvr-failure/active | /history | /stats`.

Efectos en cadena que ya están resueltos y conviene no volver a romper: un
local sin cámaras **deja de contar como "no reportó"** en el corte de silencio,
en el aviso al grupo y en el PDF del reporte diario.

## El sistema de bonificación

Se rehizo del lado de `api_jarvis365` y `Client365`. Lo vigente:

- El **dinero es global** (`BonusSettings.pointValue` en dólares, más la tasa
  del BCV); lo que varía por alerta es la **cantidad** de bonos.
- Una regla dice `alertsRequired` / `bonusAwarded` por turno — el "3x1" del
  reglamento— y **el resto no se pierde**: seis alertas de una regla 4x1 son
  1,5 bonos, no 1.
- El **turno es el del operador**, no el de la novedad.
- Al aprobar una novedad se **congela** el cálculo en `Noveltie.bonus`
  (`bonusPerAlert`, `pointValue`, `workShift`…). Editar una regla después no
  cambia lo ya sellado. La **tasa no se congela**: se aplica al liquidar.

**`src/libs/calculateBonus.js` es de la versión anterior y hoy devuelve
siempre cero.** Agrupa por `title` y calcula con
`rulesForBonus.worth / rulesForBonus.amulative`, pero **`rulesForBonus` ya no
existe en la API**: el resultado es `NaN` y la propia función lo convierte en
`0` con su `isNaN(...)`. Lo usa `component/ModalData/ModalData.jsx`. Antes de
tocarlo, decidir si se reemplaza por el valor que ya trae sellado la novedad o
si se borra.

Además usa `Math.floor` sobre el total, lo que **descarta los sobrantes** —
justo lo contrario de la regla vigente.

## Notas

- `chart.js` acá sí se usa (`react-chartjs-2`). En Client365 está instalado y
  **no lo importa nadie**: no copiar ese patrón de allá.
- Vite está en la **3**, varias mayores atrás. Actualizar no es urgente pero es
  deuda conocida.
