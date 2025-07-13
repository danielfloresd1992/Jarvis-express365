import { createSlice } from "@reduxjs/toolkit";

export const userReport = createSlice({
    name: "user",
    initialState: [],
    reducers: {
        setUserReport: (state, action) => {
            const users = action.payload;
            return users;
        }
    }
});

export const { setUserReport } = userReport.actions;

export default userReport.reducer;