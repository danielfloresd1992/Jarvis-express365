# Estado de lo que está a medias

Foto del **2026-08-21**. A diferencia de `CLAUDE.md`, que describe lo estable,
esto es lo que está **a medias**: sirve mientras dure, y conviene borrarlo o
reescribirlo cuando deje de ser cierto.

Se escribió desde una sesión trabajando en `Client365`, para que una sesión en
este repo no tenga que reconstruirlo.

---

Hay dos frentes abiertos: **caídas de DVR** (lo más reciente) y
**bonificación**.

## Lo que está publicado

**Todo commiteado y empujado**, en los tres repos. Ni Client365 ni
api_jarvis365 tienen nada pendiente de subir.

## Lo que NO está corriendo

El código está en `main` de `api_jarvis365`, pero **el servidor no lo tiene**
mientras nadie despliegue a mano. Y como el trabajo de DVR va ENCIMA del de
bonos, si el de bonos no está desplegado el de DVR tampoco. Hasta entonces:

- `GET /noveltie/bonos/…` y `/dvr-failure/**` responden **404**
- Los endpoints de `/bonus/**` responden con el esquema viejo
- Ninguna novedad nueva se sella con `Noveltie.bonus`
- **Los locales sin cámaras siguen pudiendo reportar**, y siguen contando
  como "no reportó" en el corte de silencio y en el PDF

## Caídas de DVR

Recurso nuevo y completo en `api_jarvis365/src/apiServises/dvrFailure/`:
modelo, rutas, esquema, informe, y `dvrGate.lib.ts` —la compuerta— con sus
pruebas en `test/dvrFailure.test.ts`.

    POST /dvr-failure           abre una caída
    PUT  /dvr-failure/restore   la cierra
    GET  /dvr-failure/active    las abiertas ahora
    GET  /dvr-failure/history   el historial
    GET  /dvr-failure/stats     por día, para el mapa de calor

`Menu.dvrEffect` (`'down' | 'up' | null`) dice qué le hace cada alerta al DVR.
Con una caída abierta, el establecimiento **no puede cargar ninguna novedad**
salvo la marcada `'up'`. Los detalles y el porqué están en `CLAUDE.md`.

Del lado de Client365 vive en la sala de control (`/dashboard`), pestaña
«Falla con DVR»: `assets/DvrFailures.jsx`, `hook/useDvrFailures.jsx` y el mapa
de calor mensual en `components/ui/mono-activity-green.jsx` +
`activityGrid.js`. `LocalsOverview.jsx` marca con borde negro los locales sin
cámaras y permite sacar uno de la lista de "sin reportar".

## Cómo desplegar

Los tres pasos, en orden:

```bash
# 1. Desplegar (en el Windows Server)
git pull
npx babel src --out-dir dist --extensions ".ts,.js"
# reiniciar el servicio

# 2. Migrar las asignaciones de bono — idempotente, se puede repetir
MONGO_URI="mongodb://…" node dist/scripts/migrar-asignaciones-de-bono.js

# 3. Los índices de Noveltie, A MANO y mirando
#    La colección NO declara ninguno. Sin el de `date`, la consulta del libro
#    de bonos recorre la colección entera.
db.noveltie.createIndex({ date: 1 })
db.noveltie.createIndex({ 'sharedByUser.user.id': 1, date: 1 })
db.noveltie.createIndex({ establishment: 1, date: 1 })
```

---

## Qué existe y qué no

| | Estado |
|---|---|
| Recurso `dvrFailure` + la compuerta | terminado, sin desplegar |
| Sala de control: pestaña «Falla con DVR» y mapa de calor | terminado |
| Modelo de bonos (regla, categoría, ajustes, sello) | terminado, sin desplegar |
| Mapa de cableado alerta → alcance → regla, en `/bonus` | funcionando |
| `GET /noveltie/bonos/…` — el equivalente de `Op_DataBase` | escrito, sin desplegar |
| Panel de consulta por rango y operador | **solo maquetado**, el botón no consulta |
| Panel de evaluaciones | **solo maquetado**, no guarda nada |
| Modelo de evaluaciones en la API | **no existe** |
| La compuerta de evaluación (decide si se paga) | **no existe** |

## El endpoint del libro de bonos

```
GET /noveltie/bonos/since=2026-08-01/until=2026-08-16
                   /operador=0/local=0/agrupar=operador
```

`0` es «todos» en los tres últimos. Devuelve el **agrupado**, no las novedades:
tres meses son ~100.000 documentos, agrupados son ~9.000 filas. `agrupar`
acepta `dia`, `turno`, `local`, `operador`, `alerta` separados por coma, y
decide el tamaño de la respuesta. Los nombres van aparte en `catalogos`.

Tope de 92 días, y por encima de 400.000 novedades responde 413 en vez de
intentarlo.

---

## Lo que salió de leer la hoja de cálculo

`Escritorio\Bonos - Amazonas365.xlsx`. Dos cosas que no estaban en ningún lado
del código:

**Un bono vale 0,20 $.** Está en `Resumen!E7 = C7*0.2`. El `pointValue` que
haya cargado en el sistema debería ser ese.

**La evaluación es una compuerta de todo o nada, por turno.** Si el porcentaje
del operador no llega al umbral, **pierde todos los bonos de ese turno**, no
una parte:

```
umbral = en entrenamiento ? 70%
       : cubre 1 local    ? 90%
       : cubre 2 o más    ? 75%
```

Y lo importante: **el umbral no es un cargo de la persona, se deduce de cuántos
locales cubrió ese turno**. La misma persona es «experto» un martes y «dos
locales» un miércoles. La regla completa está traducida en
`Client365/src/app/bonus/assets/evaluationRules.js`.

En el período del 1 al 16 de agosto, seis operadores generaron bonos y
cobraron cero por esta compuerta. **Liquidar sin ella paga de más.**

---

## Lo que afecta a ESTE repo

`src/libs/calculateBonus.js` es de la versión anterior del sistema y **hoy
devuelve siempre cero** — el detalle está en `CLAUDE.md`. Lo usa
`component/ModalData/ModalData.jsx`.

Cuando la API esté desplegada, la novedad ya trae su valor sellado en
`Noveltie.bonus.bonusPerAlert` y no hay nada que calcular de este lado: se lee.
