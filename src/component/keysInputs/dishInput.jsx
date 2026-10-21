import { AddonSelect } from '../inputs/AddonField.jsx';


/*  EL PLATO DE LOS FORMULARIOS DE DEMORAS: [ Plato | plato fuerte ▾ ] (propuesta «C · Línea de tiempo»)
 *
 *  Los platos de la carta del local (Local.dishes). Devuelve el plato entero; si el local no tiene carta, un
 *  objeto con solo su nombre, como antes.
 *
 *  @param {Array}    dishes         la carta del local
 *  @param {function} onChangeEvent  recibe el plato elegido
 *  @param {object}   value          el plato elegido, o null
 */
export default function DishInputSelet({ dishes, onChangeEvent, value }) {

    const menu = Array.isArray(dishes) ? dishes : [];

    return (
        <AddonSelect
            id='ff-plato'
            label='Plato'
            value={value?.nameDishe ?? ''}
            required
            onChange={name => {
                if (menu.length > 0) onChangeEvent(menu.find(dish => dish.nameDishe === name));
                else onChangeEvent({ nameDishe: name });
            }}
        >
            <option value='' disabled>Elige el plato</option>
            {menu.map(dish => <option key={dish._id} value={dish.nameDishe}>{dish.nameDishe}</option>)}
        </AddonSelect>
    );
}
