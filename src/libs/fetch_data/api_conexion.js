let URL;
const apiUrl = import.meta.env.VITE_API_URL;


const PORT = window.location.hostname === '72.68.60.201' ? 3006 : 443
window.location.hostname === '72.68.60.201' ?

    URL = `https://72.68.60.201:${PORT}/api_jarvis_dev/v1`
    :
    URL = apiUrl;



console.log('API URL:', apiUrl);


export default URL;