export default function SpinerColor({ text }){

    return(
        <div 
            style={{
                position: 'absolute',
                top: '0',
                left: '0',
                height: '100%',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '1rem'
            }}
        >
            <div className='spinner'>

            </div>
            <p style={{ color: '#fff' }}> { text } </p>
        </div>
    )
}