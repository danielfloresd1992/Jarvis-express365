// 'shift' ('day' | 'night') es opcional: lo manda el formulario abierto desde Mesas, con el turno de la rotación, para
// decir el mismo tiempo con que se midió (checkTime, en Delay/tablet/model.js). Sin él, la hora del equipo.
export default function PrintErrorDish({ dish, shift }) {

    const HOUR_NOW = new Date().getHours();
    const night = shift ? shift === 'night' : HOUR_NOW >= 18;
    const timeSelkectShift = night ? dish.timeLimit.night : dish.timeLimit.day;


    return (
        <div
            style={{
                border: '1px solid red',
                borderRadius: '5px',
                margin: '1rem',
                padding: '.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '.5rem'
            }}
        >
            <p className='box-textHourResult' style={{ color: 'red' }}>Los tiempo no cumplen los criterios establecidos</p>

            <div style={{
                width: '100%'
            }}>
                <p className='box-textHourResult'>Toma de orden a listo en table debe ser mayor a {timeSelkectShift} en {dish.nameDishe}</p>
            </div>

            <p style={{
                fontSize: '.8rem',
                color: '#ffffff',
                textAlign: 'center',

            }}>Revise los tiempo detallada mente y corrija el error</p>
        </div>
    )
}