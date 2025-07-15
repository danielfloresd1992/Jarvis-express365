import logo from '../../../../public/img/LOGO-SLIDER.png';
import './style.css';


function BoxModal({ config, close }) {


    return (
        <>
            <div className={config.open ? 'awaitContain boxModal-contain' : 'hidden'}>
                <div className='boxModal-div'>
                    <div className='boxModal-titleContain'>
                        <h2 className='boxModal-title'>{config.text.title}</h2>
                    </div>
                    <div className='boxModal-descriptionContain'>
                        <p className='boxModal-description'>{config.text.description}</p>
                    </div>


                    <div className='boxModal-btnContain'>
                        <button className='asideComponent-btnAction boxModal-btnClose' onClick={() => close()}>cerrar</button>
                    </div>
                </div>
            </div>
        </>
    );
}

export { BoxModal };