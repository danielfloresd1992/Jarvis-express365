export default function LayautAlert({ eventForm, titleMenu, hiddenBtn = false, children }) {
    return (
        <form className='box-send' onSubmit={e => {
            e.preventDefault();
            eventForm(e);
        }
        }>
            <h2 style={{ color: 'rgb(255, 255, 255)', textDecoration: 'underline', textAlign: 'center' }}>{titleMenu}</h2>
            {children}
        </form>
    )
};