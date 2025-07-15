import logo1 from '../../public/logo1.png';



export default function Presentation() {

    return (
        <div style={{
            display: 'flex',
            height: '100%',
            width: '100%',
            position: 'absolute',
            alignItems: 'center',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '1rem',
            backgroundColor: '#fff'
        }}
        >


            <img style={{ width: '50%' }} src={logo1} alt='logo1' />
            <div>
                <p style={{ color: 'rgb(88 88 88)', fontWeight: '600' }}>¡Reporta al instante ya!</p>
            </div>

        </div>
    );
}