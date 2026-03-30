/**
 * osNotification.js
 * Notificaciones push nativas del OS usando la Web Notification API.
 * Funciona en Electron (renderer) y navegadores Chromium.
 *
 * Uso rápido:
 *   import { pushOSNotification, notifyAlertUpdate, requestNotificationPermission } from '@/libs/osNotification'
 *
 *   // Pedir permiso una vez al iniciar la app
 *   await requestNotificationPermission()
 *
 *   // Notificación genérica
 *   pushOSNotification({ title: 'Hola', body: 'Mensaje', icon: '/logo.png' })
 *
 *   // Notificación pre-armada para alertUpdate
 *   notifyAlertUpdate(data)
 */

// ── Permiso ──────────────────────────────────────────────────────────────────

/**
 * Solicita permiso al usuario para mostrar notificaciones del OS.
 * Llamar una sola vez al iniciar la app.
 * @returns {Promise<boolean>} true si el permiso fue concedido
 */
export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('[osNotification] Este entorno no soporta notificaciones.')
        return false
    }
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied')  return false

    const result = await Notification.requestPermission()
    return result === 'granted'
}

// ── Core ─────────────────────────────────────────────────────────────────────

/**
 * Muestra una notificación nativa del OS.
 *
 * @param {Object} options
 * @param {string}   options.title      - Título de la notificación (requerido)
 * @param {string}  [options.body]      - Cuerpo / descripción
 * @param {string}  [options.icon]      - URL de ícono (imagen de la novedad, logo, etc.)
 * @param {string}  [options.tag]       - ID único — evita duplicados de la misma notificación
 * @param {boolean} [options.silent]    - Sin sonido si true (default false)
 * @param {Function}[options.onClick]   - Callback al hacer click en la notificación
 * @returns {Notification|null}
 */
export function pushOSNotification({ title, body = '', icon, tag, silent = false, onClick }) {
    if (!('Notification' in window)) return null
    if (Notification.permission !== 'granted') {
        console.warn('[osNotification] Permiso no concedido. Llamar requestNotificationPermission() primero.')
        return null
    }

    const notification = new Notification(title, {
        body,
        icon:   icon  || undefined,
        tag:    tag   || undefined,
        silent,
    })

    if (typeof onClick === 'function') {
        notification.onclick = (e) => {
            e.preventDefault()
            window.focus()
            onClick(e)
            notification.close()
        }
    }

    return notification
}

// ── Pre-sets por tipo ─────────────────────────────────────────────────────────

/**
 * Notificación lista para el tipo alertUpdate.
 * Recibe el objeto de datos tal como llega del socket / Redux.
 *
 * @param {Object} data - Objeto de novedad (mismo shape que dataexaple.js)
 * @param {Function} [onClick] - Callback opcional al hacer click
 */
export function notifyAlertUpdate(data, onClick) {
    const isApproved    = data?.validationResult?.isApproved
    const discardClient = data?.validationResult?.validationToDiscard?.byTheClient
    const discardDept   = data?.validationResult?.validationToDiscard?.reportingDepartment
    const isInvalid     = discardClient || discardDept
    const sentToGroup   = !!data?.givenToTheGroup

    const title    = data?.title        || 'Novedad'
    const local    = data?.local?.name  || ''
    const validator = data?.validationResult?.validatedByUser?.user?.nameUser || ''
    const sender    = data?.sharedByUser?.user?.nameUser || ''
    const icon      = data?.imageToShare || data?.imageUrl?.[0]?.url || undefined

    let statusLabel = 'Aprobada'
    if (isInvalid)               statusLabel = 'Invalidada'
    else if (isApproved && sentToGroup) statusLabel = 'Enviada al grupo'

    const bodyLines = [
        local       && `📍 ${local}`,
        sender      && `✉️  ${sender}`,
        validator   && `✅ Validado por ${validator}`,
        `→ ${statusLabel}`,
    ].filter(Boolean).join('\n')

    pushOSNotification({
        title: `Novedad — ${title}`,
        body:  bodyLines,
        icon,
        tag:   data?._id,          // evita duplicar la misma novedad
        onClick,
    })
}
