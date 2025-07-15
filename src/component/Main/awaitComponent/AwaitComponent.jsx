import './style.css';


function Await({ config, close}){

    return(
        <>
            <div className={ config.open ? 'awaitContain' : 'hidden' } >
                <p className='textAwait' >{ config.text }</p>

                <div className='lds-roller'>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
            </div>
        </>
    );
}

export { Await };