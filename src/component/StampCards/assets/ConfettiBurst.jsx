import { useState } from 'react';
import { formatBonus, bonusWord } from '../../../libs/bonus/stampCards.js';


/*  EL CONFETI: cuando aprueban una novedad (pedido del usuario: «algo sutil, para motivar a reportar más»)
 *
 *  Un puñado de papelitos que salta del botón «Tarjetas» y cae despacio, apagándose. No tapa nada y se va solo
 *  (useStampNews lo quita a los BURST_MS). Con cuánto, según lo que trajo la aprobación (pedido del usuario: que pese
 *  más en las que tienen regla de bono):
 *
 *      small   aprobada, pero su alerta no da bono    pocos papelitos, en tonos suaves
 *      bonus   aprobada con bono                       más, en verde y oro, y su «+0,25 bono» subiendo
 *      full    además llenó una tarjeta                 el más grande (y aparte sale «¡Tarjeta llena!»)
 *
 *  Cada papelito sale con su dirección, altura, giro y retraso al azar, sorteados una vez al montar: por eso cada
 *  ráfaga se monta con su propia 'key'. Es CSS puro ('stamp-confetti…' en style.css): con «reducir movimiento» no sale.
 */


// BURSTS = «cómo es cada ráfaga»: cuántos papelitos, cuánto se abren (px a cada lado), cuánto suben (px) y sus colores
const BURSTS = {
    small: { count: 12, spread: 55, rise: [40, 75], colors: ['#c9dfc0', '#e9d6a8', '#ddd3bd', '#b9dcae'] },
    bonus: { count: 26, spread: 110, rise: [60, 120], colors: ['#1c8c08', '#29c50c', '#9be08a', '#d9a441', '#f2d18a'] },
    full: { count: 44, spread: 170, rise: [90, 170], colors: ['#1c8c08', '#29c50c', '#9be08a', '#d9a441', '#f2d18a', '#b5763b'] },
};

// between = «un número al azar entre dos»
const between = (low, high) => low + Math.random() * (high - low);

// makeBits = «los papelitos de una ráfaga», cada uno con su recorrido
const makeBits = ({ count, spread, rise, colors }) => Array.from({ length: count }, (unused, index) => {
    const height = between(rise[0], rise[1]);
    const round = Math.random() < 0.35;
    return {
        key: index,
        style: {
            '--dx': `${between(-spread, spread).toFixed(1)}px`,
            '--rise': `${(-height).toFixed(1)}px`,
            '--fall': `${(-height + between(35, 75)).toFixed(1)}px`,
            '--spin': `${between(-540, 540).toFixed(0)}deg`,
            '--delay': `${between(0, 140).toFixed(0)}ms`,
            '--duration': `${between(950, 1450).toFixed(0)}ms`,
            width: round ? '6px' : '5px',
            height: round ? '6px' : '9px',
            borderRadius: round ? '50%' : '1px',
            background: colors[index % colors.length],
        },
    };
});


/*  @param {string} strength  'small' | 'bonus' | 'full'
 *  @param {number} amount    los bonos que trajo (0 si no da bono): se enseñan subiendo
 */
export default function ConfettiBurst({ strength = 'small', amount = 0 }) {

    // bits = «los papelitos», sorteados una sola vez
    const [bits] = useState(() => makeBits(BURSTS[strength] ?? BURSTS.small));

    return (
        <span className='stamp-confetti' aria-hidden='true'>
            {bits.map(bit => <span key={bit.key} className='stamp-confetti__bit' style={bit.style} />)}
            {amount > 0 && <span className='stamp-confetti__amount'>+{formatBonus(amount)} {bonusWord(amount)}</span>}
        </span>
    );
}
