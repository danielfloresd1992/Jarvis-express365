import { createSlice } from "@reduxjs/toolkit";

export const user = createSlice({
    name: "user",
    initialState: null,
    reducers: {
        setUser: (state, action) => {
            const user = action.payload;
            return user;
        }
    }
});

export const { setUser } = user.actions;

export default user.reducer;