import io from 'socket.io-client';


let socket = io('https://amazona365.ddns.net:3000');


socket.on('connect', socked => {
    console.log('cliente io conectado al púerto "3000"');
});


export { socket };