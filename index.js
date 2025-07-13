import express from 'express';
import { createServer } from 'https';
import cors from 'cors';
import { readFileSync } from 'fs';
import { join } from 'path';
import colors from 'colors';
import * as url from 'url';

const app = express();
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

app.set('port', process.env.PORT || 446);

app.use(cors());


app.get('/', (req, res) => { 
    console.log(join(__dirname, './dist/index.html'));
    res.sendFile(join(__dirname, './dist/index.html'));
});

app.use(express.static(join(__dirname, './dist')));
app.use('*', express.static(join(__dirname, './dist')));

const cert = {
    cert: readFileSync(join(__dirname, 'certificado.crt')),
    key: readFileSync(join(__dirname, 'clave.key'))
}

createServer(cert, app).listen(app.get('port'), () => {
    console.clear();
    console.log(colors.bgYellow(`Reporte express en el puerto ${app.get('port')}`.black));
});