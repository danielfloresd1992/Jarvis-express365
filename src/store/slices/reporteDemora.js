import { createSlice } from "@reduxjs/toolkit";




/*  EL REPORTE DE DEMORA QUE ESPERA
 *
 *  La parrilla vive en la ventana flotante y el formulario en la principal, así que
 *  el aviso cruza por el puente de Electron y aterriza aquí.
 *
 *  Es un buzón de UNO: solo hay un reporte pendiente a la vez. Si llega otro mientras
 *  el anterior sigue sin abrirse, el nuevo lo reemplaza — es el que el operador acaba
 *  de pedir, y por tanto el que quiere ver.
 *
 *  Se vacía EN CUANTO el formulario lo recoge. Si se quedara, al volver a montar el
 *  formulario se reabriría solo, y con datos de hace rato.
 */
export const reporteDemora = createSlice({
    name: 'reporteDemora',
    initialState: null,
    reducers: {

        /*  Llega un reporte desde la ventana flotante.
         *
         *  El 'id' sirve para dos cosas: distinguir dos reportes seguidos de la misma
         *  mesa, y servir de `key` al formulario para que un reporte nuevo reemplace de
         *  verdad los valores del que ya estaba abierto. Sin él, `useState` conserva su
         *  valor inicial y el segundo reporte no se vería.
         */
        pedirReporteDemora: (state, action) => ({
            id: `${action.payload?.tableNumber ?? ''}-${action.payload?.recibidoEn ?? ''}`,
            ...action.payload,
        }),

        //  El formulario ya lo recogió.
        limpiarReporteDemora: () => null,
    },
});


export const { pedirReporteDemora, limpiarReporteDemora } = reporteDemora.actions;

export default reporteDemora.reducer;
