export default function NavBar({ children }){

    return(
        <nav
            style={{
                backgroundColor: 'transparent',
                border: '2px solid rgb(203 10 179)',
                borderRadius: '10px',
                width: '100%',
                minHeight: '20px',
                display: 'flex',
                gap: '1rem',
                padding: '.5rem',
                justifyContent: 'center',
                alignItems: 'center',
                flexWrap: 'wrap'
            }}
        >
            { children }
        </nav>
    );
}