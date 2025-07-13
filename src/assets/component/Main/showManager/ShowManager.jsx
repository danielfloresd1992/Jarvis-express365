import { useEffect, useState } from 'react';
import axiosInstance from '../../../util/instanceAxios.js'
import URL from '../../api_conexion.js';
import { BoxManager } from './boxManager/BoxManager.jsx';



function ShowManager(){

    const [ managersState, setManagersState ] = useState(null);

    useEffect(() => {
        const idLocal = JSON.parse(localStorage.getItem('local_appExpress'))[0]._id;

        axiosInstance.get(`${URL}/local&manager/id=${idLocal}`)
            .then(response => {
                if(response.status === 200) setManagersState(response.data.managers);
            })
            .catch(err => {
                console.log(err);
            })
    }, []);


  
    return(
        <>
            <div className='componentmanager-contain'>
                <>
                    {
                        managersState ?
                            (
                                <>
                                <h1 className='componentmanager-title'> Lista de gerentes </h1>
                                <div className='componentmanager-boxContain' >
                                    {   
                                            managersState.map((data, index) => (
                                                    <BoxManager data={ data } key={ index } />
                                                )
                                            ) 
                                    }    
                                </div>
                                </>
                            )
                            :
                            (
                                <>
                                    <h1 className='componentmanager-title'>404, no existen registros</h1>
                                </>
                            )
                    }
                
                    
                </>
               
            </div>
        </>
    )
}

export { ShowManager };