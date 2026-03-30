import { createSlice } from "@reduxjs/toolkit";

export const alert_line = createSlice({
    name: 'alert_line',
    initialState: [],
    reducers: {
        // Inserta si no existe el _id, actualiza si ya existe
        pushNotifications: (state, action) => {
            const incoming = action.payload;
            const existingIndex = state.findIndex(n => n.data?._id === incoming.data?._id);
            if (existingIndex !== -1) {
                state[existingIndex] = { ...state[existingIndex], data: incoming.data };
            } else {
                state.push(incoming);
            }
        },
        deleteNotifications: (state, action) => {
            const id = action.payload;
            return state.filter(n => n.id !== id);
        }
    }
});



export const { pushNotifications, deleteNotifications } = alert_line.actions;

export default alert_line.reducer;
