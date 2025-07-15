import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoutes(){

    
    const session = sessionStorage.getItem('session'); 
    
    if(session){
        return <Outlet/>
    } 
    else{ 
        return <Navigate to='/'/>
    }      
    
};                        
export { ProtectedRoutes };