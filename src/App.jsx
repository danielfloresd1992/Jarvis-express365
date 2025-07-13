import './index.css';
import { BrowserRouter, Routes ,Route,  } from "react-router-dom";
import "./App.css";
import { LoginUser } from './assets/component/Form/Form.jsx';
import { ProtectedRoutes } from './assets/component/ProtetedRouters.jsx';
import { Home } from './assets/component/Home/Home.jsx';
import { ModalData } from './assets/component/ModalData/ModalData.jsx';


function App() {

    function NotFount(){
        return(
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
                    <Route path={'/'} element={<LoginUser/>}/>
                    <Route element={<ProtectedRoutes/>}/>
                        <Route path={'/home'} element={<Home/>}/>
                        <Route path={'/ModalData'} element={<ModalData/>}/>
                        <Route path="*" element={<NotFount/>}>
                    </Route>
                </Routes>
            </div>
        </BrowserRouter>
  );
}

export default App;
