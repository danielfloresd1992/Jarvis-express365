let IP;
const URL = import.meta.env.VITE_API_URL;


window.location.hostname === '72.68.60.201' ?

    IP = `https://72.68.60.201:3006/api_jarvis_dev/v1`
    :
    IP = URL;

export default IP;