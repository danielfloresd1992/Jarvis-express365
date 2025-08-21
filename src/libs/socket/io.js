import io from 'socket.io-client';



const SockedAppManager = import.meta.env.VITE_SOCKET_AVA_URL;

let socket = io(SockedAppManager);


socket.on('connect', socked => {
    console.log('cliente io conectado al púerto "3000"');
});


export { socket };