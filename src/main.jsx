import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import store from "./store";
import { Provider } from "react-redux";
import { TitleBar } from "../electron/ui/TitleBar.jsx";
import { TabletScreen } from "./component/tabletScreen/TabletScreen.jsx";

const root = ReactDOM.createRoot(document.getElementById("root"));

//  La ventana flotante carga con ?view=tablet -> renderiza SOLO TabletScreen
const view = new URLSearchParams(window.location.search).get("view");

if (view === "tablet") {
    root.render(
        <React.StrictMode>
            <TabletScreen floating />
        </React.StrictMode>
    );
}
else {
    root.render(
        <React.StrictMode>
            <TitleBar />
            <Provider store={store}>
                <App />
            </Provider>
        </React.StrictMode>
    );
}
