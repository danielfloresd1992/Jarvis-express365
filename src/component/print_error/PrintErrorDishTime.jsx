export default function PrintErrorDish({ dish }) {

    const HOUR_NOW = new Date().getHours();
    const timeSelkectShift = HOUR_NOW >= 18 ? dish.timeLimit.night : dish.timeLimit.day;


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