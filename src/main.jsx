import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import store from "./store";
import { Provider } from "react-redux";
import { TitleBar } from "../electron/ui/TitleBar.jsx";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <TitleBar />
        <Provider store={store}>
            <App />
        </Provider>
    </React.StrictMode>
);