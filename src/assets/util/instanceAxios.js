import axios from 'axios';


const config = { withCredentials: true, headers: {
        'Source-Application': 'Reporte Express',
        'Version-App': '1.1'
    } 
};



const axiosInstance = axios.create(config);

// Configurar el interceptor de respuestas


export default axiosInstance;