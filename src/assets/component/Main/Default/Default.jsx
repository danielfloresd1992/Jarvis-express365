import './style.css';
import imageLogo from '../../../../../public/file.jpg';




function RenderDefault(){


    return (
        <>
            <div className="componentDefault">  
                <div className='componentDefault-titleContain'>
                    <h1 className='componentDefault-titleH1'>Seleccione unas de las opciones</h1>
                </div>
                
                <div className="componentDefault-animationContain">
                    <div className='container'>
                        <img style={{width: '30%'}} draggable='false' src={imageLogo} alt='paid' />
                    </div>
                </div>

            </div>
        </>
    );
}


export { RenderDefault };