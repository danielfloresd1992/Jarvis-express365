import { createSlice } from "@reduxjs/toolkit";

export const render = createSlice({
    name: "render",
    initialState: null,
    reducers: {
        setRender: (state, action) => {
            const boolean = action.payload;
            return boolean;
        }
    }
});

export const { setRender } = render.actions;

export default render.reducer;