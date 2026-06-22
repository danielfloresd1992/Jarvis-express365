import http from 'http';
import { createReadStream, existsSync, statSync } from 'fs';
import path from 'path';


//  Tipos de archivo que sirve el server
const MIME = {
    '.html':  'text/html',
    '.js':    'text/javascript',
    '.mjs':   'text/javascript',
    '.css':   'text/css',
    '.json':  'application/json',
    '.png':   'image/png',
    '.jpg':   'image/jpeg',
    '.jpeg':  'image/jpeg',
    '.gif':   'image/gif',
    '.svg':   'image/svg+xml',
    '.ico':   'image/x-icon',
    '.webp':  'image/webp',
    '.woff':  'font/woff',
    '.woff2': 'font/woff2',
    '.ttf':   'font/ttf',
};




//  Levanta un server estático que sirve el build de jarvis-express (carpeta rootDir)
//  en el puerto indicado, sólo en localhost. Devuelve el server ya escuchando.
export function startStaticServer(rootDir, port) {

    return new Promise((resolve) => {

        const server = http.createServer((req, res) => {

            //  quita el query string y arma la ruta del archivo pedido
            const urlPath = decodeURIComponent(req.url.split('?')[0]);
            let filePath = path.join(rootDir, urlPath === '/' ? 'index.html' : urlPath);

            //  SPA: si el archivo no existe (rutas de React Router), sirve index.html
            if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
                filePath = path.join(rootDir, 'index.html');
            }

            const ext = path.extname(filePath).toLowerCase();
            res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');

            createReadStream(filePath).pipe(res);
        });

        server.listen(port, '127.0.0.1', () => resolve(server));
    });
}