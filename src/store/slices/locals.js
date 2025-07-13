
import { createSlice } from "@reduxjs/toolkit";

export const locals = createSlice({
    name: "locals",
    initialState: [],
    reducers: {
        setLocals: (state, action) => {
            const users = action.payload;
            return users;
        }
    }
});

export const { setLocals } = locals.actions;

export default locals.reducer;
