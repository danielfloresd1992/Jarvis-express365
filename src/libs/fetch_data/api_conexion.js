let URL;
const PORT = window.location.hostname === 'localhost' ? 3006 : 443
window.location.hostname === 'localhost' ?

    URL = `https://amazona365.ddns.net:${PORT}/api_jarvis_dev/v1`
    :
    URL = `https://amazona365.ddns.net:${PORT}/api_jarvis/v1`;

export default URL;