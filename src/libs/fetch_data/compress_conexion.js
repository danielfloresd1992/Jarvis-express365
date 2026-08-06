
// URL del microservicio `compress` (convierte, une, acelera y estampa la
// marca de agua en los videos). Antes estaba escrita a mano en dos archivos
// distintos, así que mover el servicio de máquina o de puerto obligaba a
// buscarla por todo el código.
//
// El valor por defecto conserva la IP que estaba fija hasta ahora: `.env`
// está en .gitignore y no viaja con el repositorio, así que si en una
// máquina falta la variable el componente sigue funcionando igual que antes
// en lugar de quedar apuntando a `undefined`.
const compressUrl = import.meta.env.VITE_COMPRESS_URL || 'https://72.68.60.254:65431';


const URL = compressUrl;


console.log('COMPRESS URL:', compressUrl);


export default URL;
