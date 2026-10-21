import { useEffect, useState } from 'react';


/*  ¿HAY CONEXIÓN CON UN SOCKET?
 *
 *  true mientras el socket está conectado; false desde que se cae (o no consigue conectar) hasta que vuelve. Para
 *  decirlo en pantalla sin bloquear nada: antes la caída se avisaba con un alert() (store/slices/socketio.js).
 *
 *  @param {object} socket  un socket de socket.io-client
 *  @returns {boolean}
 */
export function useSocketConnected(socket) {

    const [connected, setConnected] = useState(() => Boolean(socket?.connected));

    useEffect(() => {
        if (!socket) return undefined;

        const up = () => setConnected(true);
        const down = () => setConnected(false);

        socket.on('connect', up);
        socket.on('disconnect', down);
        socket.on('connect_error', down);

        //  Pudo cambiar entre el primer pintado y este efecto
        setConnected(Boolean(socket.connected));

        return () => {
            socket.off('connect', up);
            socket.off('disconnect', down);
            socket.off('connect_error', down);
        };
    }, [socket]);

    return connected;
}
