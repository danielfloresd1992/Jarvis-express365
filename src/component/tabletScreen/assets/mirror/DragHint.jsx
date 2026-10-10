import Icon from '../Icon.jsx';


/*  LA PISTA DE ARRASTRE
 *
 *  Solo se pinta cuando de verdad hay imagen fuera de la vista: decirlo cuando no sobra nada que ver
 *  sería mentir.
 */
export default function DragHint() {
    return (
        <span className='hidden min-[480px]:flex items-center gap-1.5 text-[11px] text-jx-tinta2'>
            <Icon name='move' size={14} />
            Arrastra la imagen para moverte
        </span>
    );
}
