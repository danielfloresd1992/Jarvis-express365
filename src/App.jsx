import './index.css';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, } from "react-router-dom";
import "./App.css";
import { LoginUser } from './component/form/Form.jsx';
import { ProtectedRoutes } from './component/ProtetedRouters.jsx';

const Home = lazy(() => import('./routes/Home/Home.jsx'));
import ModalData from './component/ModalData/ModalData.jsx'; //from './component/ModalData/ModalData.jsx';



function App() {

    function NotFount() {
        return (
            <>
                <div style={
                    {
                        width: '100%',
                        height: '100vh',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'column',
                        color: '#fff',
                        backgroundColor: '#3b0035'
                    }
                }>
                    <h1
                        style={
                            {
                                color: '#fff'

                            }
                        }
                    >404</h1>
                    <p><b>Not fount</b></p>
                </div>
            </>)
    }


    return (
        <BrowserRouter>
            <div className="App">
                <Routes>
                    <Route path={'/'} element={<LoginUser />} />
                    <Route element={<ProtectedRoutes />} />



                    {/* Ruta con carga perezosa */}
                    <Route
                        path={'/home'}
                        element={
                            <Suspense fallback={<div>Cargando...</div>}>
                                <Home />
                            </Suspense>
                        }
                    />

                    <Route path={'/ModalData'} element={<ModalData />} />
                    <Route path="*" element={<NotFount />}>
                    </Route>
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
