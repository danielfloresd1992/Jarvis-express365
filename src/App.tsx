import './index.css';
import { lazy, Suspense, FC } from 'react';
import { HashRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { LoginUser } from './routes/form/Form.jsx';
import { ProtectedRoutes } from './component/ProtetedRouters.jsx';
import AppInitializer from './component/AppInitializer.jsx';
import LoadingPage from './component/loanding/loadingPage.jsx';
const Home = lazy(() => import('@/routes/Home/Home'));

import ModalData from './component/ModalData/ModalData.jsx';
import Raytracer from './component/Raytracer.jsx';



const NotFount: FC = () => (
    <div
        style={{
            width: '100%',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            gap: '0.5rem',
            background: 'linear-gradient(135deg, #f0f5ea 0%, #e7efdc 40%, #dde7cc 100%)',
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif"
        }}
    >
        <h1 style={{ color: '#2d5a00', fontSize: '4rem', fontWeight: 800, margin: 0 }}>404</h1>
        <p style={{ color: '#475569', fontSize: '1.1rem' }}><b>Página no encontrada</b></p>
    </div>
);



const App: FC = () => {
    return (
        <HashRouter>
            <AppInitializer>
                <div className="App">
                    <Routes>

                        <Route path={'/'} element={<LoginUser />} />


                        <Route
                            path={'/home'}
                            element={
                                <ProtectedRoutes>
                                    <Suspense fallback={<LoadingPage />}>
                                        <Home />
                                    </Suspense>
                                </ProtectedRoutes>
                            }
                        />

                        <Route path={'/ModalData'} element={
                            <ProtectedRoutes>
                                <ModalData />
                            </ProtectedRoutes>
                        }
                        />


                        <Route path="*" element={<NotFount />} />
                    </Routes>
                </div>
            </AppInitializer>
        </HashRouter>
    );
};



export default App;