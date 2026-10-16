
import { configureStore } from '@reduxjs/toolkit'

import render from './slices/render.js';
import user from "./slices/user";
import users from './slices/usersReport.js';
import locals from './slices/locals';
import establishment from './slices/establishment.js';
import alert_line from './slices/alert_line.js';
import socketIo from "./slices/socketio";
import reporteDemora from './slices/reporteDemora.js';
import boxModal from './slices/boxModal.js';




export const store = configureStore({
    reducer: {
        render: render,
        locals : locals,
        users: users,
        user: user,
        io: socketIo,
        establishment: establishment,
        alert_line: alert_line,
        reporteDemora: reporteDemora,
        boxModal: boxModal
    }
});

export default store;