
import { configureStore } from '@reduxjs/toolkit'

import render from './slices/render.js';
import user from "./slices/user";
import users from './slices/usersReport.js';
import locals from './slices/locals';
import establishment from './slices/establishment.js'
import socketIo from "./slices/socketio";




export default configureStore({
    reducer: {
        render: render,
        locals : locals,
        users: users,
        user: user,
        io: socketIo,
        establishment: establishment
    }
});