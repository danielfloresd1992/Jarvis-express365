
import { createSlice } from "@reduxjs/toolkit";

export const establishment = createSlice({
    name: "establishment",
    initialState: null,
    reducers: {
        setEstablishment: (state, action) => {
            const users = action.payload;
            return users;
        }
    }
});

export const { setEstablishment } = establishment.actions;

export default establishment.reducer;
