/*  LA SESIÓN VENCIDA: QUIÉN PIDE VOLVER A ENTRAR Y QUIÉN LO RESUELVE (pedido del usuario)
 *
 *  sessionAxios.js (que no es React) se entera de que la API dijo 401 —no hay sesión, o venció— y tiene que abrir el
 *  formulario de iniciar sesión, que sí es React: el de «Cambiar de usuario» (component/SwitchUser), en su modo
 *  «la sesión venció». Este archivo es el puente entre los dos:
 *
 *      · el formulario se apunta con onSessionExpired(abrir) al montarse, y se borra al desmontarse;
 *      · sessionAxios pide askToLogIn() y espera la respuesta: { entered, sameUser }.
 *
 *  Si llegan varios 401 a la vez (un formulario que sube su imagen y otra petición), el formulario se abre UNA vez y
 *  todos esperan la misma respuesta.
 *
 *  Donde nadie se apuntó —la ventana flotante de la tablet, que no tiene la barra de arriba ni Redux— la respuesta es
 *  inmediata y negativa: la petición falla como fallaba antes, en vez de quedarse esperando un formulario que no hay.
 */


// opener = «quién sabe abrir el formulario»: (al terminar) => void. null = nadie
let opener = null;

// pending = «la pregunta que está abierta»: la promesa que esperan los 401 que van llegando. null = ninguna
let pending = null;


/*  onSessionExpired = «apuntarse para abrir el formulario cuando la sesión venza»
 *
 *  @param {function} open  recibe 'finish', y lo llama una vez con { entered, sameUser } cuando el operador vuelve a
 *                          entrar (entered: true; sameUser: si es el mismo usuario de antes) o cancela (entered: false)
 *  @returns {function} borrarse
 */
export function onSessionExpired(open) {
    opener = open;
    return () => {
        if (opener === open) opener = null;
    };
}


/*  askToLogIn = «pedir que se vuelva a entrar», y esperar
 *
 *  @returns {Promise<{ asked: boolean, entered: boolean, sameUser: boolean }>}  'asked' es false si no había formulario
 *           que abrir (nadie se apuntó): entonces no se preguntó nada
 */
export function askToLogIn() {
    if (!opener) return Promise.resolve({ asked: false, entered: false, sameUser: false });

    if (!pending) {
        pending = new Promise(resolve => {
            // finished = «ya se contestó»: el formulario podría llamar dos veces (entrar y cerrarse)
            let finished = false;
            opener((outcome) => {
                if (finished) return;
                finished = true;
                pending = null;
                resolve({ asked: true, entered: outcome?.entered === true, sameUser: outcome?.sameUser === true });
            });
        });
    }

    return pending;
}
