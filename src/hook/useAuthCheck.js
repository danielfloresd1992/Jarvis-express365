import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '../store/slices/user';
import { confirmAuthentication } from '../libs/fetch_data/authFetch';
import { useNavigate } from 'react-router-dom';


export default function useAuthCheck() {

    const [authChecked, setAuthChecked] = useState(true);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    
   


    useEffect(() => {

        const checkAuth = async () => {
            try {
                const authenticated = await confirmAuthentication();
                console.log(authenticated);
                if (authenticated.statusText === 'OK') {
                    
                    dispatch(setUser(authenticated.data));
                    navigate('/home');
                }
            }
            catch (error) {
                console.log(error);
            }
            finally {
                setAuthChecked(false);
            }

        }


        checkAuth();
    }, []);



    return { authChecked };
};