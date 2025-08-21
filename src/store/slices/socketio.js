import { createSlice } from "@reduxjs/toolkit";
import { socket } from '../../libs/socket/io.js';
import io from 'socket.io-client';
let dataUser = null;

const SockedAppManager = import.meta.env.VITE_SOCKET_JARVIS_URL;


const urlSockedAppManager = window.location.hostname === '72.68.60.201' ? '72.68.60.201:3007' : SockedAppManager;


const socketAppManager = io(`wss://${urlSockedAppManager}`, { secure: true, rejectUnauthorized: false });


socketAppManager.on('update-user-client-express', userId => {
    if (dataUser) {
        dataUser.myId = userId;
        socketAppManager.emit('user-connection', dataUser);
    }
});


socketAppManager.on('connect_error', err => {
    alert('Error de certificados SSL en soket');
});



socketAppManager.on('document_updated', data => {
    console.log(data);
});


export const socketIo = createSlice({
    name: "socketIo",
    initialState: {},
    reducers: {
        createIo: (state, action) => {

            dataUser = {
                sessionId: `${JSON.parse(sessionStorage.getItem('session'))._id}${JSON.parse(localStorage.getItem('local_appExpress'))[0]._id}`,
                user: {
                    username: `${JSON.parse(sessionStorage.getItem('session')).name} ${JSON.parse(sessionStorage.getItem('session')).surName}`,
                    userId: JSON.parse(sessionStorage.getItem('session'))._id
                },
                localInfo: {
                    localname: JSON.parse(localStorage.getItem('local_appExpress'))[0].name,
                    localId: JSON.parse(localStorage.getItem('local_appExpress'))[0]._id
                }
            };
            socketAppManager.emit('user-connection', dataUser);
            // socket.emit('client-connection', `_*Inicio de sesión*_ 🌐\n*${JSON.parse(sessionStorage.getItem('session')).name} ${JSON.parse(sessionStorage.getItem('session')).surName} en ${JSON.parse(localStorage.getItem('local_appExpress'))[0].name}*`);
        },


        desconnectIo: (state, action) => {
            socketAppManager.emit('close-user-connection', dataUser);
            dataUser = null;
            socket.on('disconnect', () => {
                console.log('me cerré')
            });
            //socket.emit('client-connection', `_*${JSON.parse(sessionStorage.getItem('session')).name} ${JSON.parse(sessionStorage.getItem('session')).surName} se a desconectado ⭕*_`);
            state.value = {};
        },


        sendText: (state, action) => {
            socket.emit('chat', action.payload);
        },


        sendFailed: (state, action) => {
            console.log(action.payload);
            socketAppManager.emit('receive-failure', action.payload);
        },


        sendReconnection: (state, action) => {
            console.log(action.payload);
            socketAppManager.emit('receive-reconnection', action.payload);
        }
    }
});





export const {
    createIo,
    desconnectIo,
    sendText,
    sendFailed,
    sendReconnection
} = socketIo.actions;

export { socketAppManager };

export default socketIo.reducer;