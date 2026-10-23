/*  LAS CATEGORÍAS DE UNA ALERTA (Menu.category), CON SU COLOR
 *
 *  Es la lista FIJA que leen los tres sistemas con el nombre escrito a mano: Client365 la tiene en
 *  src/libs/alerts/categories.js, reportes365 agrupa por ella y aquí están en los JSON de Main (delay.json,
 *  door.json…). Los colores son los mismos de Client365, copiados a mano porque entre los repos no hay código
 *  compartido: si allá cambian, cambiarlos aquí.
 *
 *  Los usa el aviso de «Entregada con éxito» (component/SentNovelty): cada alerta se pinta con el color de su
 *  categoría. Una categoría que no esté aquí sale con el gris de CATEGORY_FALLBACK, nunca rompe.
 */


// CATEGORIES = «clave → nombre y colores»: 'color' para texto e icono, 'bg' para el fondo suave
export const CATEGORIES = {
    client: { es: 'Cliente', color: '#1d4ed8', bg: '#dbeafe' },
    delay: { es: 'Demoras', color: '#854d0e', bg: '#fef9c3' },
    door: { es: 'Puerta', color: '#7e22ce', bg: '#f3e8ff' },
    employee: { es: 'Empleados', color: '#065f46', bg: '#d1fae5' },
    failed: { es: 'Fallas', color: '#991b1b', bg: '#fee2e2' },
    food: { es: 'Comidas', color: '#9a3412', bg: '#fff7ed' },
    incident: { es: 'Incidencias', color: '#c2410c', bg: '#ffedd5' },
    localIncident: { es: 'Incidencias en el local', color: '#0369a1', bg: '#e0f2fe' },
    merchandise: { es: 'Mercancía', color: '#7c3aed', bg: '#fdf4ff' },
    protocol: { es: 'Protocolos', color: '#047857', bg: '#ecfdf5' },
    trash: { es: 'Basura', color: '#475569', bg: '#f1f5f9' },
    perimeter: { es: 'Perimetral', color: '#b91c1c', bg: '#fef2f2' },
};

// CATEGORY_FALLBACK = «una categoría que no está en la lista»: se ve, en gris
export const CATEGORY_FALLBACK = { es: '', color: '#374151', bg: '#f3f4f6' };


// categoryOf = «la categoría de una alerta, siempre pintable»: { key, es, color, bg }
export const categoryOf = (key) => {
    const found = CATEGORIES[key];
    return { key: key ?? '', ...(found ?? { ...CATEGORY_FALLBACK, es: key ?? '' }) };
};
