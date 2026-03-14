import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';




export function ProtectedRoutes({ children }) {

    const userSelector = useSelector((state) => state.user);

    if (!userSelector) return <Navigate to='/' />
    return children;
};                        