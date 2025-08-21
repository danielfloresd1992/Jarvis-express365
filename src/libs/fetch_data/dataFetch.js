let IP;
const PORT = window.location.hostname === '72.68.60.201' ? 3006 : 443
window.location.hostname === '72.68.60.201' ?

    IP = `https://72.68.60.201:${PORT}/api_jarvis_dev/v1`


    :
    IP = `https://amazona365.ddns.net:${PORT}/api_jarvis/v1`;

export default IP;