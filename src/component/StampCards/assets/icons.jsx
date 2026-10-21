/*  LOS ICONOS DE LAS TARJETAS DE SELLOS, en trazo y con el color del texto (currentColor) */


// StampIcon = «un sello»: dos círculos, el del botón «Tarjetas» de la barra
export const StampIcon = () => (
    <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' aria-hidden='true'>
        <circle cx='12' cy='12' r='9' />
        <circle cx='12' cy='12' r='5.5' />
    </svg>
);

// CheckIcon = «hecho»: la tarjeta llena
export const CheckIcon = () => (
    <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3.4' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
        <path d='M5 12l5 5 9-10' />
    </svg>
);
