import ManagerButtons from './ManagerButtons.jsx';
import RegisterTouchTable from './RegisterTouchTable.jsx';


/*  LOS TOQUES DE UNA ROTACIÓN GUARDADA, DESPLEGADOS (pestaña «Registros»)
 *
 *  Se abren con la cápsula «N toques» de su fila (RegisterSavedRow). La misma tabla que en la pestaña Mesas
 *  (RegisterTouchTable, pedido del usuario): agrupados por gerente, con Inicio, Fin y lo que duró cada toque,
 *  lo que suma cada gerente y el total de la mesa al pie.
 *
 *  Arriba, los botones de los gerentes del local: cada clic apunta un toque nuevo, con la hora del clic y su
 *  hora de fin al azar, igual que en Mesas ('onAdd'). No salen en un pedido para llevar, que no lleva toques.
 *
 *  Un toque recuperado (recovered: true: se apuntó después, aquí en Registros) va en gris.
 *
 *  Las dos horas se corrigen con doble clic, y el cambio sale por 'onEdit' con el _id del toque. Un toque
 *  guardado antes de que la API les diera _id no se puede señalar: se lee, pero no se corrige ni se quita.
 */


// savedId = «el id de un toque guardado»: el que le dio la API
const savedId = (touch) => touch._id;


/*  @param {Array}    touches   los toques de la rotación, como los devuelve la API: [{ _id, ref, name, hourTouch, hourTouchFinish }]
 *  @param {Array}    managers  los botones de los gerentes del local: de ellos salen el orden y la placa
 *  @param {function} onEdit    corrige un dato: (data, id) — ver editSaved en Registers
 *  @param {function} onAdd     apunta un toque del gerente que recibe; sin ella no se puede añadir
 *  @param {function} onDelete  quita un toque: (id del toque)
 */
export default function RegisterSavedTouches({ touches, managers, onEdit, onAdd, onDelete }) {
    return (
        <div className='register-saved-touches' aria-label='Toques de gerente de esta mesa'>

            {
                onAdd && (
                    <div className='register-saved-touches__add'>
                        <span className='text-jx-tinta3'>Apuntar un toque:</span>
                        <ManagerButtons managers={managers} dimmed={false} onTouch={onAdd} />
                    </div>
                )
            }

            <RegisterTouchTable
                touches={touches}
                managers={managers}
                idOf={savedId}
                onWrite={(id, field, value) => onEdit({ [field]: value }, id)}
                onDelete={onDelete}
                emptyText={`Sin toques todavía${onAdd ? ': pulsa un gerente para apuntar uno' : ''}`}
            />

        </div>
    );
}
