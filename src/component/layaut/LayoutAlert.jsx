export default function LayautAlert({ eventForm, titleMenu, children }) {
    return (
        <form className='box-send' onSubmit={e => {
            e.preventDefault();
            eventForm(e);
        }
        }>
            <h2 style={{ color: 'rgb(92 92 92)', textDecoration: 'underline', textAlign: 'center' }}>{titleMenu}</h2>
            {children}
        </form>
    )
};