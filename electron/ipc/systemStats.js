import os from 'os';


//  Suma los tiempos de todos los núcleos (idle = inactivo, total = todo)
function cpuTimes() {
    let idle = 0;
    let total = 0;

    for (const cpu of os.cpus()) {
        for (const type in cpu.times) total += cpu.times[type];
        idle += cpu.times.idle;
    }

    return { idle, total };
}




//  Arranca el envío de estadísticas (CPU y RAM) al renderer cada intervalo.
//  El % de CPU se calcula con la diferencia entre dos muestras.
//  Devuelve una función para detener el envío.
export function startSystemStats(win, intervalMs = 1000) {

    let prev = cpuTimes();

    const timer = setInterval(() => {

        if (win.isDestroyed()) return;

        const cur = cpuTimes();
        const idleDiff = cur.idle - prev.idle;
        const totalDiff = cur.total - prev.total;
        const cpuPercent = totalDiff > 0 ? (1 - idleDiff / totalDiff) * 100 : 0;
        prev = cur;

        const totalMem = os.totalmem();
        const usedMem = totalMem - os.freemem();

        win.webContents.send('system:stats', {
            cpu: Math.round(cpuPercent),
            ramPercent: Math.round((usedMem / totalMem) * 100),
            ramUsedGb: (usedMem / 1024 / 1024 / 1024).toFixed(1),
            ramTotalGb: (totalMem / 1024 / 1024 / 1024).toFixed(1),
        });

    }, intervalMs);

    return () => clearInterval(timer);
}