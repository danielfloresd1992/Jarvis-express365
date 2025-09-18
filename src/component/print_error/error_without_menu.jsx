export default function ErrorWithoutMenu({ arr }) {

    console.log(arr);

    if (Array.isArray(arr) && arr.length < 1) {
        return (
            <div
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgb(0 0 0 / 82%)',
                    border: '1px solid red',
                    borderRadius: '5px',
                    margin: '1rem',
                    padding: '.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '.5rem'
                }}
            >
                <p className='box-textHourResult' style={{ color: 'red' }}>La configuración del establecimiento no cuenta con los criterios establecidos</p>

                <div style={{
                    width: '100%'
                }}>
                    <p className='box-textHourResult'>No existen colecciones disponible para esta acción</p>
                </div>

                <p style={{
                    fontSize: '.8rem',
                    color: '#ffffff',
                    textAlign: 'center',

                }}>Comuniquese con el administrador para corregir este problema</p>
            </div>
        )
    }
}