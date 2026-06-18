import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { confirmAuthentication } from '../libs/fetch_data/authFetch'


export function ProtectedRoutes({ children }) {


    const userSelector = useSelector((state) => state.user);

  
    if (!userSelector) return <Navigate to='/' />
    return children;
};                        