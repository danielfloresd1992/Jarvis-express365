import io from 'socket.io-client';


let socket = io('https://72.68.60.254:3000');


socket.on('connect', socked => {
    console.log('cliente io conectado al púerto "3000"');
});


export { socket };