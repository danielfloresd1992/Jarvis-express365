import useAuthCheck from '../hook/useAuthCheck';
import LoadingPage from './loanding/loadingPage';


export default function AppInitializer({children}){

    const  { authChecked } = useAuthCheck();

    if(authChecked){
        return <LoadingPage />
    }

    return children;
}