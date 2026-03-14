



export default function LoadingPage() {
    return (
        <div style={{
            height: '100%',
            width: '100%',
            top: '0',
            position: 'fixed',
            backgroundColor: '#fff',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '1rem',
            }}>
                <img
                    style={{ animation: 'animateLogoLoading 2s ease-in infinite' }}
                    src='/logo-page-removebg.png'
                    width={100}
                    height={100}
                    alt='logo-bg_transparent'
                />
                <h3 style={{ color: '#676767', textAlign: 'center' }}>Cargando</h3>
            </div>
        </div>
    )
}